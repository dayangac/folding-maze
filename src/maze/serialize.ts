import { type Maze, createMaze } from './model';

// Character format shared with the original app's ?maze= parameter:
// rows alternate horizontal-edge lines ('-'/'x', nx chars, ny+1 of them) and
// vertical-edge lines ('|'/'x', nx+1 chars, ny of them), joined by '!'.
const HLINE = '-';
const VLINE = '|';
const NOLINE = 'x';
const LINESEP = '!';

export function flattenMaze(m: Maze): string {
  const lines: string[] = [];
  for (let y = 0; y <= m.ny; y++) {
    let horiz = '';
    for (let x = 0; x < m.nx; x++) horiz += m.edgeTop[x]![y] ? HLINE : NOLINE;
    lines.push(horiz);
    if (y < m.ny) {
      let vert = '';
      for (let x = 0; x <= m.nx; x++) vert += m.edgeLeft[x]![y] ? VLINE : NOLINE;
      lines.push(vert);
    }
  }
  return lines.join(LINESEP);
}

export function deflattenMaze(flat: string): Maze | null {
  const lines = flat.split(LINESEP);
  if (lines.length < 3 || lines.length % 2 === 0) return null;
  const nx = lines[0]!.length;
  const ny = (lines.length - 1) / 2;
  if (nx < 1 || ny < 1) return null;
  for (let i = 0; i < lines.length; i++) {
    const want = i % 2 === 0 ? nx : nx + 1;
    if (lines[i]!.length !== want) return null;
  }
  const m = createMaze(nx, ny);
  let line = 0;
  for (let y = 0; y <= ny; y++) {
    for (let x = 0; x < nx; x++) {
      m.edgeTop[x]![y] = lines[line]![x] === HLINE ? 1 : 0;
    }
    line++;
    if (y < ny) {
      for (let x = 0; x <= nx; x++) {
        m.edgeLeft[x]![y] = lines[line]![x] === VLINE ? 1 : 0;
      }
      line++;
    }
  }
  return m;
}
