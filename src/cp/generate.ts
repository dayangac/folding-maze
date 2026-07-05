import { HG, TILE } from '../constants';
import { type Maze, east, north, south, west } from '../maze/model';
import {
  CORNER,
  type Crease,
  CROSS,
  DEG0,
  DEG0_LOCKED,
  DEG1,
  STRAIGHT,
  TEE,
} from './gadgets';

export interface CreasePattern {
  creases: Crease[];
  /** Paper rectangle is (0,0)-(width,height). */
  width: number;
  height: number;
}

type Rot = 0 | 90 | 180 | 270;

/** Rotate clockwise in screen coordinates (y down): 90° maps (x,y) to (-y,x). */
function rotate(x: number, y: number, r: Rot): [number, number] {
  switch (r) {
    case 0:
      return [x, y];
    case 90:
      return [-y, x];
    case 180:
      return [-x, -y];
    case 270:
      return [y, -x];
  }
}

function place(local: Crease, r: Rot, tx: number, ty: number): Crease {
  const [x1, y1] = rotate(local.x1, local.y1, r);
  const [x2, y2] = rotate(local.x2, local.y2, r);
  return { x1: x1 + tx, y1: y1 + ty, x2: x2 + tx, y2: y2 + ty, mv: local.mv, deg: local.deg };
}

/** Pick the gadget and rotation for vertex (x,y) — the paper's Figure 2 cases. */
export function gadgetFor(
  m: Maze,
  x: number,
  y: number,
  lock0: boolean,
): { table: readonly Crease[]; rot: Rot } {
  const e = east(m, x, y);
  const w = west(m, x, y);
  const s = south(m, x, y);
  const n = north(m, x, y);
  const count = +e + +w + +s + +n;
  switch (count) {
    case 2:
      if ((e && w) || (n && s)) return { table: STRAIGHT, rot: e ? 0 : 90 };
      if (e && s) return { table: CORNER, rot: 270 };
      if (e && n) return { table: CORNER, rot: 180 };
      if (w && n) return { table: CORNER, rot: 90 };
      return { table: CORNER, rot: 0 }; // w && s: base orientation
    case 1:
      return { table: DEG1, rot: s ? 90 : w ? 180 : n ? 270 : 0 };
    case 3:
      return { table: TEE, rot: !s ? 90 : !w ? 180 : !n ? 270 : 0 };
    case 4:
      return { table: CROSS, rot: 0 };
    default:
      return { table: lock0 ? DEG0_LOCKED : DEG0, rot: 0 };
  }
}

/**
 * Tile a gadget onto every vertex of the maze. Vertex (x,y)'s tile is the
 * TILE x TILE paper square centered at (HG + TILE*x, HG + TILE*y); the whole
 * paper is (0,0)-(TILE*(nx+1), TILE*(ny+1)).
 */
export function generateCP(m: Maze, lock0 = false): CreasePattern {
  const creases: Crease[] = [];
  for (let x = 0; x <= m.nx; x++) {
    for (let y = 0; y <= m.ny; y++) {
      const { table, rot } = gadgetFor(m, x, y, lock0);
      const tx = HG + TILE * x;
      const ty = HG + TILE * y;
      for (const local of table) creases.push(place(local, rot, tx, ty));
    }
  }
  return { creases, width: TILE * (m.nx + 1), height: TILE * (m.ny + 1) };
}

/**
 * Normalize a crease list for comparison/rendering: order each segment's
 * endpoints lexicographically and drop exact duplicates (the original gadget
 * tables contain a few).
 */
export function canonicalize(creases: readonly Crease[]): Crease[] {
  const seen = new Map<string, Crease>();
  for (const cr of creases) {
    let { x1, y1, x2, y2 } = cr;
    if (x1 > x2 || (x1 === x2 && y1 > y2)) {
      [x1, y1, x2, y2] = [x2, y2, x1, y1];
    }
    const key = `${x1},${y1},${x2},${y2},${cr.mv},${cr.deg}`;
    if (!seen.has(key)) seen.set(key, { x1, y1, x2, y2, mv: cr.mv, deg: cr.deg });
  }
  return [...seen.values()].sort(
    (a, b) => a.x1 - b.x1 || a.y1 - b.y1 || a.x2 - b.x2 || a.y2 - b.y2 || (a.mv < b.mv ? -1 : 1),
  );
}
