'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Canvas from '@/components/Canvas';
import ColorPicker from '@/components/ColorPicker';
import { palettes, type PaletteName } from '@/lib/palettes';
import PaletteSwitcher from '@/components/PaletteSwitcher';
import { generateComposition, buildPath, type ShapeStyle } from '@/lib/patterns';
import { buildHitCanvas, hitTest } from '@/lib/hitDetect';
import { randomSeed } from '@/lib/prng';

/** Paint default: 10 min (22 shapes). */
const PAINT_DEFAULT_COUNT = 22;

/** Fill reveal: slower for a calmer, more breath-like feel. */
const FILL_REVEAL_MS = 1100;
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function PaintPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [palette, setPalette] = useState<PaletteName>('stone');
  const [style, setStyle] = useState<ShapeStyle>('paint');
  const [count, setCount] = useState(22);
  const [seed, setSeed] = useState(() => randomSeed());
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number } | null>(null);
  /** Per-shape color index (0–5) into current palette; null = unpainted */
  const [shapeColorIndices, setShapeColorIndices] = useState<(number | null)[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('');
  /** Palette color index for canvas background; null = use palette default */
  const [backgroundColorIndex, setBackgroundColorIndex] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState<'palettes' | 'actions' | null>(null);
  /** Sheet animation: closed | opening | open | closing (for enter/exit transition) */
  const [sheetAnimation, setSheetAnimation] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed');
  /** Keyboard: focused cell index. 0..shapes.length-1 = shape, shapes.length = background */
  const [focusedShapeIndex, setFocusedShapeIndex] = useState(0);
  /** True when user has used keyboard on the canvas — show focus ring only then */
  const [keyboardModality, setKeyboardModality] = useState(false);
  /** True when the canvas element has focus (tabbed to); hide dashed focus when blurred */
  const [canvasFocused, setCanvasFocused] = useState(false);
  /** Reduced motion: skip fill reveal and sheet animation */
  const [reducedMotion, setReducedMotion] = useState(false);
  /** Fill reveal: shape id -> { colorIndex, startTime }; cleared when progress >= 1 or composition reset */
  const animatingFillsRef = useRef<Record<number, { colorIndex: number; startTime: number }>>({});
  const [animationTick, setAnimationTick] = useState(0);
  const fillLoopRef = useRef<number | null>(null);
  const sheetCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validStyles: ShapeStyle[] = ['paint'];

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mql.matches);
    const handler = () => setReducedMotion(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    animatingFillsRef.current = {};
    if (fillLoopRef.current !== null) {
      cancelAnimationFrame(fillLoopRef.current);
      fillLoopRef.current = null;
    }
  }, [seed, style, count]);

  useEffect(() => {
    return () => {
      if (sheetCloseTimerRef.current !== null) clearTimeout(sheetCloseTimerRef.current);
      if (fillLoopRef.current !== null) cancelAnimationFrame(fillLoopRef.current);
    };
  }, []);

  useEffect(() => {
    if (sheetAnimation !== 'opening') return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setSheetAnimation('open'));
    });
    return () => cancelAnimationFrame(id);
  }, [sheetAnimation]);

  useEffect(() => {
    if (sheetAnimation !== 'closing') return;
    if (sheetCloseTimerRef.current !== null) clearTimeout(sheetCloseTimerRef.current);
    const duration = reducedMotion ? 0 : 400;
    sheetCloseTimerRef.current = setTimeout(() => {
      setSheetOpen(null);
      setSheetAnimation('closed');
    }, duration);
    return () => {
      if (sheetCloseTimerRef.current !== null) clearTimeout(sheetCloseTimerRef.current);
    };
  }, [sheetAnimation, reducedMotion]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (sheetOpen) setSheetAnimation('closing');
      else router.push('/compose');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [router, sheetOpen]);

  const startFillReveal = useCallback((shapeId: number, colorIndex: number) => {
    if (reducedMotion) return;
    animatingFillsRef.current[shapeId] = { colorIndex, startTime: performance.now() };
    function loop() {
      const now = performance.now();
      let anyRunning = false;
      for (const id of Object.keys(animatingFillsRef.current)) {
        const numId = Number(id);
        const data = animatingFillsRef.current[numId];
        if (!data) continue;
        const progress = Math.min(1, (now - data.startTime) / FILL_REVEAL_MS);
        if (progress >= 1) delete animatingFillsRef.current[numId];
        else anyRunning = true;
      }
      setAnimationTick((t) => t + 1);
      if (anyRunning) fillLoopRef.current = requestAnimationFrame(loop);
      else fillLoopRef.current = null;
    }
    if (fillLoopRef.current === null) fillLoopRef.current = requestAnimationFrame(loop);
  }, [reducedMotion]);

  useEffect(() => {
    const p = localStorage.getItem('palette') as PaletteName | null;
    const s = localStorage.getItem('style') as string | null;
    const sv = localStorage.getItem('lastSeed');

    if (p && p in palettes) setPalette(p as PaletteName);
    else if (p) setPalette('stone'); // migrate invalid stored palette (e.g. meadow, bloom)
    if (s) setStyle((s === 'blobs' ? 'paint' : validStyles.includes(s as ShapeStyle) ? s : 'paint') as ShapeStyle);
    setCount(PAINT_DEFAULT_COUNT);
    if (sv) setSeed(Number(sv));
  }, []);

  useEffect(() => {
    const pal = palettes[palette] ?? palettes.stone;
    const validPalette = palette in palettes ? palette : 'stone';
    if (!selectedColor || !pal.colors.includes(selectedColor as typeof pal.colors[number])) {
      setSelectedColor(pal.colors[0]);
    }
    localStorage.setItem('palette', validPalette);
    if (validPalette !== palette) setPalette('stone');
  }, [palette]); // eslint-disable-line react-hooks/exhaustive-deps

  const shapes = useMemo(() => {
    if (!canvasSize) return [];
    return generateComposition(seed, count, style, canvasSize.width, canvasSize.height);
  }, [seed, count, style, canvasSize]);

  useEffect(() => {
    if (shapes.length > 0) setShapeColorIndices(new Array(shapes.length).fill(null));
  }, [seed, style, shapes.length]);

  useEffect(() => {
    const maxIndex = shapes.length; /* 0..length-1 = shapes, length = background */
    if (focusedShapeIndex > maxIndex) setFocusedShapeIndex(Math.max(0, maxIndex));
  }, [shapes.length, focusedShapeIndex]);

  const paths = useMemo(() => {
    return shapes.map((s) => buildPath(s, style, seed));
  }, [shapes, style, seed]);

  /** Row/column focus order: top-left to bottom-right (left-to-right, then top-to-bottom). Indices into shapes[]. */
  const focusOrder = useMemo(() => {
    if (!canvasSize || shapes.length === 0) return [];
    const { width, height } = canvasSize;
    const cols = Math.ceil(Math.sqrt(shapes.length * (width / height)));
    const rows = Math.ceil(shapes.length / cols);
    const cellW = width / cols;
    const cellH = height / rows;
    return shapes
      .map((_, i) => i)
      .sort((a, b) => {
        const rowA = Math.floor(shapes[a].y / cellH);
        const colA = Math.floor(shapes[a].x / cellW);
        const rowB = Math.floor(shapes[b].y / cellH);
        const colB = Math.floor(shapes[b].x / cellW);
        return rowA !== rowB ? rowA - rowB : colA - colB;
      });
  }, [shapes, canvasSize]);

  const hitCanvas = useMemo(() => {
    if (!canvasSize || shapes.length === 0) return null;
    return buildHitCanvas(shapes, style, seed, canvasSize.width, canvasSize.height);
  }, [shapes, style, seed, canvasSize]);

  const handleResize = useCallback((w: number, h: number) => {
    setCanvasSize({ width: w, height: h });
  }, []);

  const pal = palettes[palette] ?? palettes.stone;
  const backgroundColor =
    backgroundColorIndex !== null ? pal.colors[backgroundColorIndex] : pal.background;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvasSize || shapes.length === 0 || paths.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    const outerR = 24;

    // Outer clip: background fills flush to the border-radius
    ctx.beginPath();
    ctx.moveTo(outerR, 0);
    ctx.arcTo(canvasSize.width, 0, canvasSize.width, canvasSize.height, outerR);
    ctx.arcTo(canvasSize.width, canvasSize.height, 0, canvasSize.height, outerR);
    ctx.arcTo(0, canvasSize.height, 0, 0, outerR);
    ctx.arcTo(0, 0, canvasSize.width, 0, outerR);
    ctx.closePath();
    ctx.clip();

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    const now = performance.now();
    for (let i = 0; i < shapes.length; i++) {
      const shapeId = shapes[i].id;
      const idx = shapeColorIndices[shapeId];
      if (idx === null || idx < 0 || idx >= pal.colors.length) continue;
      const anim = animatingFillsRef.current[shapeId];
      if (anim) {
        const progress = Math.min(1, (now - anim.startTime) / FILL_REVEAL_MS);
        const eased = easeOutCubic(progress);
        ctx.save();
        ctx.globalAlpha = eased;
        ctx.fillStyle = pal.colors[anim.colorIndex];
        ctx.fill(paths[i]);
        ctx.restore();
      } else {
        ctx.fillStyle = pal.colors[idx];
        ctx.fill(paths[i]);
      }
    }

    ctx.strokeStyle = pal.stroke;
    ctx.lineWidth = 1.5;
    for (const path of paths) {
      ctx.stroke(path);
    }

    // Keyboard focus indicator: only when canvas has focus and user has used keyboard
    const total = shapes.length;
    if (canvasFocused && keyboardModality && total > 0 && focusedShapeIndex >= 0 && focusedShapeIndex <= total) {
      ctx.save();
      if (focusedShapeIndex < total && focusOrder[focusedShapeIndex] !== undefined) {
        const shapeIdx = focusOrder[focusedShapeIndex];
        // Shape: light halo then dashed dark stroke so it reads on any fill
        ctx.strokeStyle = 'rgba(255,255,255,0.95)';
        ctx.lineWidth = 5;
        ctx.stroke(paths[shapeIdx]);
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.stroke(paths[shapeIdx]);
      } else {
        // Background focused: dashed rect inset from clip
        const inset = 4;
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(outerR + inset, inset);
        ctx.arcTo(canvasSize.width - inset, inset, canvasSize.width - inset, canvasSize.height - inset, outerR - inset);
        ctx.arcTo(canvasSize.width - inset, canvasSize.height - inset, inset, canvasSize.height - inset, outerR - inset);
        ctx.arcTo(inset, canvasSize.height - inset, inset, inset, outerR - inset);
        ctx.arcTo(inset, inset, canvasSize.width - inset, inset, outerR - inset);
        ctx.closePath();
        ctx.stroke();
        ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
  }, [shapes, paths, shapeColorIndices, backgroundColor, palette, canvasSize, pal, focusedShapeIndex, focusOrder, keyboardModality, canvasFocused, animationTick]);

  function handlePointerDown() {
    setKeyboardModality(false);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!hitCanvas || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = hitTest(hitCanvas, x, y);
    const colorIndex = pal.colors.indexOf(selectedColor);
    if (colorIndex < 0) return;
    if (id !== null) {
      const focusIdx = focusOrder.indexOf(id);
      setFocusedShapeIndex(focusIdx >= 0 ? focusIdx : 0);
      startFillReveal(id, colorIndex);
      setShapeColorIndices((prev) => {
        const next = [...prev];
        next[id] = colorIndex;
        return next;
      });
    } else {
      setFocusedShapeIndex(shapes.length);
      setBackgroundColorIndex(colorIndex);
    }
  }

  function handleCanvasKeyDown(e: React.KeyboardEvent<HTMLCanvasElement>) {
    setKeyboardModality(true);
    const total = shapes.length;
    const maxIndex = total; /* 0..total-1 = shapes, total = background */
    if (maxIndex === 0) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedShapeIndex((prev) => (prev + 1) % (maxIndex + 1));
      return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedShapeIndex((prev) => (prev - 1 + (maxIndex + 1)) % (maxIndex + 1));
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const colorIndex = pal.colors.indexOf(selectedColor);
      if (colorIndex < 0) return;
      if (focusedShapeIndex < total && focusOrder[focusedShapeIndex] !== undefined) {
        const shapeIdx = focusOrder[focusedShapeIndex];
        const shapeId = shapes[shapeIdx].id;
        startFillReveal(shapeId, colorIndex);
        setShapeColorIndices((prev) => {
          const next = [...prev];
          next[shapeIdx] = colorIndex;
          return next;
        });
      } else {
        setBackgroundColorIndex(colorIndex);
      }
    }
  }

  function newComposition() {
    const s = randomSeed();
    setSeed(s);
    localStorage.setItem('lastSeed', String(s));
  }

  function clearComposition() {
    animatingFillsRef.current = {};
    if (fillLoopRef.current !== null) {
      cancelAnimationFrame(fillLoopRef.current);
      fillLoopRef.current = null;
    }
    setShapeColorIndices(new Array(shapes.length).fill(null));
    setBackgroundColorIndex(null);
  }

  const filled = shapeColorIndices.filter((i): i is number => i !== null).length;
  const total = shapes.length;

  return (
    <main
      className="flex flex-col relative z-[1] min-w-0"
      style={{
        height: '100dvh',
        backgroundColor: 'white',
        color: pal.stroke,
        overflow: 'hidden',
      }}
    >
      <div className="flex-1 min-h-0 p-4 sm:p-6 md:p-8">
        <div className="relative w-full h-full">
          <Canvas
            ref={canvasRef}
            onResize={handleResize}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onKeyDown={handleCanvasKeyDown}
            onFocus={() => setCanvasFocused(true)}
            onBlur={() => setCanvasFocused(false)}
            tabIndex={0}
            canvasStyle={{ touchAction: 'none', cursor: 'crosshair', display: 'block' }}
            aria-label={
              total === 0
                ? 'Pattern composition'
                : focusedShapeIndex < total && focusOrder[focusedShapeIndex] !== undefined
                  ? `Shape ${focusedShapeIndex + 1} of ${total}, ${shapeColorIndices[focusOrder[focusedShapeIndex]] !== null ? 'painted' : 'unpainted'}. ${filled} of ${total} filled. Arrow keys to move, Enter or Space to paint.`
                  : `Background. ${filled} of ${total} shapes filled. Arrow keys to move, Enter or Space to paint.`
            }
            className="w-full h-full"
          />
          {/* Inset border overlay — renders on top of canvas so edge shape strokes
              are covered, keeping the border reading as exactly 1.5px */}
          <div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{ boxShadow: `inset 0 0 0 1.5px ${pal.stroke}` }}
          />
        </div>
      </div>

      {/* Mobile/medium: row 1 = color swatches; row 2 = Palettes + Actions. Large: single row. */}
      <div
        className="text-body flex-none px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 rounded-t-2xl sm:rounded-t-[2rem] flex flex-col gap-5 lg:gap-4 lg:flex-row lg:items-center lg:justify-between"
        style={{
          backgroundColor: 'white',
          color: 'var(--text)',
          border: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        {/* Mobile/medium: row 1 — color swatches only (always exposed) */}
        <div className="flex lg:hidden justify-center items-center min-w-0">
          <ColorPicker
            palette={pal}
            selected={selectedColor}
            onSelect={setSelectedColor}
            size="large"
          />
        </div>
        {/* Mobile/medium: row 2 — Palettes + Actions (each opens a sheet) */}
        <div className="flex lg:hidden flex-row items-center justify-center gap-4">
          <Button
            variant="secondary"
            onClick={() => {
              setSheetOpen('palettes');
              setSheetAnimation(reducedMotion ? 'open' : 'opening');
            }}
            stroke="var(--text)"
            className="min-h-[44px] flex-1"
          >
            Palettes
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setSheetOpen('actions');
              setSheetAnimation(reducedMotion ? 'open' : 'opening');
            }}
            stroke="var(--text)"
            className="min-h-[44px] flex-1"
          >
            Actions
          </Button>
        </div>

        {/* Large screens: palette left, color swatches center, actions right */}
        <div className="hidden lg:flex flex-row items-center justify-between flex-1 min-w-0 gap-4 w-full">
          <div className="shrink-0">
            <PaletteSwitcher value={palette} onChange={setPalette} stroke="var(--text)" />
          </div>
          <div className="flex-1 flex justify-center items-center min-w-0">
            <ColorPicker
              palette={pal}
              selected={selectedColor}
              onSelect={setSelectedColor}
            />
          </div>
          <div className="flex flex-row items-center gap-4 shrink-0">
            <Button variant="secondary" onClick={clearComposition} className="whitespace-nowrap shrink-0">
              Clear
            </Button>
            <Button variant="secondary" onClick={newComposition} className="whitespace-nowrap shrink-0">
              New
            </Button>
            <Button variant="primary" onClick={() => router.push('/compose')} className="whitespace-nowrap shrink-0">
              Exit
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile/medium: bottom sheets — Palettes or Actions */}
      {sheetOpen && (
        <>
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-20 lg:hidden"
            style={{
              backgroundColor: 'rgba(0,0,0,0.3)',
              transition: reducedMotion ? 'none' : 'opacity 400ms cubic-bezier(0.33, 1, 0.68, 1)',
              opacity: sheetAnimation === 'open' ? 1 : 0,
            }}
            onClick={() => setSheetAnimation('closing')}
          />
          <div
            role="dialog"
            aria-label={sheetOpen === 'palettes' ? 'Choose palette' : 'Actions'}
            className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.12)] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            style={{
              transition: reducedMotion ? 'none' : 'transform 400ms cubic-bezier(0.33, 1, 0.68, 1), opacity 400ms cubic-bezier(0.33, 1, 0.68, 1)',
              transform: sheetAnimation === 'open' ? 'translateY(0)' : 'translateY(20px)',
              opacity: sheetAnimation === 'open' ? 1 : 0,
            }}
          >
            <div className="w-10 h-1 rounded-full bg-black/15 mx-auto mb-6" aria-hidden />
            {sheetOpen === 'palettes' && (
              <div className="flex flex-col">
                <div className="flex flex-col gap-3">
                  <h3 className="text-heading">Palette</h3>
                  <PaletteSwitcher value={palette} onChange={setPalette} stroke="var(--text)" />
                </div>
                <div className="flex flex-col gap-5 mt-10 mb-6">
                  <h3 className="text-heading">Preview</h3>
                  <div
                    role="img"
                    aria-label={`${palette} palette colors`}
                    className="flex gap-3 items-center flex-wrap"
                  >
                    {pal.colors.map((color) => (
                      <span
                        key={color}
                        className="w-8 h-8 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <Button
                  variant="primary"
                  onClick={() => setSheetAnimation('closing')}
                  className="w-full min-h-[48px] mt-4"
                >
                  Change palette
                </Button>
              </div>
            )}
            {sheetOpen === 'actions' && (
              <div className="flex flex-col gap-3">
                <Button
                  variant="secondary"
                  onClick={() => { newComposition(); setSheetAnimation('closing'); }}
                  className="w-full min-h-[48px]"
                >
                  New
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => { clearComposition(); setSheetAnimation('closing'); }}
                  className="w-full min-h-[48px]"
                >
                  Clear
                </Button>
                <Button
                  variant="primary"
                  onClick={() => router.push('/compose')}
                  className="w-full min-h-[48px]"
                >
                  Exit
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
