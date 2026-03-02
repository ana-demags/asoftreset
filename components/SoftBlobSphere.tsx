'use client';

interface SoftBlobSphereProps {
  scale: number;
  reducedMotion?: boolean;
  /** 0 = pre-dawn, 1 = sunrise. Blends as the session progresses. */
  sessionProgress?: number;
}

const MIN_R = 52;
const MAX_R = 128;
const SIZE = (MAX_R + 24) * 2;
const CX = SIZE / 2;
const CY = SIZE / 2;

/** Pre-dawn (0) → sunrise (1): same 5 stops, directional placement. Pre-dawn mapped from 4-stop definition. */
const PRE_DAWN = ['#d8c088', '#c0a894', '#a9999f', '#8e88a5', '#7878a0'];
const SUNRISE = ['#f4b428', '#e8a038', '#e08840', '#d06878', '#484068'];
const GRADIENT_OFFSETS = ['0%', '28%', '52%', '78%', '100%'];
const DIRECTIONAL_FOCUS = { cx: '35%', cy: '35%', r: '100%', fx: '26%', fy: '24%' };

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function rgbToHex(r: number, g: number, b: number): string {
  const rr = Math.round(Math.max(0, Math.min(255, r)));
  const gg = Math.round(Math.max(0, Math.min(255, g)));
  const bb = Math.round(Math.max(0, Math.min(255, b)));
  return `#${(rr << 16 | gg << 8 | bb).toString(16).padStart(6, '0')}`;
}

function lerpHex(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

export default function SoftBlobSphere({ scale, reducedMotion = false, sessionProgress = 0 }: SoftBlobSphereProps) {
  const s = reducedMotion ? 0.5 : scale;
  const r = MIN_R + (MAX_R - MIN_R) * s;
  const t = Math.max(0, Math.min(1, sessionProgress));
  const colors = GRADIENT_OFFSETS.map((_, i) =>
    lerpHex(PRE_DAWN[i], SUNRISE[i], t),
  );

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      aria-hidden
    >
      <defs>
        <radialGradient
          id="soft-blob-sphere-gradient"
          cx={DIRECTIONAL_FOCUS.cx}
          cy={DIRECTIONAL_FOCUS.cy}
          r={DIRECTIONAL_FOCUS.r}
          fx={DIRECTIONAL_FOCUS.fx}
          fy={DIRECTIONAL_FOCUS.fy}
        >
          {GRADIENT_OFFSETS.map((offset, i) => (
            <stop key={offset} offset={offset} stopColor={colors[i]} />
          ))}
        </radialGradient>
      </defs>
      <circle
        cx={CX}
        cy={CY}
        r={r}
        fill="url(#soft-blob-sphere-gradient)"
      />
    </svg>
  );
}
