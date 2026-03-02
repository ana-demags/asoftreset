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

  // One layout (card always right in DOM); slide via transform only. No reflow = no bounce.
  const TRANSITION_DURATION = 0.8;
  const STAGGER_DELAY_MS = 200;
  const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
  /** Fade when switching from rest state to breathing exercise (instruction + sphere + Stop). */
  const EXERCISE_FADE_DURATION = 0.3;

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
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
      if (wrapper) {
        const rect = wrapper.getBoundingClientRect();
        const cardCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        const vpCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        if (isSmallScreen) {
          enterSlideTargetRef.current = { x: vpCenter.x - cardCenter.x, y: vpCenter.y - cardCenter.y };
        } else {
          enterSlideTargetRef.current = { x: vpCenter.x - cardCenter.x, y: 0 };
        }
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
    // Show sphere + start breathing shortly after the card is fully centered (~30ms); when restarting, card is already centered
    const showExerciseMs = 30;
    const slideStartDelayMs = isSmallScreen ? 0 : STAGGER_DELAY_MS;
    const slideDurationMs = TRANSITION_DURATION * 1000;
    const delayMs = keepPosition ? showExerciseMs : slideStartDelayMs + slideDurationMs + showExerciseMs;
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
    if (running) {
      const target = enterSlideTargetRef.current;
      const slideStartDelayMs = isSmallScreen ? TRANSITION_DURATION * 20 : STAGGER_DELAY_MS;
      const t = setTimeout(() => setSlideOffset(target), slideStartDelayMs);
      return () => clearTimeout(t);
    }
    setExerciseVisible(false);
    // Only slide card back when user stops; keep centered when session completes ("Nice work")
    if (!completed) {
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

  // Recompute card position on resize when in exercise so layout adapts (e.g. desktop → narrow).
  // Disable card transition during resize so it snaps instead of bouncing.
  useEffect(() => {
    if (!running && !completed) return;
    const wrapper = cardWrapperRef.current;
    if (!wrapper) return;

    const recomputeCenter = () => {
      if (!isResizingRef.current) {
        isResizingRef.current = true;
        setIsResizing(true);
      }
      const rect = wrapper.getBoundingClientRect();
      const currentCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      const vpCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      const small = window.matchMedia('(max-width: 1023px)').matches;
      const newOffset = small
        ? {
            x: slideOffsetRef.current.x + (vpCenter.x - currentCenter.x),
            y: slideOffsetRef.current.y + (vpCenter.y - currentCenter.y),
          }
        : {
            x: slideOffsetRef.current.x + (vpCenter.x - currentCenter.x),
            y: 0,
          };
      enterSlideTargetRef.current = newOffset;
      setSlideOffset(newOffset);

      if (resizeDebounceRef.current) clearTimeout(resizeDebounceRef.current);
      resizeDebounceRef.current = setTimeout(() => {
        resizeDebounceRef.current = null;
        isResizingRef.current = false;
        setIsResizing(false);
      }, 150);
    };

    window.addEventListener('resize', recomputeCenter);
    return () => {
      window.removeEventListener('resize', recomputeCenter);
      if (resizeDebounceRef.current) clearTimeout(resizeDebounceRef.current);
    };
  }, [running, completed]);

  const immersive = running || completed;

  return (
    <main
      className="min-h-screen flex flex-col relative z-[1] min-w-0"
      style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}
    >
      <div
        className="relative z-[1] shrink-0 px-4 sm:px-6 pt-6 pb-2"
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
      <div className="relative z-[1] flex-1 min-h-0 flex flex-col lg:flex-row items-start lg:items-center justify-start lg:justify-center gap-8 lg:gap-32 px-4 sm:px-6 pt-4 pb-6 sm:py-8 overflow-auto">
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
          <div className="flex flex-col gap-4">
            <h1>Breathe</h1>
            <p
              className="w-full max-w-lg opacity-80 mx-auto lg:mx-0 min-w-0 text-body"
              style={{
                fontSize: 'var(--text-body)',
                lineHeight: 'var(--leading-body)',
              }}
            >
              Complete a one-minute breathing exercise, allowing your mind settle into a calm state.
            </p>
          </div>
        </header>
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
            className="rounded-2xl p-6 sm:p-10 flex flex-col items-center gap-6 w-full min-w-0 box-border text-center shadow-sm"
            style={{
              backgroundColor: 'var(--surface-overlay)',
              color: 'var(--text)',
            }}
          >
          <div
            className="relative w-full h-[calc(2rem+0.75rem+19rem)] min-h-0 shrink-0"
            aria-hidden={running || completed}
          >
            {/* Rest state: tabs hidden when running; exercise name + description stay until breathing fades in */}
            <div
              className="absolute inset-0 flex flex-col items-center"
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
                className="flex-1 flex items-center justify-center min-h-0 w-full"
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
                    className="min-w-0 opacity-80 break-words max-w-full"
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
                <span style={{ color: 'var(--text)', opacity: 0.9 }}>
                  {guideTextForPhase(display.label)}
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
                  Nice work.
                </h2>
                <p
                  className="min-w-0 opacity-80 break-words max-w-full"
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

          <div className="flex flex-col gap-3 w-full min-w-0">
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
      </div>
    </main>
  );
}
