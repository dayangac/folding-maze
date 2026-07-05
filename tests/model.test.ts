import { describe, expect, it } from 'vitest';
import {
  createMaze,
  east,
  left,
  north,
  resizeMaze,
  south,
  toggleLeft,
  toggleTop,
  top,
  west,
} from '../src/maze/model';
import { randomMaze } from '../src/maze/random';
import { deflattenMaze, flattenMaze } from '../src/maze/serialize';

describe('maze model', () => {
  it('creates an empty maze with correct dimensions', () => {
    const m = createMaze(3, 2);
    expect(m.edgeTop).toHaveLength(3);
    expect(m.edgeTop[0]).toHaveLength(3); // ny + 1
    expect(m.edgeLeft).toHaveLength(4); // nx + 1
    expect(m.edgeLeft[0]).toHaveLength(2);
  });

  it('toggles edges and reads them via directional accessors', () => {
    const m = createMaze(2, 2);
    toggleTop(m, 1, 1);
    expect(top(m, 1, 1)).toBe(true);
    expect(east(m, 1, 1)).toBe(true);
    expect(west(m, 2, 1)).toBe(true);
    toggleLeft(m, 1, 0);
    expect(left(m, 1, 0)).toBe(true);
    expect(south(m, 1, 0)).toBe(true);
    expect(north(m, 1, 1)).toBe(true);
    toggleTop(m, 1, 1);
    expect(top(m, 1, 1)).toBe(false);
  });

  it('returns false for out-of-range edge reads', () => {
    const m = createMaze(2, 2);
    expect(top(m, -1, 0)).toBe(false);
    expect(top(m, 2, 0)).toBe(false);
    expect(left(m, 0, -1)).toBe(false);
    expect(west(m, 0, 0)).toBe(false);
    expect(north(m, 0, 0)).toBe(false);
  });

  it('resizes preserving content, with and without shift', () => {
    const m = createMaze(2, 2);
    toggleTop(m, 0, 0);
    toggleLeft(m, 1, 1);
    const grown = resizeMaze(m, 3, 3);
    expect(top(grown, 0, 0)).toBe(true);
    expect(left(grown, 1, 1)).toBe(true);
    const shifted = resizeMaze(m, 3, 2, 1, 0);
    expect(top(shifted, 0, 0)).toBe(false);
    expect(top(shifted, 1, 0)).toBe(true);
    expect(left(shifted, 2, 1)).toBe(true);
  });
});

describe('random maze', () => {
  it('is a spanning tree with all boundary edges walled', () => {
    const nx = 7;
    const ny = 5;
    const m = randomMaze(nx, ny);
    for (let x = 0; x < nx; x++) {
      expect(top(m, x, 0)).toBe(true);
      expect(top(m, x, ny)).toBe(true);
    }
    for (let y = 0; y < ny; y++) {
      expect(left(m, 0, y)).toBe(true);
      expect(left(m, nx, y)).toBe(true);
    }
    // Count interior openings: a spanning tree over nx*ny cells has
    // exactly nx*ny - 1 tree edges = open interior edges.
    let open = 0;
    for (let x = 1; x < nx; x++) {
      for (let y = 0; y < ny; y++) if (!left(m, x, y)) open++;
    }
    for (let x = 0; x < nx; x++) {
      for (let y = 1; y < ny; y++) if (!top(m, x, y)) open++;
    }
    expect(open).toBe(nx * ny - 1);
    // Connectivity: BFS through open edges reaches every cell.
    const seen = new Set<number>([0]);
    const queue = [0];
    while (queue.length > 0) {
      const c = queue.pop()!;
      const cx = c % nx;
      const cy = Math.floor(c / nx);
      const tryGo = (x: number, y: number, openEdge: boolean) => {
        const i = y * nx + x;
        if (openEdge && !seen.has(i)) {
          seen.add(i);
          queue.push(i);
        }
      };
      if (cx > 0) tryGo(cx - 1, cy, !left(m, cx, cy));
      if (cx < nx - 1) tryGo(cx + 1, cy, !left(m, cx + 1, cy));
      if (cy > 0) tryGo(cx, cy - 1, !top(m, cx, cy));
      if (cy < ny - 1) tryGo(cx, cy + 1, !top(m, cx, cy + 1));
    }
    expect(seen.size).toBe(nx * ny);
  });
});

describe('serialization', () => {
  it('round-trips through the flat format', () => {
    const m = randomMaze(4, 3);
    toggleTop(m, 1, 1); // make it a non-tree maze for good measure
    const flat = flattenMaze(m);
    const back = deflattenMaze(flat);
    expect(back).not.toBeNull();
    expect(flattenMaze(back!)).toBe(flat);
  });

  it('uses the original app character format', () => {
    const m = createMaze(1, 1);
    // Box the single cell.
    toggleTop(m, 0, 0);
    toggleTop(m, 0, 1);
    toggleLeft(m, 0, 0);
    toggleLeft(m, 1, 0);
    expect(flattenMaze(m)).toBe('-!||!-');
    expect(flattenMaze(createMaze(1, 1))).toBe('x!xx!x');
  });

  it('rejects malformed input', () => {
    expect(deflattenMaze('')).toBeNull();
    expect(deflattenMaze('-!|!-')).toBeNull(); // vert line too short
    expect(deflattenMaze('-!||')).toBeNull(); // even line count
  });
});
