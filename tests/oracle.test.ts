import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { Crease } from '../src/cp/gadgets';
import { canonicalize, generateCP } from '../src/cp/generate';
import { deflattenMaze } from '../src/maze/serialize';

// Segment sets captured from the original app's draw_cp (erikdemaine.org/
// fonts/maze) run against the same fixture mazes — the ground truth for the
// gadget geometry. Regenerate by re-running the oracle harness against the
// original maze.js source (see README credits).
interface Fixture {
  flat: string;
  lock0: boolean;
  segments: Crease[];
}

const dir = join(fileURLToPath(new URL('.', import.meta.url)), 'fixtures');
const key = (s: Crease) => `${s.x1},${s.y1},${s.x2},${s.y2},${s.mv},${s.deg}`;

describe('crease pattern matches the original implementation', () => {
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    it(file.replace('.json', ''), () => {
      const fixture = JSON.parse(readFileSync(join(dir, file), 'utf8')) as Fixture;
      const maze = deflattenMaze(fixture.flat);
      expect(maze).not.toBeNull();
      const ours = canonicalize(generateCP(maze!, fixture.lock0).creases).map(key).sort();
      const oracle = fixture.segments.map(key).sort();
      expect(ours).toEqual(oracle);
    });
  }
});
