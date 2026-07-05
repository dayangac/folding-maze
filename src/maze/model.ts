export type Cell = 0 | 1;

/**
 * An orthogonal maze on an nx x ny cell grid. Walls live on the edges of the
 * (nx+1) x (ny+1) vertex grid; y grows downward (SVG convention).
 */
export interface Maze {
  nx: number;
  ny: number;
  /** edgeTop[x][y], 0 <= x < nx, 0 <= y <= ny: horizontal edge (x,y)-(x+1,y). */
  edgeTop: Cell[][];
  /** edgeLeft[x][y], 0 <= x <= nx, 0 <= y < ny: vertical edge (x,y)-(x,y+1). */
  edgeLeft: Cell[][];
}

function grid(cols: number, rows: number): Cell[][] {
  return Array.from({ length: cols }, () => new Array<Cell>(rows).fill(0));
}

export function createMaze(nx: number, ny: number): Maze {
  return { nx, ny, edgeTop: grid(nx, ny + 1), edgeLeft: grid(nx + 1, ny) };
}

/** Wall on horizontal edge (x,y)-(x+1,y)? Out-of-range reads are false. */
export function top(m: Maze, x: number, y: number): boolean {
  return m.edgeTop[x]?.[y] === 1;
}

/** Wall on vertical edge (x,y)-(x,y+1)? Out-of-range reads are false. */
export function left(m: Maze, x: number, y: number): boolean {
  return m.edgeLeft[x]?.[y] === 1;
}

// Walls incident to vertex (x,y), by compass direction.
export const east = (m: Maze, x: number, y: number): boolean => top(m, x, y);
export const west = (m: Maze, x: number, y: number): boolean => top(m, x - 1, y);
export const south = (m: Maze, x: number, y: number): boolean => left(m, x, y);
export const north = (m: Maze, x: number, y: number): boolean => left(m, x, y - 1);

export function toggleTop(m: Maze, x: number, y: number): void {
  const col = m.edgeTop[x];
  if (col && y >= 0 && y <= m.ny) col[y] = col[y] === 1 ? 0 : 1;
}

export function toggleLeft(m: Maze, x: number, y: number): void {
  const col = m.edgeLeft[x];
  if (col && y >= 0 && y < m.ny) col[y] = col[y] === 1 ? 0 : 1;
}

export function clearMaze(m: Maze): void {
  for (const col of m.edgeTop) col.fill(0);
  for (const col of m.edgeLeft) col.fill(0);
}

/**
 * Resize to newNx x newNy, copying old content offset by (shiftX, shiftY):
 * new edge [x][y] = old [x - shiftX][y - shiftY], missing entries empty.
 */
export function resizeMaze(
  m: Maze,
  newNx: number,
  newNy: number,
  shiftX = 0,
  shiftY = 0,
): Maze {
  const out = createMaze(newNx, newNy);
  for (let x = 0; x < newNx; x++) {
    for (let y = 0; y <= newNy; y++) {
      if (top(m, x - shiftX, y - shiftY)) out.edgeTop[x]![y] = 1;
    }
  }
  for (let x = 0; x <= newNx; x++) {
    for (let y = 0; y < newNy; y++) {
      if (left(m, x - shiftX, y - shiftY)) out.edgeLeft[x]![y] = 1;
    }
  }
  return out;
}

export function cloneMaze(m: Maze): Maze {
  return resizeMaze(m, m.nx, m.ny);
}
