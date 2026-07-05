import { describe, expect, it } from 'vitest';
import { cpToFOLD } from '../src/cp/fold';
import { canonicalize, generateCP } from '../src/cp/generate';
import { createMaze, toggleLeft, toggleTop } from '../src/maze/model';
import { deflattenMaze } from '../src/maze/serialize';

interface Fold {
  file_spec: number;
  vertices_coords: Array<[number, number]>;
  edges_vertices: Array<[number, number]>;
  edges_assignment: string[];
  edges_foldAngle: number[];
}

function foldFor(flat: string, lock0 = false): { fold: Fold; width: number; height: number } {
  const maze = deflattenMaze(flat)!;
  const cp = generateCP(maze, lock0);
  return { fold: JSON.parse(cpToFOLD(cp)) as Fold, width: cp.width, height: cp.height };
}

const len = (f: Fold, [a, b]: [number, number]) => {
  const [x1, y1] = f.vertices_coords[a]!;
  const [x2, y2] = f.vertices_coords[b]!;
  return Math.hypot(x2 - x1, y2 - y1);
};

describe('cpToFOLD', () => {
  it('emits a structurally valid FOLD file', () => {
    const { fold } = foldFor('xx!x|x!--!x|x!xx'); // plus-sign maze
    expect(fold.file_spec).toBe(1.1);
    expect(fold.edges_vertices).toHaveLength(fold.edges_assignment.length);
    expect(fold.edges_vertices).toHaveLength(fold.edges_foldAngle.length);
    for (const [a, b] of fold.edges_vertices) {
      expect(a).not.toBe(b);
      expect(fold.vertices_coords[a]).toBeDefined();
      expect(fold.vertices_coords[b]).toBeDefined();
    }
    // Sign convention: valleys positive, mountains negative, boundary flat.
    fold.edges_assignment.forEach((assignment, i) => {
      const angle = fold.edges_foldAngle[i]!;
      if (assignment === 'V') expect(angle).toBeGreaterThan(0);
      else if (assignment === 'M') expect(angle).toBeLessThan(0);
      else expect(angle).toBe(0);
    });
    // No duplicate vertices.
    const keys = new Set(fold.vertices_coords.map(([x, y]) => `${x},${y}`));
    expect(keys.size).toBe(fold.vertices_coords.length);
  });

  it('splits the boundary and preserves total crease length', () => {
    const { fold, width, height } = foldFor('x!xx!x');
    // Boundary sub-edges sum to the rectangle perimeter and lie on it.
    let boundaryLength = 0;
    fold.edges_assignment.forEach((assignment, i) => {
      if (assignment !== 'B') return;
      const [a, b] = fold.edges_vertices[i]!;
      boundaryLength += len(fold, fold.edges_vertices[i]!);
      for (const v of [a, b]) {
        const [x, y] = fold.vertices_coords[v]!;
        const onRect = x === 0 || x === width || y === 0 || y === height;
        expect(onRect).toBe(true);
      }
    });
    expect(boundaryLength).toBeCloseTo(2 * (width + height), 6);
    // Splitting must not change total mountain/valley length.
    const maze = deflattenMaze('x!xx!x')!;
    const creases = canonicalize(generateCP(maze).creases);
    const creaseLength = creases.reduce(
      (acc, c) => acc + Math.hypot(c.x2 - c.x1, c.y2 - c.y1),
      0,
    );
    let mvLength = 0;
    fold.edges_assignment.forEach((assignment, i) => {
      if (assignment !== 'B') mvLength += len(fold, fold.edges_vertices[i]!);
    });
    expect(mvLength).toBeCloseTo(creaseLength, 6);
  });

  it('produces a planar mesh: edges meet only at shared vertices', () => {
    // Cover crossings, T-junctions, diagonals, and the lock0 twist.
    const tees = createMaze(2, 2);
    for (let x = 0; x < 2; x++) {
      toggleTop(tees, x, 0);
      toggleTop(tees, x, 2);
      toggleTop(tees, x, 1);
    }
    for (let y = 0; y < 2; y++) {
      toggleLeft(tees, 0, y);
      toggleLeft(tees, 2, y);
      toggleLeft(tees, 1, y);
    }
    for (const { fold } of [
      foldFor('-!||!-'),
      foldFor('x!xx!x', true),
      { fold: JSON.parse(cpToFOLD(generateCP(tees))) as Fold, width: 0, height: 0 },
    ]) {
      const segs = fold.edges_vertices.map(([a, b]) => ({
        p: fold.vertices_coords[a]!,
        q: fold.vertices_coords[b]!,
      }));
      for (let i = 0; i < segs.length; i++) {
        for (let j = i + 1; j < segs.length; j++) {
          const A = segs[i]!;
          const B = segs[j]!;
          const d1x = A.q[0] - A.p[0];
          const d1y = A.q[1] - A.p[1];
          const d2x = B.q[0] - B.p[0];
          const d2y = B.q[1] - B.p[1];
          const cross = d1x * d2y - d1y * d2x;
          if (Math.abs(cross) < 1e-9) continue;
          const ex = B.p[0] - A.p[0];
          const ey = B.p[1] - A.p[1];
          const t = (ex * d2y - ey * d2x) / cross;
          const u = (ex * d1y - ey * d1x) / cross;
          const interiorT = t > 1e-7 && t < 1 - 1e-7;
          const interiorU = u > 1e-7 && u < 1 - 1e-7;
          const touches = t >= -1e-7 && t <= 1 + 1e-7 && u >= -1e-7 && u <= 1 + 1e-7;
          // Edges may only meet at shared endpoints: if the segments touch,
          // the meeting point must be an endpoint of BOTH.
          if (touches && (interiorT || interiorU)) {
            expect.fail(`edges ${i} and ${j} cross away from their endpoints`);
          }
        }
      }
    }
  });
});
