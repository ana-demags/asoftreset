import { Delaunay } from 'd3-delaunay';
import { createPRNG } from '@/lib/prng';

export type ShapeStyle = 'paint' | 'weave';

export interface ShapeData {
  id: number;
  x: number;
  y: number;
  size: number;
  angle: number; // radians
  /** Paint only: Voronoi cell as flat [x,y,x,y,...] for a closed polygon */
  polygon?: number[];
  /** Paint only: corner rounding radius (px); varies by seed for composition variety */
  cornerRadius?: number;
}

export function generateComposition(
  seed: number,
  count: number,
  style: ShapeStyle,
  width: number,
  height: number,
): ShapeData[] {
  const prng = createPRNG(seed);

  // --- Paint: Voronoi diagram — cells touch at edges, no overlap, full coverage ---
  const cols = Math.ceil(Math.sqrt(count * (width / height)));
  const rows = Math.ceil(count / cols);
  const cellW = width / cols;
  const cellH = height / rows;

  const cells: { c: number; r: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({ c, r });
    }
  }
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    const tmp = cells[i];
    cells[i] = cells[j];
    cells[j] = tmp;
  }

  const pad = 0.06;
  const jitterRange = 1 - 2 * pad;
  const cornerRadius = 2 + prng() * 6;
  const pointList: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    const cell = cells[i];
    const x = (cell.c + pad + prng() * jitterRange) * cellW;
    const y = (cell.r + pad + prng() * jitterRange) * cellH;
    pointList.push([x, y]);
  }

  const delaunay = Delaunay.from(pointList);
  const voronoi = delaunay.voronoi([0, 0, width, height]);

  const shapes: ShapeData[] = [];
  for (let i = 0; i < count; i++) {
    const cell = voronoi.cellPolygon(i);
    if (!cell || cell.length < 3) continue;
    const flat: number[] = [];
    for (const [x, y] of cell) flat.push(x, y);
    if (flat.length >= 6) {
      const [px, py] = pointList[i];
      shapes.push({
        id: shapes.length,
        x: px,
        y: py,
        size: 0,
        angle: 0,
        polygon: flat,
        cornerRadius,
      });
    }
  }

  return shapes;
}

// Build a Path2D for a shape in world (CSS pixel) coordinates.
export function buildPath(shape: ShapeData, style: ShapeStyle, seed: number): Path2D {
  if (shape.polygon && shape.polygon.length >= 6) {
    return buildRoundedPolygonPath(shape.polygon, shape.cornerRadius ?? 4);
  }
  return buildBlobPath(shape, seed);
}

// --- Rounded Voronoi cell: smooth corners so it reads as a soft blob ---
function buildRoundedPolygonPath(flat: number[], cornerRadius: number): Path2D {
  const path = new Path2D();
  const n = flat.length / 2;
  if (n < 2) return path;

  const get = (i: number) => ({ x: flat[(i % n) * 2], y: flat[(i % n) * 2 + 1] });
  type P = { x: number; y: number };
  const c1: P[] = [];
  const c2: P[] = [];
  for (let i = 0; i < n; i++) {
    const prev = get(i - 1);
    const curr = get(i);
    const next = get(i + 1);
    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;
    const len1 = Math.hypot(dx1, dy1);
    const len2 = Math.hypot(dx2, dy2);
    const r = Math.min(cornerRadius, len1 / 2, len2 / 2);
    if (r > 1e-3) {
      const t1 = 1 - r / len1;
      const t2 = r / len2;
      c1.push({ x: prev.x + dx1 * t1, y: prev.y + dy1 * t1 });
      c2.push({ x: curr.x + dx2 * t2, y: curr.y + dy2 * t2 });
    } else {
      c1.push({ ...curr });
      c2.push({ ...curr });
    }
  }

  path.moveTo(c2[0].x, c2[0].y);
  for (let i = 1; i < n; i++) {
    path.lineTo(c1[i].x, c1[i].y);
    path.quadraticCurveTo(get(i).x, get(i).y, c2[i].x, c2[i].y);
  }
  path.lineTo(c1[0].x, c1[0].y);
  path.quadraticCurveTo(get(0).x, get(0).y, c2[0].x, c2[0].y);
  path.closePath();
  return path;
}

// --- Blob: Catmull-Rom through jittered radial points ---

function buildBlobPath(shape: ShapeData, seed: number): Path2D {
  const prng = createPRNG(((seed ^ (shape.id * 0x9e3779b9)) >>> 0));
  const N = 7;
  const pts: [number, number][] = [];

  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + shape.angle;
    const r = shape.size * (0.55 + prng() * 0.9);
    pts.push([shape.x + Math.cos(a) * r, shape.y + Math.sin(a) * r]);
  }

  return catmullRomClosed(pts);
}

function catmullRomClosed(pts: [number, number][]): Path2D {
  const path = new Path2D();
  const n = pts.length;
  path.moveTo(pts[0][0], pts[0][1]);

  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    path.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2[0], p2[1]);
  }

  path.closePath();
  return path;
}

