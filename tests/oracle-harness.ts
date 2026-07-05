/**
 * Fixture generator: runs the ORIGINAL maze-folding implementation's
 * draw_cp against a recorder that mimics the svg.js API it uses, bakes the
 * group transforms, compares the segments with our generateCP, and (on
 * agreement) rewrites tests/fixtures/*.json.
 *
 * The original source is NOT part of this repo; fetch it first:
 *
 *   curl -sL https://erikdemaine.org/fonts/maze/maze.js > /tmp/maze-original.js
 *   npx tsx tests/oracle-harness.ts /tmp/maze-original.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalize, generateCP } from '../src/cp/generate';
import type { Crease } from '../src/cp/gadgets';
import { textToMaze } from '../src/maze/font';
import { deflattenMaze, flattenMaze } from '../src/maze/serialize';

const sourcePath = process.argv[2];
if (!sourcePath) {
  console.error('usage: npx tsx tests/oracle-harness.ts <path-to-original-maze.js>');
  process.exit(2);
}
const src = fs.readFileSync(sourcePath, 'utf8');

// Extract the draw_cp function definition from the compiled CoffeeScript.
const start = src.indexOf('draw_cp = function(x)');
const invoke = src.indexOf('draw_cp(0)', start);
const end = src.lastIndexOf('};', invoke);
if (start < 0 || invoke < 0 || end < 0) {
  throw new Error('could not locate draw_cp in the original source — did its structure change?');
}
const body = src.slice(start, end + 2);

function runOriginal(flat: string, lock0: boolean): Crease[] {
  const maze = deflattenMaze(flat);
  if (!maze) throw new Error(`bad fixture maze: ${flat}`);
  // The original indexes edge arrays loosely and relies on undefined being
  // falsy, so hand it plain arrays shaped the way it expects.
  const edge_top: number[][] = [];
  const edge_left: number[][] = [];
  for (let x = 0; x <= maze.nx; x++) {
    edge_top[x] = [];
    edge_left[x] = [];
    for (let y = 0; y <= maze.ny; y++) {
      if (x < maze.nx) edge_top[x]![y] = maze.edgeTop[x]![y]!;
      if (y < maze.ny) edge_left[x]![y] = maze.edgeLeft[x]![y]!;
    }
  }
  const hg = 3;
  const gadget = 6;
  interface Group {
    tx: number;
    ty: number;
    rot: number;
  }
  const raw: Array<{ x1: number; y1: number; x2: number; y2: number; cls: string; g: Group }> = [];
  const cpg = {
    group() {
      const g = {
        tx: 0,
        ty: 0,
        rot: 0,
        transform(t: { translate?: [number, number]; rotate?: number }) {
          if (t.translate) {
            g.tx += t.translate[0];
            g.ty += t.translate[1];
          }
          if (t.rotate != null) g.rot += t.rotate;
          return g;
        },
        line(c: { x1: number; y1: number; x2: number; y2: number }) {
          const seg = { ...c, cls: '', g };
          raw.push(seg);
          return {
            addClass(cls: string) {
              seg.cls = cls;
            },
          };
        },
      };
      return g;
    },
  };
  const runner = new Function(
    'cpg',
    'edge_top',
    'edge_left',
    'nx',
    'ny',
    'hg',
    'gadget',
    'lock0',
    'version',
    'thisVersion',
    'setTimeout',
    `var draw_cp, y;\n${body}\ndraw_cp(0);`,
  );
  runner(cpg, edge_top, edge_left, maze.nx, maze.ny, hg, gadget, lock0, 0, 0, (fn: () => void) =>
    fn(),
  );
  return raw.map((s) => {
    const rot = ((s.g.rot % 360) + 360) % 360;
    const r = (px: number, py: number): [number, number] =>
      rot === 0 ? [px, py] : rot === 90 ? [-py, px] : rot === 180 ? [-px, -py] : [py, -px];
    const [x1, y1] = r(s.x1, s.y1);
    const [x2, y2] = r(s.x2, s.y2);
    const [name, f] = s.cls.split(' ');
    return {
      x1: x1 + hg + s.g.tx,
      y1: y1 + hg + s.g.ty,
      x2: x2 + hg + s.g.tx,
      y2: y2 + hg + s.g.ty,
      mv: name === 'mountain' ? ('M' as const) : ('V' as const),
      deg: f === 'f90' ? (90 as const) : (180 as const),
    };
  });
}

const FIXTURES: Array<{ name: string; flat: string; lock0?: boolean }> = [
  { name: 'empty-1x1', flat: 'x!xx!x' },
  { name: 'boxed-1x1', flat: '-!||!-' },
  { name: 'hrun-2x1', flat: '--!xxx!xx' },
  { name: 'vrun-1x2', flat: 'x!|x!x!|x!x' },
  { name: 'plus-2x2', flat: 'xx!x|x!--!x|x!xx' },
  { name: 'tees-box-2x2', flat: '--!|||!--!|||!--' },
  { name: 'lock0-1x1', flat: 'x!xx!x', lock0: true },
  { name: 'letter-A', flat: flattenMaze(textToMaze('A')!) },
  { name: 'sink-4x3', flat: '-x--!|x|x|!x-x-!xx|x|!--xx!|xxx|!x-x-' },
];

const key = (s: Crease) => `${s.x1},${s.y1},${s.x2},${s.y2},${s.mv},${s.deg}`;
const outDir = path.join(fileURLToPath(new URL('.', import.meta.url)), 'fixtures');
fs.mkdirSync(outDir, { recursive: true });

let failed = 0;
for (const { name, flat, lock0 = false } of FIXTURES) {
  const oracle = canonicalize(runOriginal(flat, lock0));
  const ours = canonicalize(generateCP(deflattenMaze(flat)!, lock0).creases);
  const oracleKeys = new Set(oracle.map(key));
  const ourKeys = new Set(ours.map(key));
  const missing = [...oracleKeys].filter((k) => !ourKeys.has(k));
  const extra = [...ourKeys].filter((k) => !oracleKeys.has(k));
  if (missing.length || extra.length) {
    failed++;
    console.log(`✗ ${name}: ${missing.length} missing, ${extra.length} extra`);
    for (const k of missing.slice(0, 8)) console.log(`   missing: ${k}`);
    for (const k of extra.slice(0, 8)) console.log(`   extra:   ${k}`);
  } else {
    console.log(`✓ ${name}: ${ours.length} segments match the original exactly`);
    fs.writeFileSync(
      path.join(outDir, `${name}.json`),
      JSON.stringify({ flat, lock0, segments: oracle }),
    );
  }
}
process.exit(failed ? 1 : 0);
