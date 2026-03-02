'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  mulberry32,
  makeMask,
  getWeavingOrder,
  getVerticalWeavingOrder,
  getDesignColor,
  isBorder,
  WEAVING_PALETTES,
  WEAVING_PALETTE_ORDER,
  type WeavingColorHSL,
  type WeavingPaletteName,
} from '@/lib/weaving';
import Button from '@/components/Button';
import Canvas from '@/components/Canvas';
import WeavingPaletteSwitcher from '@/components/WeavingPaletteSwitcher';
import { renderCanvas, type WeavingRenderParams } from '@/lib/weavingRender';

const REVEAL_BATCH_SIZE = 18;
const REVEAL_BATCH_MS = 32;
const SHUTTLE_CELL_MS = 52;
const COMPLETION_DELAY_MS = 280;
/** Minimum row duration so short rows still feel like a breath. */
const MIN_ROW_DURATION_MS = 580;

/** Smooth ease-in-out: gentle start and end, no sudden acceleration. */
function easeInOutSine(t: number): number {
  return (1 - Math.cos(t * Math.PI)) / 2;
}

export default function WeavePage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [weavingPaletteName, setWeavingPaletteName] = useState<WeavingPaletteName>('drift');
  const [seed, setSeed] = useState(7);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number } | null>(null);
  const [fitSize, setFitSize] = useState<{ width: number; height: number } | null>(null);
  const [gridSize, setGridSize] = useState({ rows: 14, cols: 20 }); // cols adjusted to 13 on mobile
  const [sheetOpen, setSheetOpen] = useState<'palettes' | 'actions' | null>(null);
  const [sheetAnimation, setSheetAnimation] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed');
  const [reducedMotion, setReducedMotion] = useState(false);
  const sheetCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [canvasHasFocus, setCanvasHasFocus] = useState(false);
  const [keyboardModality, setKeyboardModality] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mql.matches);
    const handler = () => setReducedMotion(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
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
    return () => {
      if (sheetCloseTimerRef.current !== null) clearTimeout(sheetCloseTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (sheetOpen) setSheetAnimation('closing');
      else router.push('/compose');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [router, sheetOpen]);

  useEffect(() => {
    const stored = localStorage.getItem('weavingPalette') as WeavingPaletteName | null;
    if (stored && WEAVING_PALETTE_ORDER.includes(stored)) setWeavingPaletteName(stored);
  }, []);

  useEffect(() => {
    localStorage.setItem('weavingPalette', weavingPaletteName);
  }, [weavingPaletteName]);

  const palette = WEAVING_PALETTES[weavingPaletteName];

  /** WCAG-compliant stroke for empty row/column dashed bar (theme-based) */
  const emptyRowDashedStroke = useMemo(() => {
    if (palette.dark) return 'rgba(255,255,255,0.52)';
    if (typeof document === 'undefined') return 'rgba(26,26,24,0.48)';
    const fg = getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim();
    const hex = fg.startsWith('#') ? fg : '#1a1a18';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},0.48)`;
  }, [palette.dark]);

  const { rows, cols } = gridSize;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const { width: w, height: h } = entries[0]?.contentRect ?? { width: 0, height: 0 };
      if (w <= 0 || h <= 0) return;
      // On mobile use a half-scale grid (same 10:7 aspect ratio) so cells are ~39px —
      // large enough for comfortable tap targets. Desktop keeps the full 20×14 grid.
      const r = 14;
      const c = w < 640 ? 13 : 20;
      setGridSize(prev => prev.rows === r && prev.cols === c ? prev : { rows: r, cols: c });
      const aspect = c / r;
      const fitW = Math.min(w, h * aspect);
      const fitH = fitW / aspect;
      setFitSize({ width: fitW, height: fitH });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const { compType, designMotif, colors, mask, prefilledMask, weavingOrder, verticalWeavingOrder, patternGrid } =
    useMemo(() => {
      const rng = mulberry32(seed);
      const compType = Math.floor(rng() * 9);
      const designMotif = Math.floor(rng() * 11);
      const shuffled = [...palette.colors].sort(() => rng() - 0.5);
      const colors = shuffled;
      const mask = makeMask(compType, rows, cols);
      const prefilledMask = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => false)
      );
      const weavingOrder = getWeavingOrder(compType, rows, mask, prefilledMask);
      const verticalWeavingOrder = getVerticalWeavingOrder(cols, mask);
      const patternGrid: (WeavingColorHSL | null)[][] = Array.from(
        { length: rows },
        (_, r) =>
          Array.from({ length: cols }, (_, c) =>
            mask[r][c]
              ? getDesignColor(
                  r,
                  c,
                  rows,
                  cols,
                  designMotif,
                  colors,
                  isBorder(r, c, mask, rows, cols)
                )
              : null
          )
      );
      return {
        compType,
        designMotif,
        colors,
        mask,
        prefilledMask,
        weavingOrder,
        verticalWeavingOrder,
        patternGrid,
      };
    }, [seed, palette, rows, cols]);

  const weaveMotif = 0;

  const { cellW, cellH, canvasW, canvasH } = useMemo(() => {
    if (!canvasSize) return { cellW: 0, cellH: 0, canvasW: 0, canvasH: 0 };
    const cellW = canvasSize.width / cols;
    const cellH = canvasSize.height / rows;
    return {
      cellW,
      cellH,
      canvasW: canvasSize.width,
      canvasH: canvasSize.height,
    };
  }, [canvasSize, cols, rows]);

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  const handleResize = useCallback((width: number, height: number) => {
    setCanvasSize({ width, height });
  }, []);
  const rafRef = useRef<number | null>(null);
  const revealRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const animationWovenThisRowRef = useRef<Record<string, WeavingColorHSL>>({});

  const [woven, setWoven] = useState<Record<string, WeavingColorHSL>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [orderIndex, setOrderIndex] = useState(0);
  const [shuttleRow, setShuttleRow] = useState(-1);
  const [shuttleCol, setShuttleCol] = useState(-1);
  const [weaving, setWeaving] = useState(false);
  const [done, setDone] = useState(false);
  const [phase, setPhase] = useState<'horizontal' | 'vertical'>('horizontal');
  const [verticalWoven, setVerticalWoven] = useState<Record<string, WeavingColorHSL>>({});
  const [verticalOrderIndex, setVerticalOrderIndex] = useState(0);

  useEffect(() => {
    revealRefs.current.forEach(clearTimeout);
    revealRefs.current = [];
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    setWoven({});
    setRevealed({});
    setOrderIndex(0);
    setShuttleRow(-1);
    setShuttleCol(-1);
    setWeaving(false);
    setDone(false);
    setPhase('horizontal');
    setVerticalWoven({});
    setVerticalOrderIndex(0);

    const cells: [number, number][] = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (prefilledMask[r][c]) cells.push([r, c]);
    for (let i = 0; i < cells.length; i += REVEAL_BATCH_SIZE) {
      const batch = cells.slice(i, i + REVEAL_BATCH_SIZE);
      const t = setTimeout(() => {
        setRevealed((p) => ({
          ...p,
          ...Object.fromEntries(batch.map(([r, c]) => [`${r}-${c}`, true])),
        }));
      }, 40 + (i / REVEAL_BATCH_SIZE) * REVEAL_BATCH_MS);
      revealRefs.current.push(t);
    }
  }, [seed, weavingPaletteName, rows, cols, prefilledMask]);

  useEffect(() => {
    if (weaving) return;
    const canvas = canvasRef.current;
    if (!canvas || !canvasSize || canvasW <= 0 || canvasH <= 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    ctx.save();
    ctx.scale(dpr, dpr);
    const params: WeavingRenderParams = {
      ctx,
      rows,
      cols,
      cellW,
      cellH,
      palette,
      weaveMotif,
      designMotif,
      colors,
      mask,
      prefilledMask,
      patternGrid,
      woven,
      revealed,
      shuttleRow,
      shuttleCol,
      orderIndex,
      weavingOrder,
      weaving,
      completionMoment: done,
      seed,
      canvasWidth: canvasSize.width,
      canvasHeight: canvasSize.height,
      fabricInset: 0.07,
      devicePixelRatio: dpr,
      verticalWoven,
      verticalWeaving: false,
      isVerticalPhase: phase === 'vertical',
      verticalWeavingOrder,
      verticalOrderIndex,
      canvasFocused: canvasHasFocus && keyboardModality,
      emptyRowDashedStroke,
    };
    renderCanvas(params);
    ctx.restore();
  }, [
    canvasSize,
    canvasW,
    canvasH,
    woven,
    revealed,
    shuttleRow,
    shuttleCol,
    orderIndex,
    weaving,
    done,
    seed,
    weavingPaletteName,
    palette,
    cellW,
    cellH,
    dpr,
    rows,
    cols,
    weaveMotif,
    designMotif,
    colors,
    mask,
    prefilledMask,
    patternGrid,
    weavingOrder,
    verticalWoven,
    phase,
    verticalWeavingOrder,
    verticalOrderIndex,
    canvasHasFocus,
    keyboardModality,
    emptyRowDashedStroke,
  ]);

  const isComplete = orderIndex >= weavingOrder.length;
  const nextRow = isComplete ? -1 : weavingOrder[orderIndex];

  const weaveRow = useCallback(() => {
    if (weaving || isComplete) return;
    const r = nextRow;
    const cells = Array.from({ length: cols }, (_, c) => c).filter(
      (c) => mask[r][c]
    );
    const ltr = orderIndex % 2 === 0;
    const ordered = ltr ? cells : [...cells].reverse();
    if (ordered.length === 0) {
      setOrderIndex((i) => i + 1);
      return;
    }

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      const next: Record<string, WeavingColorHSL> = {};
      for (const c of ordered) next[`${r}-${c}`] = patternGrid[r][c]!;
      setWoven((p) => ({ ...p, ...next }));
      setOrderIndex((i) => {
        const ni = i + 1;
        if (ni >= weavingOrder.length)
          setTimeout(() => setPhase('vertical'), COMPLETION_DELAY_MS);
        return ni;
      });
      return;
    }

    setWeaving(true);
    animationWovenThisRowRef.current = {};
    const duration = Math.max(
      MIN_ROW_DURATION_MS,
      ordered.length * SHUTTLE_CELL_MS
    );
    const start = performance.now();
    let lastIdx = -1;

    const drawFrame = (mergedWoven: Record<string, WeavingColorHSL>, shuttleColFloat: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !canvasSize || canvasW <= 0 || canvasH <= 0) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      ctx.save();
      ctx.scale(dpr, dpr);
      renderCanvas({
        ctx,
        rows,
        cols,
        cellW,
        cellH,
        palette,
        weaveMotif,
        designMotif,
        colors,
        mask,
        prefilledMask,
        patternGrid,
        woven: mergedWoven,
        revealed,
        shuttleRow: r,
        shuttleCol: -1,
        shuttleColFloat,
        orderIndex,
        weavingOrder,
        weaving: true,
        completionMoment: false,
        seed,
        canvasWidth: canvasSize.width,
        canvasHeight: canvasSize.height,
        fabricInset: 0.07,
        devicePixelRatio: dpr,
        emptyRowDashedStroke,
      });
      ctx.restore();
    };

    const tick = (now: number) => {
      const elapsed = now - start;
      const linear = Math.min(elapsed / duration, 1);
      const progress = easeInOutSine(linear);
      const idx = Math.min(
        Math.floor(progress * ordered.length),
        ordered.length - 1
      );
      if (idx > lastIdx) {
        const next: Record<string, WeavingColorHSL> = {};
        for (let i = lastIdx + 1; i <= idx; i++) {
          const c = ordered[i];
          next[`${r}-${c}`] = patternGrid[r][c]!;
        }
        lastIdx = idx;
        animationWovenThisRowRef.current = {
          ...animationWovenThisRowRef.current,
          ...next,
        };
      }

      const logicalIndex = progress * Math.max(0, ordered.length - 1);
      const idx0 = Math.floor(logicalIndex);
      const idx1 = Math.min(idx0 + 1, ordered.length - 1);
      const shuttleColFloat =
        ordered.length === 1
          ? ordered[0]!
          : ordered[idx0]! +
            (logicalIndex - idx0) * (ordered[idx1]! - ordered[idx0]!);

      const mergedWoven = { ...woven, ...animationWovenThisRowRef.current };
      drawFrame(mergedWoven, shuttleColFloat);

      if (progress >= 1) {
        rafRef.current = null;
        setWoven((p) => ({ ...p, ...animationWovenThisRowRef.current }));
        setWeaving(false);
        setOrderIndex((i) => {
          const ni = i + 1;
          if (ni >= weavingOrder.length)
            setTimeout(() => setPhase('vertical'), COMPLETION_DELAY_MS);
          return ni;
        });
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    tick(start);
  }, [
    weaving,
    isComplete,
    nextRow,
    orderIndex,
    cols,
    mask,
    patternGrid,
    weavingOrder,
    woven,
    revealed,
    canvasSize,
    canvasW,
    canvasH,
    cellW,
    cellH,
    dpr,
    rows,
    palette,
    designMotif,
    colors,
    prefilledMask,
    seed,
    emptyRowDashedStroke,
  ]);

  const verticalIsComplete = verticalOrderIndex >= verticalWeavingOrder.length;
  const nextCol = verticalIsComplete ? -1 : verticalWeavingOrder[verticalOrderIndex];

  const weaveCol = useCallback(() => {
    if (weaving || verticalIsComplete) return;
    const c = nextCol;
    const cells = Array.from({ length: rows }, (_, r) => r).filter(
      (r) => mask[r][c]
    );
    const ttb = verticalOrderIndex % 2 === 0;
    const ordered = ttb ? cells : [...cells].reverse();
    if (ordered.length === 0) {
      setVerticalOrderIndex((i) => i + 1);
      return;
    }

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      const next: Record<string, WeavingColorHSL> = {};
      for (const r of ordered) next[`${r}-${c}`] = patternGrid[r][c]!;
      setVerticalWoven((p) => ({ ...p, ...next }));
      setVerticalOrderIndex((i) => {
        const ni = i + 1;
        if (ni >= verticalWeavingOrder.length)
          setTimeout(() => setDone(true), COMPLETION_DELAY_MS);
        return ni;
      });
      return;
    }

    setWeaving(true);
    animationWovenThisRowRef.current = {};
    const duration = Math.max(
      MIN_ROW_DURATION_MS,
      ordered.length * SHUTTLE_CELL_MS
    );
    const start = performance.now();
    let lastIdx = -1;

    const drawFrame = (mergedVerticalWoven: Record<string, WeavingColorHSL>, shuttleRowFloat: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !canvasSize || canvasW <= 0 || canvasH <= 0) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      ctx.save();
      ctx.scale(dpr, dpr);
      renderCanvas({
        ctx,
        rows,
        cols,
        cellW,
        cellH,
        palette,
        weaveMotif,
        designMotif,
        colors,
        mask,
        prefilledMask,
        patternGrid,
        woven,
        revealed,
        shuttleRow: -1,
        shuttleCol: -1,
        orderIndex: weavingOrder.length,
        weavingOrder,
        weaving: false,
        completionMoment: false,
        seed,
        canvasWidth: canvasSize.width,
        canvasHeight: canvasSize.height,
        fabricInset: 0.07,
        devicePixelRatio: dpr,
        verticalWoven: mergedVerticalWoven,
        verticalWeaving: true,
        verticalShuttleCol: c,
        shuttleRowFloat,
        verticalWeavingOrder,
        verticalOrderIndex,
        isVerticalPhase: true,
        emptyRowDashedStroke,
      });
      ctx.restore();
    };

    const tick = (now: number) => {
      const elapsed = now - start;
      const linear = Math.min(elapsed / duration, 1);
      const progress = easeInOutSine(linear);
      const idx = Math.min(
        Math.floor(progress * ordered.length),
        ordered.length - 1
      );
      if (idx > lastIdx) {
        const next: Record<string, WeavingColorHSL> = {};
        for (let i = lastIdx + 1; i <= idx; i++) {
          const r = ordered[i];
          next[`${r}-${c}`] = patternGrid[r][c]!;
        }
        lastIdx = idx;
        animationWovenThisRowRef.current = {
          ...animationWovenThisRowRef.current,
          ...next,
        };
      }

      const logicalIndex = progress * Math.max(0, ordered.length - 1);
      const idx0 = Math.floor(logicalIndex);
      const idx1 = Math.min(idx0 + 1, ordered.length - 1);
      const shuttleRowFloat =
        ordered.length === 1
          ? ordered[0]!
          : ordered[idx0]! +
            (logicalIndex - idx0) * (ordered[idx1]! - ordered[idx0]!);

      const mergedVerticalWoven = { ...verticalWoven, ...animationWovenThisRowRef.current };
      drawFrame(mergedVerticalWoven, shuttleRowFloat);

      if (progress >= 1) {
        rafRef.current = null;
        setVerticalWoven((p) => ({ ...p, ...animationWovenThisRowRef.current }));
        setWeaving(false);
        setVerticalOrderIndex((i) => {
          const ni = i + 1;
          if (ni >= verticalWeavingOrder.length)
            setTimeout(() => setDone(true), COMPLETION_DELAY_MS);
          return ni;
        });
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    tick(start);
  }, [
    weaving,
    verticalIsComplete,
    nextCol,
    verticalOrderIndex,
    rows,
    mask,
    patternGrid,
    verticalWeavingOrder,
    verticalWoven,
    woven,
    revealed,
    canvasSize,
    canvasW,
    canvasH,
    cellW,
    cellH,
    dpr,
    cols,
    palette,
    designMotif,
    colors,
    prefilledMask,
    seed,
    weavingOrder,
    emptyRowDashedStroke,
  ]);

  const handleNew = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    setSeed((s) => s + 1);
    setDone(false);
  }, []);

  const clearWeaving = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    revealRefs.current.forEach(clearTimeout);
    revealRefs.current = [];
    setWoven({});
    setRevealed({});
    setOrderIndex(0);
    setShuttleRow(-1);
    setShuttleCol(-1);
    setWeaving(false);
    setDone(false);
    setPhase('horizontal');
    setVerticalWoven({});
    setVerticalOrderIndex(0);
    const cells: [number, number][] = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (prefilledMask[r][c]) cells.push([r, c]);
    for (let i = 0; i < cells.length; i += REVEAL_BATCH_SIZE) {
      const batch = cells.slice(i, i + REVEAL_BATCH_SIZE);
      const t = setTimeout(() => {
        setRevealed((p) => ({
          ...p,
          ...Object.fromEntries(batch.map(([r, c]) => [`${r}-${c}`, true])),
        }));
      }, 40 + (i / REVEAL_BATCH_SIZE) * REVEAL_BATCH_MS);
      revealRefs.current.push(t);
    }
  }, [rows, cols, prefilledMask]);

  const pct =
    weavingOrder.length > 0
      ? Math.round((orderIndex / weavingOrder.length) * 100)
      : 0;

  const vertPct =
    verticalWeavingOrder.length > 0
      ? Math.round((verticalOrderIndex / verticalWeavingOrder.length) * 100)
      : 0;


  const canTap =
    !weaving &&
    ((phase === 'horizontal' && !isComplete && nextRow >= 0) ||
      (phase === 'vertical' && !verticalIsComplete && nextCol >= 0));

  return (
    <main
      className="flex flex-col relative z-[1] min-w-0"
      style={{
        height: '100dvh',
        backgroundColor: 'white',
        color: 'var(--text)',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <div
        ref={containerRef}
        className="flex-1 min-h-0 sm:p-4 md:p-6 lg:p-8 flex items-center justify-center"
      >
        {fitSize && fitSize.width > 0 && fitSize.height > 0 && (
          <div
            style={{ width: fitSize.width, height: fitSize.height, margin: 'auto' }}
            className="flex-shrink-0"
          >
            <Canvas
              ref={canvasRef}
              onResize={handleResize}
              onPointerDown={() => setKeyboardModality(false)}
              onPointerUp={() => {
                if (phase === 'horizontal' && !weaving && !isComplete && nextRow >= 0) weaveRow();
                else if (phase === 'vertical' && !weaving && !verticalIsComplete && nextCol >= 0) weaveCol();
              }}
              onKeyDown={(e) => {
                setKeyboardModality(true);
                if (e.key !== 'Enter' && e.key !== ' ') return;
                e.preventDefault();
                if (phase === 'horizontal' && !weaving && !isComplete && nextRow >= 0) weaveRow();
                else if (phase === 'vertical' && !weaving && !verticalIsComplete && nextCol >= 0) weaveCol();
              }}
              onFocus={() => setCanvasHasFocus(true)}
              onBlur={() => setCanvasHasFocus(false)}
              tabIndex={0}
              keyboardModality={keyboardModality}
              hideFocusRing
              canvasStyle={{
                touchAction: 'none',
                cursor: canTap ? 'crosshair' : 'default',
                display: 'block',
              }}
              aria-label={`Weave: ${phase === 'vertical' ? vertPct : pct}% complete. ${canTap ? 'Press Enter or Space to weave next ' + (phase === 'horizontal' ? 'row' : 'column') + '.' : ''}`}
              className="w-full h-full"
            />
          </div>
        )}
      </div>

      {/* Mobile/medium: row 1 = palette preview; row 2 = Palettes + Actions. Large: single row. */}
      <div
        className="text-body flex-none px-4 py-3 sm:px-6 sm:py-4 lg:pl-8 lg:pr-10 lg:py-6 rounded-t-2xl sm:rounded-t-[2rem] flex flex-col gap-3 sm:gap-4 lg:gap-4 lg:flex-row lg:items-center lg:justify-between"
        style={{
          backgroundColor: 'white',
          color: 'var(--text)',
          border: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        {/* Mobile/medium: row 1 — palette color preview (always exposed) */}
        <div className="flex lg:hidden justify-center items-center min-w-0">
          <div
            role="img"
            aria-label={`${palette.name} palette colors`}
            className="flex gap-2 items-center flex-wrap justify-center"
          >
            {palette.colors.map((c, i) => (
              <span
                key={i}
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-black/10 shrink-0"
                style={{ backgroundColor: `hsl(${c.h}, ${c.s}%, ${c.l}%)` }}
              />
            ))}
          </div>
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

        {/* Large screens: palettes left, actions right */}
        <div className="hidden lg:flex flex-row items-center justify-between flex-1 min-w-0 gap-4 w-full">
          <div className="min-w-0 overflow-visible">
            <WeavingPaletteSwitcher
              value={weavingPaletteName}
              onChange={setWeavingPaletteName}
              stroke="var(--text)"
            />
          </div>
          <div className="flex flex-row items-center gap-4 shrink-0">
            <Button variant="secondary" onClick={clearWeaving} className="whitespace-nowrap shrink-0">
              Clear
            </Button>
            <Button variant="secondary" onClick={() => !weaving && handleNew()} className="whitespace-nowrap shrink-0">
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
              <div className="flex flex-col gap-6">
                <h3 className="text-heading">Palette</h3>
                <WeavingPaletteSwitcher
                  value={weavingPaletteName}
                  onChange={setWeavingPaletteName}
                  stroke="var(--text)"
                />
                <div className="flex flex-col gap-3 mt-2">
                  <h3 className="text-heading">Preview</h3>
                  <div
                    role="img"
                    aria-label={`${palette.name} palette colors`}
                    className="flex gap-2 items-center flex-wrap"
                  >
                    {palette.colors.map((c, i) => (
                      <span
                        key={i}
                        className="w-8 h-8 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: `hsl(${c.h}, ${c.s}%, ${c.l}%)` }}
                      />
                    ))}
                  </div>
                </div>
                <Button
                  variant="primary"
                  onClick={() => setSheetAnimation('closing')}
                  className="w-full min-h-[48px] mt-4"
                >
                  Done
                </Button>
              </div>
            )}
            {sheetOpen === 'actions' && (
              <div className="flex flex-col gap-3">
                <Button
                  variant="secondary"
                  onClick={() => { if (!weaving) handleNew(); setSheetAnimation('closing'); }}
                  className="w-full min-h-[48px]"
                >
                  New
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => { clearWeaving(); setSheetAnimation('closing'); }}
                  className="w-full min-h-[48px]"
                >
                  Clear
                </Button>
                <Button
                  variant="primary"
                  onClick={() => { router.push('/compose'); }}
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
