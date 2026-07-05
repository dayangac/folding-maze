import { type Maze, createMaze } from './model';

/**
 * Generate a random maze: grow a uniform random spanning tree over the cells
 * (random-frontier growth, as in the original app), then place walls on all
 * boundary edges and every interior edge not crossed by a tree edge.
 */
export function randomMaze(nx: number, ny: number, rng: () => number = Math.random): Maze {
  const m = createMaze(nx, ny);
  const idx = (x: number, y: number) => y * nx + x;

  // parent[cell] = cell it was adopted from (root: itself).
  const parent = new Int32Array(nx * ny).fill(-1);
  parent[0] = 0;
  const frontier: Array<[number, number]> = []; // [parentIdx, childIdx]
  const pushNeighbors = (x: number, y: number) => {
    const p = idx(x, y);
    if (x > 0) frontier.push([p, idx(x - 1, y)]);
    if (y > 0) frontier.push([p, idx(x, y - 1)]);
    if (x < nx - 1) frontier.push([p, idx(x + 1, y)]);
    if (y < ny - 1) frontier.push([p, idx(x, y + 1)]);
  };
  pushNeighbors(0, 0);
  while (frontier.length > 0) {
    const i = Math.floor(rng() * frontier.length);
    const [p, c] = frontier[i]!;
    frontier[i] = frontier[frontier.length - 1]!;
    frontier.pop();
    if (parent[c] === -1) {
      parent[c] = p;
      pushNeighbors(c % nx, Math.floor(c / nx));
    }
  }

  const linked = (a: number, b: number) => parent[a] === b || parent[b] === a;

  for (let y = 0; y < ny; y++) {
    m.edgeLeft[0]![y] = 1;
    m.edgeLeft[nx]![y] = 1;
    for (let x = 1; x < nx; x++) {
      m.edgeLeft[x]![y] = linked(idx(x - 1, y), idx(x, y)) ? 0 : 1;
    }
  }
  for (let x = 0; x < nx; x++) {
    m.edgeTop[x]![0] = 1;
    m.edgeTop[x]![ny] = 1;
    for (let y = 1; y < ny; y++) {
      m.edgeTop[x]![y] = linked(idx(x, y - 1), idx(x, y)) ? 0 : 1;
    }
  }
  return m;
}
