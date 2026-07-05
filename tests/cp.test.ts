import { describe, expect, it } from 'vitest';
import { HG, TILE } from '../src/constants';
import {
  CORNER,
  type Crease,
  CROSS,
  DEG0,
  DEG0_LOCKED,
  DEG1,
  STRAIGHT,
  TEE,
} from '../src/cp/gadgets';
import { canonicalize, generateCP } from '../src/cp/generate';
import { type Maze, createMaze, left, toggleLeft, toggleTop, top } from '../src/maze/model';
import { randomMaze } from '../src/maze/random';
import { deflattenMaze } from '../src/maze/serialize';

describe('gadget tables', () => {
  it('have the expected segment counts', () => {
    expect(STRAIGHT).toHaveLength(19);
    expect(CORNER).toHaveLength(34);
    expect(DEG1).toHaveLength(28);
    expect(TEE).toHaveLength(27);
    expect(CROSS).toHaveLength(17);
    expect(DEG0).toHaveLength(24);
    expect(DEG0_LOCKED).toHaveLength(38);
  });

  it('stay inside the gadget tile with integer endpoints', () => {
    for (const table of [STRAIGHT, CORNER, DEG1, TEE, CROSS, DEG0, DEG0_LOCKED]) {
      for (const cr of table) {
        for (const v of [cr.x1, cr.y1, cr.x2, cr.y2]) {
          expect(Number.isInteger(v)).toBe(true);
          expect(Math.abs(v)).toBeLessThanOrEqual(HG);
        }
      }
    }
  });

  it('canonicalize removes the duplicated source segments', () => {
    // The source duplicates one crease per s-sign: 27 - 2 = 25 unique.
    expect(canonicalize(TEE)).toHaveLength(25);
    expect(canonicalize(DEG0_LOCKED)).toHaveLength(36);
    expect(canonicalize(STRAIGHT)).toHaveLength(19);
  });
});

/** Plus-sign maze: all four interior edges around center vertex (1,1) of 2x2. */
function plusMaze(): Maze {
  const m = createMaze(2, 2);
  toggleTop(m, 0, 1);
  toggleTop(m, 1, 1);
  toggleLeft(m, 1, 0);
  toggleLeft(m, 1, 1);
  return m;
}

describe('generateCP', () => {
  it('produces one gadget per vertex with the right total count', () => {
    const empty = generateCP(createMaze(1, 1));
    expect(empty.creases).toHaveLength(4 * DEG0.length);
    expect(empty.width).toBe(2 * TILE);
    expect(empty.height).toBe(2 * TILE);

    // Boxed 1x1 cell: four corner gadgets.
    const boxed = deflattenMaze('-!||!-')!;
    expect(generateCP(boxed).creases).toHaveLength(4 * CORNER.length);

    // Plus sign: 1 cross, 4 dead ends, 4 empty corners.
    const plus = generateCP(plusMaze());
    expect(plus.creases).toHaveLength(CROSS.length + 4 * DEG1.length + 4 * DEG0.length);
  });

  it('keeps every crease inside the paper with integer endpoints', () => {
    for (const m of [plusMaze(), randomMaze(5, 4), randomMaze(3, 6)]) {
      const cp = generateCP(m);
      for (const cr of cp.creases) {
        for (const v of [cr.x1, cr.y1, cr.x2, cr.y2]) expect(Number.isInteger(v)).toBe(true);
        expect(Math.min(cr.x1, cr.x2)).toBeGreaterThanOrEqual(0);
        expect(Math.min(cr.y1, cr.y2)).toBeGreaterThanOrEqual(0);
        expect(Math.max(cr.x1, cr.x2)).toBeLessThanOrEqual(cp.width);
        expect(Math.max(cr.y1, cr.y2)).toBeLessThanOrEqual(cp.height);
      }
    }
  });
});

// The paper's key property: all gadgets present a consistent interface on
// each tile side — a "ridge" profile where a wall crosses, a "floor" profile
// where it doesn't. Verify every internal tile border on both sides.
const RIDGE = ['-2:V90', '0:M180', '2:V90'];
const FLOOR = ['-2:M180', '-1:V180', '1:V180', '2:M180'];

