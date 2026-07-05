import { type Maze, createMaze } from './model';

/**
 * The orthogonal maze puzzle font (Demaine/Demaine/Ku, "Origami Maze Puzzle
 * Font", G4G9), transcribed from the original app. Each glyph is
 * [leftRow0, leftRow1, tops]: vertical-edge values for the glyph's two cell
 * rows (length w) and horizontal-edge values for its three edge rows packed
 * into one array (length 3*(w-1)).
 */
type Glyph = [number[], number[], number[]];

const FONT: Record<string, Glyph> = {
  ' ': [[0], [0], []],
  A: [[1, 1], [1, 1], [1, 1, 0]],
  B: [[1, 1, 0], [1, 0, 1], [1, 0, 1, 1, 1, 1]],
  C: [[1, 0], [1, 0], [1, 0, 1]],
  d: [[0, 1], [1, 1], [0, 1, 1]],
  E: [[1, 0], [1, 0], [1, 1, 1]],
  F: [[1, 0], [1, 0], [1, 1, 0]],
  G: [[1, 0], [1, 1], [1, 0, 1]],
  H: [[1, 1], [1, 1], [0, 1, 0]],
  I: [[0, 1, 0], [0, 1, 0], [1, 1, 0, 0, 1, 1]],
  J: [[0, 1], [1, 1], [0, 0, 1]],
  K: [[1, 0, 1], [1, 1, 0], [0, 0, 1, 1, 0, 1]],
  L: [[1, 0], [1, 0], [0, 0, 1]],
  M: [[1, 1, 1], [1, 0, 1], [1, 1, 0, 0, 0, 0]],
  N: [[1, 1, 1], [1, 1, 1], [1, 0, 0, 0, 0, 1]],
  O: [[1, 1], [1, 1], [1, 0, 1]],
  P: [[1, 1], [1, 0], [1, 1, 0]],
  Q: [[1, 1, 0], [1, 1, 0], [1, 0, 0, 0, 1, 1]],
  R: [[1, 0, 1], [1, 1, 0], [1, 1, 1, 1, 0, 1]],
  S: [[1, 0], [0, 1], [1, 1, 1]],
  T: [[0, 1, 0], [0, 1, 0], [1, 1, 0, 0, 0, 0]],
  U: [[1, 1], [1, 1], [0, 0, 1]],
  V: [[1, 0, 0, 1], [0, 1, 1, 0], [0, 0, 0, 1, 0, 1, 0, 1, 0]],
  W: [[1, 0, 1], [1, 1, 1], [0, 0, 0, 0, 1, 1]],
  X: [[0, 1, 1, 0], [0, 1, 1, 0], [1, 0, 1, 0, 1, 0, 1, 0, 1]],
  Y: [[1, 1], [0, 1], [0, 1, 1]],
  Z: [[0, 0, 1], [1, 0, 0], [1, 1, 1, 1, 1, 1]],
  '1': [[1], [1], []],
  '2': [[0, 1], [1, 0], [1, 1, 1]],
  '3': [[0, 1], [0, 1], [1, 1, 1]],
  '4': [[1, 1], [0, 1], [0, 1, 0]],
  '5': [[1, 0], [0, 1], [1, 1, 1]],
  '6': [[1, 0], [1, 1], [1, 1, 1]],
  '7': [[0, 1], [0, 1], [1, 0, 0]],
  '8': [[1, 1], [1, 1], [1, 1, 1]],
  '9': [[1, 1], [0, 1], [1, 1, 0]],
  '0': [[1, 1], [1, 1], [1, 0, 1]],
  '-': [[0, 0], [0, 0], [0, 1, 0]],
  '+': [[0, 1, 0], [0, 1, 0], [0, 0, 1, 1, 0, 0]],
  '=': [[0, 0], [0, 0], [0, 1, 1]],
  "'": [[1], [0], []],
  '"': [[1, 1], [0, 0], [0, 0, 0]],
  '?': [[1, 0, 1], [0, 1, 0], [1, 1, 0, 1, 0, 0]],
  '.': [[0, 0], [0, 0], [0, 0, 1]],
  ',': [[0, 0], [0, 0], [0, 0, 1]],
  _: [[0, 0], [0, 0], [0, 0, 1]],
};

export function fontLookup(ch: string): Glyph {
  return FONT[ch] ?? FONT[ch.toLowerCase()] ?? FONT[ch.toUpperCase()] ?? [[], [], []];
}

/**
 * Lay out text as a maze: each text line takes three maze rows (two cell
 * rows + separator), each glyph w vertical-edge columns; glyphs are
 * naturally separated by the open cell between adjacent glyph columns.
 * Returns null if the text renders to an empty maze.
 */
export function textToMaze(text: string): Maze | null {
  const lines = text.split('\n').map((line) => [...line].map(fontLookup));
  const widths = lines.map((line) => line.reduce((acc, g) => acc + g[0].length, 0) - 1);
  const nx = Math.max(...widths);
  const ny = 3 * lines.length - 1;
  if (nx < 1 || ny < 1) return null;
  const m = createMaze(nx, ny);
  lines.forEach((line, i) => {
    const y = 3 * i;
    let x = 0;
    for (const g of line) {
      const w = g[0].length;
      for (let dx = 0; dx < w; dx++) {
        m.edgeLeft[x + dx]![y] = g[0][dx] ? 1 : 0;
        m.edgeLeft[x + dx]![y + 1] = g[1][dx] ? 1 : 0;
      }
      for (let dx = 0; dx < w - 1; dx++) {
        m.edgeTop[x + dx]![y] = g[2][dx] ? 1 : 0;
        m.edgeTop[x + dx]![y + 1] = g[2][w - 1 + dx] ? 1 : 0;
        m.edgeTop[x + dx]![y + 2] = g[2][2 * (w - 1) + dx] ? 1 : 0;
      }
      x += w;
    }
  });
  return m;
}
