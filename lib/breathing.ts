export type BreathingMode = 'box' | '478' | 'simple';

export interface BreathingPhase {
  label: string;
  duration: number; // seconds
  endScale: number; // circle scale at end of phase: 0 = contracted, 1 = expanded
}

export const breathingModes: Record<
  BreathingMode,
  { label: string; description: string; phases: BreathingPhase[] }
> = {
  box: {
    label: 'box breathing',
    description: 'Equal four-count inhale, hold, exhale, and hold. Calms the nervous system and sharpens focus.',
    phases: [
      { label: 'inhale', duration: 4, endScale: 1 },
      { label: 'hold',   duration: 4, endScale: 1 },
      { label: 'exhale', duration: 4, endScale: 0 },
      { label: 'hold',   duration: 4, endScale: 0 },
    ],
  },
  '478': {
    label: '4-7-8',
    description: 'Inhale for 4 seconds, hold for 7, exhale for 8. A classic pattern to ease into sleep or ease anxiety.',
    phases: [
      { label: 'inhale', duration: 4, endScale: 1 },
      { label: 'hold',   duration: 7, endScale: 1 },
      { label: 'exhale', duration: 8, endScale: 0 },
    ],
  },
  simple: {
    label: 'simple',
    description: 'A gentle in-and-out rhythm. Good for a quick reset or to anchor your attention.',
    phases: [
      { label: 'inhale', duration: 4, endScale: 1 },
      { label: 'exhale', duration: 6, endScale: 0 },
    ],
  },
};
