'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SoftBlobSphere from '@/components/SoftBlobSphere';
import Button from '@/components/Button';
import Breadcrumb from '@/components/Breadcrumb';
import { breathingModes, type BreathingMode } from '@/lib/breathing';

function capitalizeLabel(label: string): string {
  return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
}

function guideTextForPhase(phaseLabel: string): string {
  switch (phaseLabel) {
    case 'inhale':
      return 'Breathe in slowly.';
    case 'hold':
      return 'Hold there.';
    case 'exhale':
      return 'And breathe out.';
    default:
      return phaseLabel;
  }
}

interface DisplayState {
  scale: number;
  label: string;
  timeLeft: number;
  sessionProgress: number;
}

export default function BreathePage() {
  const router = useRouter();
  const [mode, setMode] = useState<BreathingMode>('simple');
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [display, setDisplay] = useState<DisplayState>({ scale: 0, label: '', timeLeft: 0, sessionProgress: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [slideOffset, setSlideOffset] = useState({ x: 0, y: 0 });
  const [exerciseVisible, setExerciseVisible] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const cardWrapperRef = useRef<HTMLDivElement>(null);
  const resizeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isResizingRef = useRef(false);
  const enterSlideTargetRef = useRef({ x: 0, y: 0 });
  const slideOffsetRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const exerciseStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const phaseIdxRef = useRef(0);
  const elapsedRef = useRef(0);
  const sessionElapsedRef = useRef(0);
  const finishingRef = useRef(false);
  const modeRef = useRef<BreathingMode>('simple');
  const runningRef = useRef(false);

  const SESSION_DURATION_SEC = 60;

  // One layout (card always right in DOM); slide via transform only (desktop). Small screens use full-screen view instead.
  const TRANSITION_DURATION = 0.8;
  const STAGGER_DELAY_MS = 200;
  const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
  /** Fade when switching from rest state to breathing exercise (instruction + sphere + Stop). */
  const EXERCISE_FADE_DURATION = 0.3;

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Match Tailwind lg (1024px): below 1025px use small-screen behavior (full-screen exercise) to avoid card stuck top-right at 1024px.
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1024px)');
    const handler = () => setIsSmallScreen(mql.matches);
    handler();
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { slideOffsetRef.current = slideOffset; }, [slideOffset]);

  const computeDisplay = useCallback(
    (phaseIdx: number, elapsed: number, m: BreathingMode, sessionProgress = 0): DisplayState => {
      const phases = breathingModes[m].phases;
      const phase = phases[phaseIdx];
      const prevScale = phaseIdx === 0 ? 0 : phases[(phaseIdx - 1 + phases.length) % phases.length].endScale;
      const progress = Math.min(elapsed / phase.duration, 1);
      const scale = prevScale + (phase.endScale - prevScale) * progress;
      return {
        scale,
        label: phase.label,
        timeLeft: Math.max(0, phase.duration - elapsed),
        sessionProgress,
      };
    },
    [],
  );

  const tick = useCallback((ts: number) => {
    if (!runningRef.current) return;
    if (lastTsRef.current === null) lastTsRef.current = ts;
    const rawDt = (ts - lastTsRef.current) / 1000;
    const dt = Math.min(rawDt, 0.25);
    lastTsRef.current = ts;

    const phases = breathingModes[modeRef.current].phases;
    sessionElapsedRef.current += rawDt;

    if (sessionElapsedRef.current >= SESSION_DURATION_SEC && !finishingRef.current) {
      finishingRef.current = true;
    }

    if (finishingRef.current) {
      const phase = phases[phaseIdxRef.current];
      if (elapsedRef.current >= phase.duration) {
        runningRef.current = false;
        if (rafRef.current != null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        const progress = Math.min(sessionElapsedRef.current / SESSION_DURATION_SEC, 1);
        setDisplay(computeDisplay(phaseIdxRef.current, phase.duration, modeRef.current, progress));
        setRunning(false);
        setCompleted(true);
        return;
      }
      elapsedRef.current += dt;
    } else {
      elapsedRef.current += dt;
      while (elapsedRef.current >= phases[phaseIdxRef.current].duration) {
        elapsedRef.current -= phases[phaseIdxRef.current].duration;
        phaseIdxRef.current = (phaseIdxRef.current + 1) % phases.length;
      }
    }

    const progress = Math.min(sessionElapsedRef.current / SESSION_DURATION_SEC, 1);
    setDisplay(computeDisplay(phaseIdxRef.current, elapsedRef.current, modeRef.current, progress));
    rafRef.current = requestAnimationFrame(tick);
  }, [computeDisplay]);

  function start(keepPosition?: boolean) {
    if (keepPosition) {
      enterSlideTargetRef.current = { ...slideOffsetRef.current };
    } else {
      const wrapper = cardWrapperRef.current;
      if (wrapper && !isSmallScreen) {
        const PAD = 16;
        const rect = wrapper.getBoundingClientRect();
        const cardCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        const vpCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        let offsetY = vpCenter.y - cardCenter.y;
        const layoutTop = rect.top; // no transform yet at start
        const minOffsetY = PAD - layoutTop;
        const maxOffsetY = window.innerHeight - PAD - rect.height - layoutTop;
        offsetY = Math.max(minOffsetY, Math.min(maxOffsetY, offsetY));
        enterSlideTargetRef.current = {
          x: vpCenter.x - cardCenter.x,
          y: offsetY,
        };
      }
    }
    phaseIdxRef.current = 0;
    elapsedRef.current = 0;
    sessionElapsedRef.current = 0;
    finishingRef.current = false;
    lastTsRef.current = null;
    runningRef.current = true;
    setRunning(true);
    setCompleted(false);
    setDisplay(computeDisplay(0, 0, modeRef.current, 0));
    setExerciseVisible(false);
    // Small: show exercise almost immediately (full-screen, no slide). Desktop: after card slide finishes.
    const showExerciseMs = 30;
    const slideStartDelayMs = isSmallScreen ? 0 : STAGGER_DELAY_MS;
    const slideDurationMs = TRANSITION_DURATION * 1000;
    const delayMs = isSmallScreen
      ? showExerciseMs
      : keepPosition ? showExerciseMs : slideStartDelayMs + slideDurationMs + showExerciseMs;
    if (exerciseStartTimeoutRef.current) clearTimeout(exerciseStartTimeoutRef.current);
    exerciseStartTimeoutRef.current = setTimeout(() => {
      exerciseStartTimeoutRef.current = null;
      setExerciseVisible(true);
      lastTsRef.current = null;
      rafRef.current = requestAnimationFrame(tick);
    }, delayMs);
  }

  function stop() {
    runningRef.current = false;
    finishingRef.current = false;
    if (exerciseStartTimeoutRef.current) {
      clearTimeout(exerciseStartTimeoutRef.current);
      exerciseStartTimeoutRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    phaseIdxRef.current = 0;
    elapsedRef.current = 0;
    sessionElapsedRef.current = 0;
    setRunning(false);
    setCompleted(false);
    setExerciseVisible(false);
    setDisplay({ scale: 0, label: '', timeLeft: 0, sessionProgress: 0 });
    setSlideOffset({ x: 0, y: 0 });
  }

  function restart() {
    setCompleted(false);
    start(true);
  }

  useLayoutEffect(() => {
    // Desktop: when exercise starts/runs, slide the card to its target position.
    if (running && !isSmallScreen) {
      const target = enterSlideTargetRef.current;
      const t = setTimeout(() => setSlideOffset(target), STAGGER_DELAY_MS);
      return () => clearTimeout(t);
    }

    // When we're back in the rest state (not running and not completed),
    // reset layout state so the card returns to its default position.
    if (!running && !completed) {
      setExerciseVisible(false);
      isResizingRef.current = false;
      setIsResizing(false);
      setSlideOffset({ x: 0, y: 0 });
    }
  }, [running, completed, isSmallScreen]);

  useEffect(() => {
    return () => {
      runningRef.current = false;
      if (exerciseStartTimeoutRef.current) clearTimeout(exerciseStartTimeoutRef.current);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Center card on desktop when exercise is running/completed, and recompute on resize.
  // When resizing from small → large, isSmallScreen flips so this effect re-runs and centers the card.
  useEffect(() => {
    if (!running && !completed) return;
    if (isSmallScreen) return; // small screens use full-screen view; no card to center
    const wrapper = cardWrapperRef.current;
    if (!wrapper) return;

    const PAD = 16; // keep card (including Stop button) within viewport with this margin
    const recomputeCenter = () => {
      if (!isResizingRef.current) {
        isResizingRef.current = true;
        setIsResizing(true);
      }
      const rect = wrapper.getBoundingClientRect();
      const currentCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      const vpCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      let offsetX = slideOffsetRef.current.x + (vpCenter.x - currentCenter.x);
      let offsetY = slideOffsetRef.current.y + (vpCenter.y - currentCenter.y);
      // Clamp Y so the full card (including Stop button) stays in view when resizing
      const layoutTop = rect.top - slideOffsetRef.current.y;
      const minOffsetY = PAD - layoutTop;
      const maxOffsetY = window.innerHeight - PAD - rect.height - layoutTop;
      offsetY = Math.max(minOffsetY, Math.min(maxOffsetY, offsetY));
      const newOffset = { x: offsetX, y: offsetY };
      enterSlideTargetRef.current = newOffset;
      setSlideOffset(newOffset);

      if (resizeDebounceRef.current) clearTimeout(resizeDebounceRef.current);
      resizeDebounceRef.current = setTimeout(() => {
        resizeDebounceRef.current = null;
        isResizingRef.current = false;
        setIsResizing(false);
      }, 150);
    };

    // Center immediately when effect runs (e.g. after resize small → large so card is in DOM)
    const raf = requestAnimationFrame(() => {
      if (cardWrapperRef.current) recomputeCenter();
    });
    window.addEventListener('resize', recomputeCenter);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', recomputeCenter);
      if (resizeDebounceRef.current) clearTimeout(resizeDebounceRef.current);
    };
  }, [running, completed, isSmallScreen]);

  const immersive = running || completed;
  const guideText = guideTextForPhase(display.label);
  const smallScreenFullScreen = isSmallScreen && (running || completed);

  return (
    <main
      className="min-h-screen flex flex-col relative z-[1] min-w-0"
      style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}
    >
      {/* Small screens: full-screen exercise view (no card) when running or completed */}
      {smallScreenFullScreen && (
        <div
          className="fixed inset-0 z-10 flex flex-col items-center justify-center gap-6 p-6"
          style={{
            backgroundColor: 'var(--background)',
            transition: reducedMotion ? 'none' : `opacity ${EXERCISE_FADE_DURATION}s ${EASING}`,
          }}
        >
          {completed ? (
            <>
              <div className="flex flex-col gap-3 items-center text-center max-w-[24rem]">
                <h2
                  className="break-words"
                  style={{
                    fontFamily: 'var(--font-serif), Georgia, serif',
                    fontSize: 'var(--text-heading-3)',
                    lineHeight: 'var(--leading-tight)',
                  }}
                >
                  Nice work
                </h2>
                <p
                  className="min-w-0 break-words max-w-full"
                  style={{
                    fontSize: 'var(--text-body)',
                    lineHeight: 'var(--leading-body)',
                  }}
                >
                  You carved out a small moment to pause and be kind to yourself. That's no small thing.
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full max-w-[24rem]">
                <Button onClick={restart}>Restart</Button>
                <Button variant="secondary" onClick={stop} className="w-full">
                  Finish
                </Button>
              </div>
            </>
          ) : (
            <>
              <div
                className="min-h-[2rem] flex items-center justify-center"
                style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)' }}
              >
                <span
                  key={display.label}
                  className={reducedMotion ? undefined : 'breathe-guide-fade'}
                  style={{ color: 'var(--text)', opacity: reducedMotion ? 0.9 : undefined }}
                >
                  {guideText}
                </span>
              </div>
              <SoftBlobSphere
                scale={display.scale}
                reducedMotion={reducedMotion}
                sessionProgress={display.sessionProgress}
              />
              <div
                className="w-full max-w-[24rem]"
                style={{
                  opacity: 1,
                  transition: reducedMotion ? 'none' : `opacity ${EXERCISE_FADE_DURATION}s ${EASING}`,
                }}
              >
                <Button variant="secondary" onClick={stop} className="w-full">
                  Stop
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col flex-1 min-h-0 page-enter">
        <div
          className="relative z-[1] shrink-0 px-4 sm:px-6 pt-6 pb-4"
          style={{
          opacity: immersive ? 0 : 1,
          visibility: immersive ? 'hidden' : 'visible',
          transition: reducedMotion ? 'none' : `opacity ${TRANSITION_DURATION}s ${EASING}`,
          }}
          aria-hidden={immersive}
        >
          <Breadcrumb
          items={[
            { label: 'home', href: '/' },
            { label: 'start', href: '/start' },
            { label: 'breathe', href: '/breathe' },
          ]}
          />
        </div>
        <div className="relative z-[1] flex-1 min-h-0 flex flex-col lg:flex-row items-center justify-start lg:justify-center gap-6 lg:gap-32 px-4 sm:px-6 pt-8 pb-6 sm:py-8 overflow-auto">
          <header
          className="flex flex-col w-full max-w-lg lg:max-w-[24rem] lg:min-w-0 lg:shrink text-center lg:text-left"
          style={{
            opacity: immersive ? 0 : 1,
            pointerEvents: immersive ? 'none' : 'auto',
            visibility: immersive ? 'hidden' : 'visible',
            transition: reducedMotion ? 'none' : `opacity ${TRANSITION_DURATION}s ${EASING}`,
          }}
          aria-hidden={immersive}
        >
          <div className="flex flex-col gap-2">
            <h1 className="h1-home-breath-subtle min-h-[1.2em]" aria-label="Breathe">
              Breathe
            </h1>
            <p
              className="w-full max-w-lg mx-auto lg:mx-0 min-w-0 text-body"
              style={{
                fontSize: 'var(--text-body)',
                lineHeight: 'var(--leading-body)',
              }}
            >
            Set some time aside to pause.
            </p>
          </div>
        </header>
        {!smallScreenFullScreen && (
        <div
          ref={cardWrapperRef}
          className="w-full max-w-[24rem] min-w-0 lg:w-[24rem] lg:min-w-[24rem] lg:max-w-[24rem] lg:shrink-0 flex flex-col items-center"
          style={{
            transform:
              slideOffset.x !== 0 || slideOffset.y !== 0
                ? `translate(${slideOffset.x}px, ${slideOffset.y}px)`
                : undefined,
            transition:
              reducedMotion || isResizing ? 'none' : `transform ${TRANSITION_DURATION}s ${EASING}`,
          }}
        >
          <div
            className={`rounded-2xl p-8 sm:p-10 flex flex-col items-center gap-13 sm:gap-8 w-full min-w-0 box-border text-center shadow-sm shrink-0 breathe-card-micro-inhale ${
              !reducedMotion && (running || completed) ? 'breathe-card-micro-inhale-active' : ''
            }`}
            style={{
              backgroundColor: 'var(--surface-overlay)',
              color: 'var(--text)',
            }}
          >
          {/* Mobile: hug (min-h-0, height from content). sm + running/completed: fixed height for sphere. */}
          <div
            className={`relative w-full min-h-0 shrink-0 ${running || completed ? 'min-h-[calc(2rem+0.75rem+19rem)]' : ''} sm:h-[calc(2rem+0.75rem+19rem)] sm:min-h-0`}
            aria-hidden={running || completed}
          >
            {/* Rest state: on mobile in-flow with gap so card hugs; on sm absolute overlay */}
            <div
              className="relative flex flex-col items-center gap-13 sm:absolute sm:inset-0 sm:gap-0"
              style={{
                pointerEvents: !running && !completed ? 'auto' : 'none',
              }}
            >
              <nav
                role="tablist"
                aria-label="Breathing rhythm"
                className="flex flex-wrap gap-7 justify-center shrink-0"
                style={{
                  opacity: running || completed ? 0 : 1,
                  transition: reducedMotion || !running ? 'none' : `opacity 0.4s ${EASING}`,
                }}
                aria-hidden={running || completed}
              >
                {(['simple', 'box', '478'] as BreathingMode[]).map((m) => (
                  <Button
                    key={m}
                    variant="tab"
                    selected={mode === m}
                    onClick={() => setMode(m)}
                  >
                    {breathingModes[m].label}
                  </Button>
                ))}
              </nav>
              <div
                className="flex items-center justify-center min-h-0 w-full sm:flex-1"
                style={{
                  opacity: completed ? 0 : (running && exerciseVisible ? 0 : 1),
                  transition: reducedMotion || !running ? 'none' : `opacity ${EXERCISE_FADE_DURATION}s ${EASING}`,
                }}
                aria-hidden={running && exerciseVisible}
              >
                <div className="flex flex-col gap-3 items-center text-center">
                  <h2
                    className="break-words"
                    style={{
                      fontFamily: 'var(--font-serif), Georgia, serif',
                      fontSize: 'var(--text-heading-3)',
                      lineHeight: 'var(--leading-tight)',
                    }}
                  >
                    {capitalizeLabel(breathingModes[mode].label)}
                  </h2>
                  <p
                    className="min-w-0 break-words max-w-full"
                    style={{
                      fontSize: 'var(--text-body)',
                      lineHeight: 'var(--leading-body)',
                    }}
                  >
                    {breathingModes[mode].description}
                  </p>
                </div>
              </div>
            </div>

            {/* Running state: instruction + sphere (gently fade in after card is centered) */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3"
              style={{
                opacity: running && exerciseVisible ? 1 : 0,
                pointerEvents: running && exerciseVisible ? 'auto' : 'none',
                transition: reducedMotion || !(running && exerciseVisible) ? 'none' : `opacity ${EXERCISE_FADE_DURATION}s ${EASING}`,
              }}
              aria-hidden={!(running && exerciseVisible)}
            >
              <div
                className="min-h-[2rem] flex items-center justify-center"
                style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)' }}
              >
                <span
                  key={display.label}
                  className={reducedMotion ? undefined : 'breathe-guide-fade'}
                  style={{ color: 'var(--text)', opacity: reducedMotion ? 0.9 : undefined }}
                >
                  {guideText}
                </span>
              </div>
              <SoftBlobSphere
                scale={display.scale}
                reducedMotion={reducedMotion}
                sessionProgress={display.sessionProgress}
              />
            </div>

            {/* Completed state: warm, supportive close */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{
                opacity: completed ? 1 : 0,
                pointerEvents: completed ? 'auto' : 'none',
                transition: reducedMotion ? 'none' : `opacity 0.8s ${EASING}`,
              }}
              aria-hidden={!completed}
              aria-live="polite"
            >
              <div className="flex flex-col gap-3 items-center text-center">
                <h2
                  className="break-words"
                  style={{
                    fontFamily: 'var(--font-serif), Georgia, serif',
                    fontSize: 'var(--text-heading-3)',
                    lineHeight: 'var(--leading-tight)',
                  }}
                >
                  Nice work
                </h2>
                <p
                  className="min-w-0 break-words max-w-full"
                  style={{
                    fontSize: 'var(--text-body)',
                    lineHeight: 'var(--leading-body)',
                  }}
                >
                  You carved out a small moment to pause and be kind to yourself. That's no small thing.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full min-w-0 shrink-0">
            {completed ? (
              <>
                <Button onClick={restart}>Restart</Button>
                <Button variant="secondary" onClick={stop} className="w-full">
                  Finish
                </Button>
              </>
            ) : !running ? (
              <Button onClick={() => start()}>Begin</Button>
            ) : (
              <div
                className="w-full"
                style={{
                  opacity: exerciseVisible ? 1 : 0,
                  pointerEvents: exerciseVisible ? 'auto' : 'none',
                  transition: reducedMotion || !(running && exerciseVisible) ? 'none' : `opacity ${EXERCISE_FADE_DURATION}s ${EASING}`,
                }}
              >
                <Button variant="secondary" onClick={stop} className="w-full">
                  Stop
                </Button>
              </div>
            )}
          </div>
          </div>
        </div>
        )}
        </div>
      </div>
    </main>
  );
}
