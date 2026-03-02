import { buildPath, type ShapeData, type ShapeStyle } from '@/lib/patterns';

export function buildHitCanvas(
  shapes: ShapeData[],
  style: ShapeStyle,
  seed: number,
  width: number,
  height: number,
): OffscreenCanvas {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;

  for (const shape of shapes) {
    const id = shape.id + 1; // 1-indexed; 0 = background
    const r = id & 0xff;
    const g = (id >> 8) & 0xff;
    const b = (id >> 16) & 0xff;
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fill(buildPath(shape, style, seed));
  }

  return canvas;
}

export function hitTest(canvas: OffscreenCanvas, x: number, y: number): number | null {
  const ctx = canvas.getContext('2d')!;
  const data = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
  const id = data[0] + data[1] * 256 + data[2] * 65536 - 1;
  return id >= 0 ? id : null;
}
