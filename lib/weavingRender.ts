/**
 * Weaving: canvas drawing — warp/weft segments, grain, full render.
 */

import type { WeavingPalette, WeavingColorHSL } from '@/lib/weaving';
import { weftIsOver } from '@/lib/weaving';

function hsla(h: number, s: number, l: number, a = 1): string {
  return `hsla(${h.toFixed(1)},${s.toFixed(1)}%,${l.toFixed(1)}%,${a.toFixed(3)})`;
}

/** Returns a deterministic PRNG for a single cell so segment appearance is stable across frames. */
function makeCellRand(seed: number, r: number, c: number, role: number): () => number {
  let s = ((seed ^ 0xc0ffee) + r * 31 + c * 17 + role * 7) >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function vary(
  base: WeavingColorHSL,
  rand: () => number,
  dh = 3,
  ds = 5,
  dl = 7
): WeavingColorHSL {
  return {
    h: base.h + (rand() - 0.5) * dh,
    s: Math.max(0, Math.min(100, base.s + (rand() - 0.5) * ds)),
    l: Math.max(5, Math.min(95, base.l + (rand() - 0.5) * dl)),
  };
}

export function addGrain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  amount = 16
): void {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * amount;
    d[i] = Math.max(0, Math.min(255, d[i] + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);
}

/** Round to nearest half-pixel so vertical strokes align to the pixel grid (good on dark backgrounds). */
function alignForStroke(v: number): number {
  return Math.round(v * 2) / 2;
}

/** Round to nearest device pixel so strokes land on integer device coordinates (removes jaggedness on light backgrounds). */
function alignToDevicePixel(v: number, dpr: number): number {
  if (dpr <= 0 || !Number.isFinite(dpr)) return v;
  return Math.round(v * dpr) / dpr;
}

function drawWarpSegment(
  ctx: CanvasRenderingContext2D,
  c: number,
  y0: number,
  y1: number,
  cellW: number,
  cellH: number,
  palette: WeavingPalette,
  rand: () => number,
  onTop: boolean,
  devicePixelRatio?: number
): void {
  if (onTop) for (let i = 0; i < 16; i++) rand();
  else for (let i = 0; i < 4; i++) rand();

  const x = (c + 0.5) * cellW;
  const tw = cellW * 0.18;
  const alpha = onTop ? 0.78 : 0.2;

  const dpr = devicePixelRatio ?? 0;
  const useFillForCrispEdges = !palette.dark && dpr >= 1;
  const align =
    useFillForCrispEdges
      ? (v: number) => alignToDevicePixel(v, dpr)
      : palette.dark
        ? alignForStroke
        : (v: number) => Math.round(v);
  const xC = align(x);
  const xL = align(x - tw * 0.15);
  const xR = align(x + tw * 0.14);
  const y0A = useFillForCrispEdges ? alignToDevicePixel(y0, dpr) : Math.round(y0);
  const y1A = useFillForCrispEdges ? alignToDevicePixel(y1, dpr) : Math.round(y1);

  const shadowL = Math.max(6, palette.warpL - 14);
  const midL = palette.warpL;
  const highlightL = Math.min(92, palette.warpL + 12);
  const S = palette.warpS;
  const Ssoft = Math.max(0, palette.warpS - 5);

  if (useFillForCrispEdges) {
    // Light mode: one filled quad with gradient so vertical edges land on device pixels (no stroke blur)
    const gradient = ctx.createLinearGradient(xL, 0, xR, 0);
    gradient.addColorStop(0, hsla(palette.warpH, Math.max(0, S - 3), shadowL, alpha * 0.7));
    gradient.addColorStop(0.4, hsla(palette.warpH, S, midL, alpha * 0.95));
    gradient.addColorStop(0.6, hsla(palette.warpH, Ssoft, midL, alpha * 0.95));
    gradient.addColorStop(1, hsla(palette.warpH, Ssoft, highlightL, alpha * 0.75));
    ctx.beginPath();
    ctx.moveTo(xL, y0A);
    ctx.lineTo(xC, y1A);
    ctx.lineTo(xR, y1A);
    ctx.lineTo(xC, y0A);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    return;
  }

  ctx.lineCap = 'butt';

  ctx.beginPath();
  ctx.moveTo(xL, y0A);
  ctx.lineTo(xC, y1A);
  ctx.strokeStyle = hsla(palette.warpH, Math.max(0, S - 3), shadowL, alpha * 0.58);
  ctx.lineWidth = tw * 1.1;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(xL, y0A);
  ctx.lineTo(xC, y1A);
  ctx.strokeStyle = hsla(palette.warpH, S, Math.max(8, palette.warpL - 8), alpha * 0.48);
  ctx.lineWidth = tw * 0.7;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(xC, y0A);
  ctx.lineTo(xC, y1A);
  ctx.strokeStyle = hsla(palette.warpH, S, Math.max(10, midL - 3), alpha * 0.88);
  ctx.lineWidth = tw * 0.78;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(xC, y0A);
  ctx.lineTo(xC, y1A);
  ctx.strokeStyle = hsla(palette.warpH, Ssoft, Math.min(90, midL + 3), alpha * 0.82);
  ctx.lineWidth = tw * 0.68;
  ctx.stroke();

  if (onTop) {
    ctx.beginPath();
    ctx.moveTo(xR, y0A);
    ctx.lineTo(xR, y1A);
    ctx.strokeStyle = hsla(palette.warpH, Ssoft, Math.min(90, palette.warpL + 8), alpha * 0.42);
    ctx.lineWidth = tw * 0.16;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(xR, y0A);
    ctx.lineTo(xR, y1A);
    ctx.strokeStyle = hsla(palette.warpH, Math.max(0, palette.warpS - 6), highlightL, alpha * 0.45);
    ctx.lineWidth = tw * 0.18;
    ctx.stroke();
  }
}

function drawWeftSegment(
  ctx: CanvasRenderingContext2D,
  r: number,
  c: number,
  cellW: number,
  cellH: number,
  colorBase: WeavingColorHSL,
  over: boolean,
  rand: () => number,
  alpha: number,
  shuttleHere: boolean
): void {
  const x0 = c * cellW;
  const x1 = x0 + cellW;
  const yMid = (r + 0.5) * cellH;
  const bowAmt = over ? -cellH * 0.38 : cellH * 0.26;
  const xMid = x0 + cellW * 0.5;
  const varColor = vary(colorBase, rand, 5, 7, 9);
  const threadW = cellH * (over ? 0.72 : 0.56);

  ctx.lineCap = 'round';

  const shadowL = Math.max(6, varColor.l - 14);
  const highlightL = Math.min(92, varColor.l + 12);
  const castOff = cellH * 0.06;

  if (over) {
    ctx.beginPath();
    ctx.moveTo(x0, yMid + bowAmt * 0.25 + castOff);
    ctx.quadraticCurveTo(
      xMid,
      yMid + bowAmt * 1.12 + castOff,
      x1,
      yMid + bowAmt * 0.25 + castOff
    );
    ctx.strokeStyle = hsla(
      varColor.h,
      varColor.s,
      Math.max(4, varColor.l - 20),
      0.2
    );
    ctx.lineWidth = threadW * 0.9;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(x0, yMid + bowAmt * 0.25);
  ctx.quadraticCurveTo(
    xMid,
    yMid + bowAmt * 1.12,
    x1,
    yMid + bowAmt * 0.25
  );
  ctx.strokeStyle = hsla(varColor.h, varColor.s, shadowL, alpha * 0.55);
  ctx.lineWidth = threadW * 1.2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x0, yMid + bowAmt * 0.25);
  ctx.quadraticCurveTo(
    xMid,
    yMid + bowAmt * 1.12,
    x1,
    yMid + bowAmt * 0.25
  );
  ctx.strokeStyle = hsla(
    varColor.h,
    varColor.s,
    Math.max(8, varColor.l - 8),
    alpha * 0.48
  );
  ctx.lineWidth = threadW * 0.75;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x0, yMid);
  ctx.quadraticCurveTo(xMid, yMid + bowAmt, x1, yMid);
  ctx.strokeStyle = hsla(
    varColor.h,
    varColor.s,
    Math.max(10, varColor.l - 2),
    alpha * 0.9
  );
  ctx.lineWidth = threadW * 0.92;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x0, yMid);
  ctx.quadraticCurveTo(xMid, yMid + bowAmt, x1, yMid);
  ctx.strokeStyle = hsla(
    varColor.h,
    Math.max(0, varColor.s - 4),
    Math.min(90, varColor.l + 2),
    alpha * 0.88
  );
  ctx.lineWidth = threadW * 0.82;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x0, yMid - bowAmt * 0.1);
  ctx.quadraticCurveTo(
    xMid,
    yMid + bowAmt * 0.88,
    x1,
    yMid - bowAmt * 0.1
  );
  ctx.strokeStyle = hsla(
    varColor.h,
    Math.max(0, varColor.s - 5),
    Math.min(90, varColor.l + 6),
    alpha * 0.46
  );
  ctx.lineWidth = threadW * 0.52;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x0, yMid - bowAmt * 0.1);
  ctx.quadraticCurveTo(
    xMid,
    yMid + bowAmt * 0.88,
    x1,
    yMid - bowAmt * 0.1
  );
  ctx.strokeStyle = hsla(
    varColor.h,
    Math.max(0, varColor.s - 6),
    highlightL,
    alpha * 0.48
  );
  ctx.lineWidth = threadW * 0.5;
  ctx.stroke();

  if (over) {
    ctx.beginPath();
    ctx.moveTo(x0 + cellW * 0.1, yMid - cellH * 0.045);
    ctx.quadraticCurveTo(
      xMid,
      yMid + bowAmt * 0.65 - cellH * 0.05,
      x1 - cellW * 0.1,
      yMid - cellH * 0.045
    );
    ctx.strokeStyle = hsla(
      varColor.h,
      Math.max(0, varColor.s - 10),
      Math.min(92, varColor.l + 16),
      alpha * 0.4
    );
    ctx.lineWidth = threadW * 0.18;
    ctx.stroke();
  }

  const fuzzCount = Math.floor(cellW * 0.28);
  for (let i = 0; i < fuzzCount; i++) {
    const t = rand();
    const fx = x0 + t * cellW;
    const fy = yMid + bowAmt * 4 * t * (1 - t);
    const flen = cellH * (0.07 + rand() * 0.14);
    const angle = (rand() - 0.5) * 0.8 + (over ? -0.28 : 0.28);
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(
      fx + Math.sin(angle) * flen,
      fy + Math.cos(angle) * flen * 0.38
    );
    ctx.strokeStyle = hsla(
      varColor.h,
      varColor.s - 3,
      varColor.l + (rand() - 0.5) * 14,
      alpha * (0.08 + rand() * 0.14)
    );
    ctx.lineWidth = 0.4 + rand() * 0.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}