function checkInterfaces(m: Maze, lock0 = false): void {
  const { creases } = generateCP(m, lock0);

  // side(border coordinate, center along border, creases touching from one tile)
  const profile = (
    touching: Crease[],
    center: number,
    along: (c: Crease) => number,
  ): string[] =>
    touching
      .map((c) => `${along(c) - center}:${c.mv}${c.deg}`)
      .sort((a, b) => parseInt(a) - parseInt(b));

  // Vertical borders between tiles (x,y) and (x+1,y).
  for (let x = 0; x < m.nx; x++) {
    for (let y = 0; y <= m.ny; y++) {
      const X = TILE * (x + 1);
      const centerY = HG + TILE * y;
      const horiz = creases.filter(
        (c) =>
          c.y1 === c.y2 &&
          (c.x1 === X || c.x2 === X) &&
          Math.abs(c.y1 - centerY) <= HG &&
          c.x1 !== c.x2,
      );
      const fromLeft = horiz.filter((c) => Math.min(c.x1, c.x2) < X);
      const fromRight = horiz.filter((c) => Math.max(c.x1, c.x2) > X);
      const expected = top(m, x, y) ? RIDGE : FLOOR;
      expect(profile(fromLeft, centerY, (c) => c.y1), `v-border ${x},${y} left`).toEqual(expected);
      expect(profile(fromRight, centerY, (c) => c.y1), `v-border ${x},${y} right`).toEqual(
        expected,
      );
    }
  }

  // Horizontal borders between tiles (x,y) and (x,y+1).
  for (let x = 0; x <= m.nx; x++) {
    for (let y = 0; y < m.ny; y++) {
      const Y = TILE * (y + 1);
      const centerX = HG + TILE * x;
      const vert = creases.filter(
        (c) =>
          c.x1 === c.x2 &&
          (c.y1 === Y || c.y2 === Y) &&
          Math.abs(c.x1 - centerX) <= HG &&
          c.y1 !== c.y2,
      );
      const fromTop = vert.filter((c) => Math.min(c.y1, c.y2) < Y);
      const fromBottom = vert.filter((c) => Math.max(c.y1, c.y2) > Y);
      const expected = left(m, x, y) ? RIDGE : FLOOR;
      expect(profile(fromTop, centerX, (c) => c.x1), `h-border ${x},${y} top`).toEqual(expected);
      expect(profile(fromBottom, centerX, (c) => c.x1), `h-border ${x},${y} bottom`).toEqual(
        expected,
      );
    }
  }
}

describe('tile interface consistency (watertight tiling)', () => {
  it('holds for hand-built mazes covering all gadgets', () => {
    checkInterfaces(plusMaze()); // cross + 4 dead-end rotations + empties
    checkInterfaces(deflattenMaze('-!||!-')!); // 4 corner rotations
    // T junctions in all rotations: boxed 2x2 with a center cross arm removed.
    const tees = createMaze(2, 2);
    for (let x = 0; x < 2; x++) {
      toggleTop(tees, x, 0);
      toggleTop(tees, x, 2);
    }
    for (let y = 0; y < 2; y++) {
      toggleLeft(tees, 0, y);
      toggleLeft(tees, 2, y);
    }
    toggleLeft(tees, 1, 0);
    toggleLeft(tees, 1, 1);
    toggleTop(tees, 0, 1);
    toggleTop(tees, 1, 1); // full plus + box: center CROSS, boundary TEEs
    checkInterfaces(tees);
    // Straight runs both orientations.
    const straight = createMaze(2, 1);
    toggleTop(straight, 0, 0);
    toggleTop(straight, 1, 0);
    checkInterfaces(straight);
  });

  it('holds for random mazes, with and without lock0', () => {
    checkInterfaces(randomMaze(6, 5));
    checkInterfaces(randomMaze(4, 4), true);
    checkInterfaces(createMaze(3, 3), true); // all DEG0_LOCKED
  });
});
