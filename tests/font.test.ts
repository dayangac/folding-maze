import { describe, expect, it } from 'vitest';
import { textToMaze } from '../src/maze/font';
import { flattenMaze } from '../src/maze/serialize';

describe('textToMaze', () => {
  it('sizes the maze from the text', () => {
    // 'oov': widths 2 + 2 + 4 = 8 columns of vertical edges -> nx = 7
    // (matches the original app's "7 x 2 grid" for the same input).
    const m = textToMaze('oov')!;
    expect(m.nx).toBe(7);
    expect(m.ny).toBe(2);

    const two = textToMaze('A\nB')!;
    expect(two.ny).toBe(5);
    expect(two.nx).toBe(2); // B is 3 edge-columns wide -> nx = 2
  });

  it('renders A with the expected walls', () => {
    const m = textToMaze('A')!;
    // A = [[1,1],[1,1],[1,1,0]]: both vertical strokes both rows,
    // top bar rows 0 and 1, open bottom.
    expect(flattenMaze(m)).toBe('-!||!-!||!x');
  });

  it('is case-insensitive with fallbacks', () => {
    expect(flattenMaze(textToMaze('a')!)).toBe(flattenMaze(textToMaze('A')!));
    expect(flattenMaze(textToMaze('D')!)).toBe(flattenMaze(textToMaze('d')!));
  });

  it('returns null for empty or unrenderable text', () => {
    expect(textToMaze('')).toBeNull();
    expect(textToMaze('\n')).toBeNull();
  });

  it('leaves a one-cell gap between glyphs', () => {
    const m = textToMaze('11')!; // two single-stroke digits
    expect(m.nx).toBe(1);
    // Vertical strokes at columns 0 and 1, nothing between.
    expect(m.edgeLeft[0]![0]).toBe(1);
    expect(m.edgeLeft[1]![0]).toBe(1);
    expect(m.edgeTop[0]![0]).toBe(0);
  });
});