function drawVerticalWeftSegment(
  ctx: CanvasRenderingContext2D,
  r: number,
  c: number,
  cellW: number,
  cellH: number,
  colorBase: WeavingColorHSL,
  over: boolean,
  rand: () => number,
  alpha: number,
  shuttleHere: boolean
): void {
  const y0 = r * cellH;
  const y1 = y0 + cellH;
  const xMid = (c + 0.5) * cellW;
  const bowAmt = over ? -cellW * 0.38 : cellW * 0.26;
  const yMid = y0 + cellH * 0.5;
  const varColor = vary(colorBase, rand, 5, 7, 9);
  const threadW = cellW * (over ? 0.72 : 0.56);

  ctx.lineCap = 'round';

  const shadowL = Math.max(6, varColor.l - 14);
  const highlightL = Math.min(92, varColor.l + 12);
  const castOff = cellW * 0.06;

  if (over) {
    ctx.beginPath();
    ctx.moveTo(xMid + bowAmt * 0.25 + castOff, y0);
    ctx.quadraticCurveTo(xMid + bowAmt * 1.12 + castOff, yMid, xMid + bowAmt * 0.25 + castOff, y1);
    ctx.strokeStyle = hsla(varColor.h, varColor.s, Math.max(4, varColor.l - 20), 0.2);
    ctx.lineWidth = threadW * 0.9;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(xMid + bowAmt * 0.25, y0);
  ctx.quadraticCurveTo(xMid + bowAmt * 1.12, yMid, xMid + bowAmt * 0.25, y1);
  ctx.strokeStyle = hsla(varColor.h, varColor.s, shadowL, alpha * 0.55);
  ctx.lineWidth = threadW * 1.2;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(xMid + bowAmt * 0.25, y0);
  ctx.quadraticCurveTo(xMid + bowAmt * 1.12, yMid, xMid + bowAmt * 0.25, y1);
  ctx.strokeStyle = hsla(varColor.h, varColor.s, Math.max(8, varColor.l - 8), alpha * 0.48);
  ctx.lineWidth = threadW * 0.75;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(xMid, y0);
  ctx.quadraticCurveTo(xMid + bowAmt, yMid, xMid, y1);
  ctx.strokeStyle = hsla(varColor.h, varColor.s, Math.max(10, varColor.l - 2), alpha * 0.9);
  ctx.lineWidth = threadW * 0.92;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(xMid, y0);
  ctx.quadraticCurveTo(xMid + bowAmt, yMid, xMid, y1);
  ctx.strokeStyle = hsla(varColor.h, Math.max(0, varColor.s - 4), Math.min(90, varColor.l + 2), alpha * 0.88);
  ctx.lineWidth = threadW * 0.82;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(xMid - bowAmt * 0.1, y0);
  ctx.quadraticCurveTo(xMid + bowAmt * 0.88, yMid, xMid - bowAmt * 0.1, y1);
  ctx.strokeStyle = hsla(varColor.h, Math.max(0, varColor.s - 5), Math.min(90, varColor.l + 6), alpha * 0.46);
  ctx.lineWidth = threadW * 0.52;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(xMid - bowAmt * 0.1, y0);
  ctx.quadraticCurveTo(xMid + bowAmt * 0.88, yMid, xMid - bowAmt * 0.1, y1);
  ctx.strokeStyle = hsla(varColor.h, Math.max(0, varColor.s - 6), highlightL, alpha * 0.48);
  ctx.lineWidth = threadW * 0.5;
  ctx.stroke();

  if (over) {
    ctx.beginPath();
    ctx.moveTo(xMid - cellW * 0.045, y0 + cellH * 0.1);
    ctx.quadraticCurveTo(xMid + bowAmt * 0.65 - cellW * 0.05, yMid, xMid - cellW * 0.045, y1 - cellH * 0.1);
    ctx.strokeStyle = hsla(varColor.h, Math.max(0, varColor.s - 10), Math.min(92, varColor.l + 16), alpha * 0.4);
    ctx.lineWidth = threadW * 0.18;
    ctx.stroke();
  }

  const fuzzCount = Math.floor(cellH * 0.28);
  for (let i = 0; i < fuzzCount; i++) {
    const t = rand();
    const fy = y0 + t * cellH;
    const fx = xMid + bowAmt * 4 * t * (1 - t);
    const flen = cellW * (0.07 + rand() * 0.14);
    const angle = (rand() - 0.5) * 0.8 + (over ? -0.28 : 0.28);
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + Math.cos(angle) * flen * 0.38, fy + Math.sin(angle) * flen);
    ctx.strokeStyle = hsla(varColor.h, varColor.s - 3, varColor.l + (rand() - 0.5) * 14, alpha * (0.08 + rand() * 0.14));
    ctx.lineWidth = 0.4 + rand() * 0.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  void shuttleHere;
}

export interface WeavingRenderParams {
  ctx: CanvasRenderingContext2D;
  rows: number;
  cols: number;
  cellW: number;
  cellH: number;
  palette: WeavingPalette;
  weaveMotif: number;
  designMotif: number;
  colors: WeavingColorHSL[];
  mask: boolean[][];
  prefilledMask: boolean[][];
  patternGrid: (WeavingColorHSL | null)[][];
  woven: Record<string, WeavingColorHSL>;
  revealed: Record<string, boolean>;
  shuttleRow: number;
  shuttleCol: number;
  orderIndex: number;
  weavingOrder: number[];
  weaving: boolean;
  completionMoment: boolean;
  seed: number;
  /** When set, shuttle is drawn at this fractional column for smooth motion. */
  shuttleColFloat?: number;
  /** Full canvas size; when set with fabricInset, weave is drawn in a centered inset (fabric has breathing room). */
  canvasWidth?: number;
  canvasHeight?: number;
  /** Fraction of canvas to leave as margin on each side (e.g. 0.06 = 6%). */
  fabricInset?: number;
  /** Device pixel ratio (e.g. from window.devicePixelRatio). When set, warp lines align to device pixels for crisp edges on light backgrounds. */
  devicePixelRatio?: number;
  /** Vertical weaving phase state. */
  verticalWoven?: Record<string, WeavingColorHSL>;
  verticalWeaving?: boolean;
  verticalShuttleCol?: number;
  shuttleRowFloat?: number;
  verticalWeavingOrder?: number[];
  verticalOrderIndex?: number;
  isVerticalPhase?: boolean;
  /** When true, the next row/column dashed indicator is drawn with a stronger focus style */
  canvasFocused?: boolean;
  /** WCAG-compliant stroke for the dashed empty row/column bar (theme-based, e.g. from --foreground) */
  emptyRowDashedStroke?: string;
}

export function renderCanvas(params: WeavingRenderParams): void {
  const {
    ctx,
    rows,
    cols,
    cellW: cellWParam,
    cellH: cellHParam,
    palette,
    weaveMotif,
    mask,
    prefilledMask,
    patternGrid,
    woven,
    revealed,
    shuttleRow,
    shuttleCol,
    shuttleColFloat,
    orderIndex,
    weavingOrder,
    weaving,
    completionMoment,
    seed,
    canvasWidth,
    canvasHeight,
    fabricInset = 0.06,
    devicePixelRatio: dpr,
    verticalWoven,
    verticalWeaving,
    verticalShuttleCol,
    shuttleRowFloat,
    verticalWeavingOrder,
    verticalOrderIndex,
    isVerticalPhase,
    canvasFocused = false,
    emptyRowDashedStroke: emptyRowDashedStrokeParam,
  } = params;

  const useInset =
    canvasWidth != null &&
    canvasHeight != null &&
    canvasWidth > 0 &&
    canvasHeight > 0 &&
    fabricInset > 0;

  let cellW = cellWParam;
  let cellH = cellHParam;
  let weaveLeft = 0;
  let weaveTop = 0;

  if (useInset) {
    weaveLeft = canvasWidth * fabricInset;
    weaveTop = canvasHeight * fabricInset;
    const weaveW = canvasWidth * (1 - 2 * fabricInset);
    const weaveH = canvasHeight * (1 - 2 * fabricInset);
    cellW = weaveW / cols;
    cellH = weaveH / rows;
  }

  const W = cols * cellW;
  const H = rows * cellH;

  if (useInset) {
    ctx.clearRect(0, 0, canvasWidth!, canvasHeight!);
    ctx.translate(weaveLeft, weaveTop);
  } else {
    ctx.clearRect(0, 0, W, H);
  }

  for (let c = 0; c < cols; c++) {
    drawWarpSegment(
      ctx,
      c,
      0,
      H,
      cellW,
      cellH,
      palette,
      makeCellRand(seed, 0, c, 0),
      false,
      dpr
    );
  }

  // Vertical weft UNDER horizontal: drawn before horizontal weft so horizontal covers it.
  // These are cells where weftIsOver = true (horizontal is on top → vertical goes beneath).
  if (verticalWoven) {
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (!mask[r][c]) continue;
        const key = `${r}-${c}`;
        if (!verticalWoven[key]) continue;
        const colorBase = patternGrid[r][c];
        if (!colorBase) continue;
        if (weftIsOver(r, c, weaveMotif)) {
          // horizontal over → vertical under (vertOver = false)
          drawVerticalWeftSegment(
            ctx, r, c, cellW, cellH, colorBase, false,
            makeCellRand(seed, r, c, 3), 0.95, false
          );
        }
      }
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!mask[r][c]) continue;
      const key = `${r}-${c}`;
      const isPrefilled = prefilledMask[r][c];
      const shouldShow = isPrefilled ? !!revealed[key] : !!woven[key];
      if (!shouldShow) continue;

      const colorBase = patternGrid[r][c];
      if (!colorBase) continue;

      const over = weftIsOver(r, c, weaveMotif);
      const isShuttleHere =
        shuttleColFloat == null &&
        r === shuttleRow &&
        c === shuttleCol;

      drawWeftSegment(
        ctx,
        r,
        c,
        cellW,
        cellH,
        colorBase,
        over,
        makeCellRand(seed, r, c, 1),
        isShuttleHere ? 1.0 : 0.95,
        isShuttleHere
      );
    }
  }

  if (
    weaving &&
    shuttleRow >= 0 &&
    shuttleColFloat != null &&
    shuttleRow < rows
  ) {
    const cellCol = Math.max(
      0,
      Math.min(cols - 1, Math.floor(shuttleColFloat))
    );
    const colorBase = patternGrid[shuttleRow][cellCol];
    if (colorBase && mask[shuttleRow][cellCol]) {
      const over = weftIsOver(shuttleRow, cellCol, weaveMotif);
      drawWeftSegment(
        ctx,
        shuttleRow,
        shuttleColFloat,
        cellW,
        cellH,
        colorBase,
        over,
        makeCellRand(seed, shuttleRow, cellCol, 1),
        1.0,
        true
      );
    }
  }

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      if (!mask[r][c]) continue;
      const key = `${r}-${c}`;
      const isPrefilled = prefilledMask[r][c];
      const isFilled = isPrefilled ? !!revealed[key] : !!woven[key];
      if (!isFilled) continue;

      const over = weftIsOver(r, c, weaveMotif);
      if (!over) {
        drawWarpSegment(
          ctx,
          c,
          r * cellH,
          (r + 1) * cellH,
          cellW,
          cellH,
          palette,
          makeCellRand(seed, r, c, 2),
          true,
          dpr
        );
      }
    }
  }

  // Vertical weft OVER horizontal: drawn after warp overdraw so it sits on top.
  // These are cells where weftIsOver = false (horizontal under → vertical on top).
  if (verticalWoven) {
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (!mask[r][c]) continue;
        const key = `${r}-${c}`;
        if (!verticalWoven[key]) continue;
        const colorBase = patternGrid[r][c];
        if (!colorBase) continue;
        if (!weftIsOver(r, c, weaveMotif)) {
          // horizontal under → vertical over (vertOver = true)
          drawVerticalWeftSegment(
            ctx, r, c, cellW, cellH, colorBase, true,
            makeCellRand(seed, r, c, 3), 0.95, false
          );
        }
      }
    }
  }

  // Vertical shuttle
  if (
    verticalWeaving &&
    verticalShuttleCol != null &&
    shuttleRowFloat != null &&
    verticalShuttleCol < cols
  ) {
    const c = verticalShuttleCol;
    const rFloor = Math.max(0, Math.min(rows - 1, Math.floor(shuttleRowFloat)));
    const colorBase = patternGrid[rFloor][c];
    if (colorBase && mask[rFloor][c]) {
      const vertOver = !weftIsOver(rFloor, c, weaveMotif);
      drawVerticalWeftSegment(
        ctx, shuttleRowFloat, c, cellW, cellH, colorBase, vertOver,
        makeCellRand(seed, rFloor, c, 3), 1.0, true
      );
    }
  }

  const emptyRowStroke = emptyRowDashedStrokeParam ?? (palette.dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.13)');

  if (!isVerticalPhase && !weaving && !completionMoment && orderIndex < weavingOrder.length) {
    const nr = weavingOrder[orderIndex];
    const rowCells = Array.from({ length: cols }, (_, c) => c).filter(
      (c) => mask[nr][c]
    );
    if (rowCells.length > 0) {
      const x0 = rowCells[0] * cellW;
      const x1 = (rowCells[rowCells.length - 1] + 1) * cellW;
      ctx.save();
      if (canvasFocused) {
        ctx.setLineDash([]);
        ctx.strokeStyle = palette.dark
          ? 'rgba(255,255,255,0.55)'
          : 'rgba(0,0,0,0.45)';
        ctx.lineWidth = 2.5;
      } else {
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = emptyRowStroke;
        ctx.lineWidth = 1;
      }
      ctx.strokeRect(x0 + 0.5, nr * cellH + 0.5, x1 - x0 - 1, cellH - 1);
      ctx.restore();
    }
  }

  if (
    isVerticalPhase &&
    !verticalWeaving &&
    !completionMoment &&
    verticalWeavingOrder &&
    verticalOrderIndex != null &&
    verticalOrderIndex < verticalWeavingOrder.length
  ) {
    const nc = verticalWeavingOrder[verticalOrderIndex];
    const colCells = Array.from({ length: rows }, (_, r) => r).filter(
      (r) => mask[r][nc]
    );
    if (colCells.length > 0) {
      const y0 = colCells[0] * cellH;
      const y1 = (colCells[colCells.length - 1] + 1) * cellH;
      ctx.save();
      if (canvasFocused) {
        ctx.setLineDash([]);
        ctx.strokeStyle = palette.dark
          ? 'rgba(255,255,255,0.55)'
          : 'rgba(0,0,0,0.45)';
        ctx.lineWidth = 2.5;
      } else {
        ctx.setLineDash([3, 4]);
        ctx.strokeStyle = emptyRowStroke;
        ctx.lineWidth = 1;
      }
      ctx.strokeRect(nc * cellW + 0.5, y0 + 0.5, cellW - 1, y1 - y0 - 1);
      ctx.restore();
    }
  }

  // Grain only at completion to avoid per-frame latency
  if (completionMoment) addGrain(ctx, W, H, 10);
}
