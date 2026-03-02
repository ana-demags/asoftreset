/**
 * Weaving: logic, palettes, tiers, masks, weave structure, and design color.
 */

import type { Palette } from '@/lib/palettes';

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function rgbToHsl(r: number, g: number, b: number): WeavingColorHSL {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

/** Convert app palette (hex) to weaving palette (HSL + warp/surface). */
export function paletteToWeavingPalette(palette: Palette): WeavingPalette {
  const colors: WeavingColorHSL[] = palette.colors.map((hex) => {
    const [r, g, b] = hexToRgb(hex);
    return rgbToHsl(r, g, b);
  });
  const [br, bg, bb] = hexToRgb(palette.background);
  const bgHsl = rgbToHsl(br, bg, bb);
  const luminance = (br * 0.299 + bg * 0.587 + bb * 0.114) / 255;
  const dark = luminance < 0.5;
  return {
    name: palette.name,
    surface: palette.background,
    bg: palette.background,
    warpH: bgHsl.h,
    warpS: Math.max(10, Math.min(25, bgHsl.s + 5)),
    warpL: Math.max(20, Math.min(70, bgHsl.l + (dark ? -8 : 12))),
    colors,
    text: palette.stroke,
    muted: mutedFromPalette(palette.stroke, dark),
    dark,
  };
}

function mutedFromPalette(hex: string, dark: boolean): string {
  if (dark) return 'rgba(255,255,255,0.45)';
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},0.48)`;
}

export function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface WeavingColorHSL {
  h: number;
  s: number;
  l: number;
}

export interface WeavingPalette {
  name: string;
  surface: string;
  bg: string;
  warpH: number;
  warpS: number;
  warpL: number;
  colors: WeavingColorHSL[];
  text: string;
  muted: string;
  dark: boolean;
}

/** Weaving-only palette names (soft, calming; colors are Moroccan rug inspired). */
export type WeavingPaletteName =
  | 'drift'
  | 'dune'
  | 'blush'
  | 'twilight';

export const WEAVING_PALETTE_ORDER: WeavingPaletteName[] = [
  'drift',
  'dune',
  'blush',
  'twilight',
];

/**
 * Weaving palettes: soft names, Moroccan-inspired colors (8–10 per palette).
 */
export const WEAVING_PALETTES: Record<WeavingPaletteName, WeavingPalette> = {
  drift: {
    name: 'drift',
    surface: '#F5F0E8',
    bg: '#EBE4DA',
    warpH: 40,
    warpS: 14,
    warpL: 72,
    colors: [
      { h: 40, s: 22, l: 88 },   // ivory
      { h: 35, s: 18, l: 82 },   // cream
      { h: 30, s: 12, l: 75 },   // natural wool
      { h: 30, s: 8, l: 22 },    // black
      { h: 28, s: 25, l: 28 },   // dark brown
      { h: 35, s: 10, l: 42 },   // warm grey
      { h: 32, s: 14, l: 38 },   // charcoal brown
      { h: 38, s: 16, l: 68 },   // sand
    ],
    text: '#3D3630',
    muted: 'rgba(61,54,48,0.48)',
    dark: false,
  },
  dune: {
    name: 'dune',
    surface: '#F4EDE6',
    bg: '#E8DED4',
    warpH: 28,
    warpS: 22,
    warpL: 65,
    colors: [
      { h: 35, s: 25, l: 85 },   // cream
      { h: 18, s: 52, l: 42 },   // rust
      { h: 22, s: 48, l: 46 },   // terracotta
      { h: 42, s: 58, l: 52 },   // saffron
      { h: 38, s: 45, l: 55 },   // ochre
      { h: 28, s: 18, l: 32 },   // charcoal
      { h: 212, s: 28, l: 52 },  // dusty blue
      { h: 15, s: 42, l: 48 },   // burnt sienna
      { h: 32, s: 35, l: 72 },   // linen
      { h: 25, s: 38, l: 38 },   // brown
    ],
    text: '#5C4438',
    muted: 'rgba(92,68,56,0.48)',
    dark: false,
  },
  blush: {
    name: 'blush',
    surface: '#F0EBE8',
    bg: '#E4DDD8',
    warpH: 340,
    warpS: 16,
    warpL: 68,
    colors: [
      { h: 348, s: 38, l: 72 },  // dusty pink
      { h: 12, s: 55, l: 62 },   // coral
      { h: 188, s: 38, l: 48 },  // teal
      { h: 45, s: 62, l: 58 },   // mustard
      { h: 278, s: 32, l: 62 },  // lavender
      { h: 40, s: 22, l: 88 },   // cream
      { h: 155, s: 28, l: 52 },   // sage
      { h: 8, s: 52, l: 48 },    // brick
      { h: 200, s: 35, l: 58 },  // soft blue
      { h: 330, s: 42, l: 65 },  // rose
    ],
    text: '#5A4A4A',
    muted: 'rgba(90,74,74,0.48)',
    dark: false,
  },
  twilight: {
    name: 'twilight',
    surface: '#1A1828',
    bg: '#222030',
    warpH: 248,
    warpS: 5,
    warpL: 84,
    colors: [
      { h: 242, s: 42, l: 34 },  // deep indigo
      { h: 30, s: 12, l: 24 },   // charcoal
      { h: 42, s: 58, l: 56 },   // gold
      { h: 28, s: 48, l: 48 },   // copper
      { h: 38, s: 28, l: 78 },   // cream
      { h: 235, s: 35, l: 42 },  // slate blue
      { h: 258, s: 38, l: 48 },  // violet
      { h: 32, s: 45, l: 52 },   // brass
      { h: 220, s: 28, l: 58 },  // soft blue
    ],
    text: '#C8C0D0',
    muted: 'rgba(200,192,208,0.45)',
    dark: false,
  },
};

/** @deprecated Use WEAVING_PALETTES for weaving; painting uses lib/palettes. */
export const PALETTES: Record<string, WeavingPalette> = WEAVING_PALETTES;

export const TIERS = [
  { label: '5 min', rows: 14, cols: 20 },
  { label: '10 min', rows: 22, cols: 30 },
  { label: '15 min', rows: 32, cols: 42 },
];

export function makeMask(type: number, rows: number, cols: number): boolean[][] {
  switch (type) {
    case 0:
      return Array.from({ length: rows }, () => Array(cols).fill(true));
    case 1:
      return Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const dx = Math.abs((c + 0.5) / cols - 0.5) * 2;
          const dy = Math.abs((r + 0.5) / rows - 0.5) * 2;
          return dx + dy <= 1.05;
        })
      );
    case 2:
      return Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          if ((r + 0.5) / rows >= 0.45) return true;
          const dx = (c + 0.5) / cols - 0.5;
          const dy = (r + 0.5) / rows - 0.45;
          return (dx * dx) / 0.25 + (dy * dy) / 0.2025 <= 1.0;
        })
      );
    case 3:
      return Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const x = ((c + 0.5) / cols - 0.5) * 2;
          const y = ((r + 0.5) / rows - 0.5) * 2;
          return Math.abs(x) <= 0.95 && Math.abs(y) <= 0.95 && Math.abs(x) + Math.abs(y) <= 1.55;
        })
      );
    case 4:
      return Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const rx = Math.abs((c + 0.5) / cols - 0.5);
          const ry = Math.abs((r + 0.5) / rows - 0.5);
          return rx <= 0.22 || ry <= 0.22;
        })
      );
    case 5:
      return Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const x = ((c + 0.5) / cols - 0.5) * 2;
          const y = ((r + 0.5) / rows - 0.5) * 2;
          return x * x + y * y <= 1.0;
        })
      );
    case 6:
      return Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const band = Math.floor(((r + 0.5) / rows) * 5) % 2 === 0;
          const u = (c + 0.5) / cols;
          return band || (u >= 0.2 && u <= 0.8);
        })
      );
    case 7:
      return Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const u = (c + 0.5) / cols;
          const v = (r + 0.5) / rows;
          return u <= 0.12 || u >= 0.88 || v <= 0.1 || v >= 0.9;
        })
      );
    case 8:
      return Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const y = (r + 0.5) / rows;
          // cos is symmetric (even function) so the wave mirrors left↔right
          const wave = Math.cos(((c + 0.5) / cols - 0.5) * Math.PI * 8) * 0.12 + 0.5;
          return y >= wave - 0.08 && y <= wave + 0.08;
        })
      );
    default:
      return Array.from({ length: rows }, () => Array(cols).fill(true));
  }
}

export function makePrefilledMask(
  type: number,
  rows: number,
  cols: number,
  mask: boolean[][]
): boolean[][] {
  switch (type) {
    case 0:
      return Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => r < rows * 0.32 && mask[r][c])
      );
    case 1:
      return Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const dx = (Math.abs(c / cols - 0.5) * 2);
          const dy = (Math.abs(r / rows - 0.5) * 2);
          return dx + dy <= 0.4 && mask[r][c];
        })
      );
    case 2:
      return Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => r >= rows * 0.7 && mask[r][c])
      );
    case 3:
      return Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          if (!mask[r][c]) return false;
          return [
            [r - 1, c],
            [r + 1, c],
            [r, c - 1],
            [r, c + 1],
          ].some(
            ([nr, nc]) =>
              nr < 0 || nr >= rows || nc < 0 || nc >= cols || !mask[nr][nc]
          );
        })
      );
    case 4:
      return Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const rx = Math.abs(c / cols - 0.5);
          const ry = Math.abs(r / rows - 0.5);
          return rx <= 0.1 && ry <= 0.1 && mask[r][c];
        })
      );
    case 5:
      return Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const x = (c / cols - 0.5) * 2;
          const y = (r / rows - 0.5) * 2;
          return x * x + y * y <= 0.35 && mask[r][c];
        })
      );
    case 6:
      return Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const band = Math.floor((r / rows) * 5) % 2 === 0;
          const inStrip = (c / cols) >= 0.35 && (c / cols) <= 0.65;
          return (band || inStrip) && mask[r][c];
        })
      );
    case 7:
      return Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const u = c / cols;
          const v = r / rows;
          const edge =
            u <= 0.14 || u >= 0.86 || v <= 0.12 || v >= 0.88;
          return edge && mask[r][c];
        })
      );
    case 8:
      return Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const y = r / rows;
          const wave = Math.sin((c / cols) * Math.PI * 4) * 0.12 + 0.5;
          const inWave = y >= wave - 0.06 && y <= wave + 0.06;
          return inWave && mask[r][c];
        })
      );
    default:
      return Array.from({ length: rows }, () => Array(cols).fill(false));
  }
}

export function getVerticalWeavingOrder(cols: number, mask: boolean[][]): number[] {
  const order: number[] = [];
  for (let c = 0; c < cols; c++) {
    if (mask.some((row) => row[c])) order.push(c);
  }
  return order;
}

export function getWeavingOrder(
  type: number,
  rows: number,
  mask: boolean[][],
  prefilledMask: boolean[][]
): number[] {
  const order: number[] = [];
  const iterate =
    type === 2
      ? Array.from({ length: rows }, (_, i) => rows - 1 - i)
      : Array.from({ length: rows }, (_, i) => i);
  for (const r of iterate)
    if (mask[r].some((v, c) => v && !prefilledMask[r][c])) order.push(r);
  return order;
}

export function isBorder(
  r: number,
  c: number,
  mask: boolean[][],
  rows: number,
  cols: number
): boolean {
  if (!mask[r][c]) return false;
  return [
    [r - 1, c],
    [r + 1, c],
    [r, c - 1],
    [r, c + 1],
  ].some(
    ([nr, nc]) =>
      nr < 0 || nr >= rows || nc < 0 || nc >= cols || !mask[nr][nc]
  );
}

/** Returns true if weft is over warp at (r, c). */
export function weftIsOver(r: number, c: number, weaveMotif: number): boolean {
  switch (weaveMotif) {
    case 0:
      return (r + c) % 2 === 0;
    case 1:
      return (r + c * 2) % 4 < 2;
    case 2:
      return (r * 2 + c) % 6 < 3;
    case 3:
      return (r + c) % 4 < 2;
    case 4: {
      const dx = c % 10;
      const dy = r % 10;
      return Math.abs(dx - 5) + Math.abs(dy - 5) < 5;
    }
    case 5:
      return (r + c) % 5 < 3;
    default:
      return (r + c) % 2 === 0;
  }
}

/** Pick color by index (uses full palette for tapestry-style variety). */
function pick(colors: WeavingColorHSL[], index: number): WeavingColorHSL {
  return colors[index % colors.length];
}

export function getDesignColor(
  r: number,
  c: number,
  rows: number,
  cols: number,
  motif: number,
  colors: WeavingColorHSL[],
  border: boolean
): WeavingColorHSL {
  if (border) return pick(colors, 1);
  const n = colors.length;
  // Mirrored coords: fold each axis so patterns reflect across both center lines
  const mr = Math.min(r, rows - 1 - r);
  const mc = Math.min(c, cols - 1 - c);
  // Center-relative coords for radial motifs
  const cr = r - (rows - 1) / 2;
  const cc = c - (cols - 1) / 2;
  switch (motif) {
    case 0:
      return pick(colors, (r + c) % n);                                        // diagonal stripes
    case 1:
      return pick(colors, (mr + mc) % n);                                      // mirrored diagonal — X from corners
    case 2:
      return pick(colors, (Math.floor(r / 3) + Math.floor(c / 3)) % n);       // 3×3 blocks
    case 3:
      return pick(colors, mc % n);                                             // mirrored vertical stripes
    case 4:
      return pick(colors, mr % n);                                             // mirrored horizontal bands
    case 5:
      return pick(colors, Math.floor(Math.sqrt(cr * cr + cc * cc)) % n);      // concentric rings
    case 6:
      return pick(colors, ((r % 4) + (c % 4)) % n);                           // fine diagonal blocks
    case 7:
      return pick(colors, (Math.floor(r / 2) + Math.floor(c / 2)) % n);       // 2×2 blocks
    case 8:
      return pick(colors, Math.floor(Math.abs(cr) + Math.abs(cc)) % n);       // concentric diamonds
    case 9:
      return pick(colors, Math.max(mr, mc) % n);                              // square rings from center
    case 10:
      return pick(colors, (Math.floor(r / 4) + Math.floor(c / 4)) % n);       // 4×4 blocks
    default:
      return pick(colors, 0);
  }
}

export const COMP_NAMES = [
  'tapestry',
  'medallion',
  'arch',
  'hexagon',
  'cross',
  'roundel',
  'bands',
  'frame',
  'waves',
];
