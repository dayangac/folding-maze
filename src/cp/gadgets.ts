import { HG } from '../constants';

/**
 * A single crease in gadget-local coordinates (y down). Gadgets live in the
 * square [-HG, HG]^2; all endpoints are integers.
 *
 * Transcribed segment-by-segment from the original app's draw_cp
 * (https://erikdemaine.org/fonts/maze/maze.js, by Demaine/Demaine/Ku), which
 * is the reference for the vertex-gadget geometry of the paper
 * "Folding Any Orthogonal Maze". Some literal 2s/3s in the source are
 * genuinely not ±HG/±(HG-1); with CHANNEL=1 they coincide, but the values
 * below mirror the source exactly.
 */
export interface Crease {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  mv: 'M' | 'V';
  deg: 90 | 180;
}

type Fold = 'M180' | 'V180' | 'M90' | 'V90';

function c(x1: number, y1: number, x2: number, y2: number, fold: Fold): Crease {
  return {
    x1,
    y1,
    x2,
    y2,
    mv: fold[0] as 'M' | 'V',
    deg: fold === 'M90' || fold === 'V90' ? 90 : 180,
  };
}

const SIGNS = [-1, 1] as const;

/** Straight wall running east-west through the vertex. 19 creases. */
export const STRAIGHT: readonly Crease[] = (() => {
  const out: Crease[] = [];
  for (const s of SIGNS) {
    out.push(c(s * 2, -HG, s * 2, HG, 'M180'));
    out.push(c(s * 1, -HG, s * 1, HG, 'V180'));
    out.push(c(-HG, s * 2, -2, s * 2, 'V90'));
    out.push(c(-2, s * 2, -1, s * 2, 'M90'));
    out.push(c(-1, s * 2, 1, s * 2, 'V90'));
    out.push(c(1, s * 2, 2, s * 2, 'M90'));
    out.push(c(2, s * 2, HG, s * 2, 'V90'));
  }
  out.push(c(-HG, 0, -2, 0, 'M180'));
  out.push(c(-2, 0, -1, 0, 'V180'));
  out.push(c(-1, 0, 1, 0, 'M180'));
  out.push(c(1, 0, 2, 0, 'V180'));
  out.push(c(2, 0, HG, 0, 'M180'));
  return out;
})();

/** 90° corner: walls west and south. 34 creases. */
export const CORNER: readonly Crease[] = [
  c(-2, -HG, -2, 2, 'M180'),
  c(-2, 2, -2, HG, 'V90'),
  c(-1, -HG, -1, -1, 'V180'),
  c(-1, -1, 0, -1, 'V180'),
  c(0, -1, 1, -2, 'V180'),
  c(0, -1, 1, 0, 'V180'),
  c(1, -2, 2, -1, 'V180'),
  c(1, 0, 2, -1, 'V180'),
  c(1, -HG, 1, -2, 'V180'),
  c(2, -1, HG, -1, 'V180'),
  c(1, -3, 3, -1, 'V180'),
  c(1, 0, 1, 1, 'V180'),
  c(1, 1, HG, 1, 'V180'),
  c(2, -HG, 2, -1, 'M180'),
  c(1, -2, HG, -2, 'M180'),
  c(-HG, -2, -2, -2, 'V90'),
  c(-2, -2, -1, -2, 'M90'),
  c(-1, -2, 0, -2, 'V90'),
  c(0, -2, 0, 2, 'M90'),
  c(0, 2, 0, HG, 'M180'),
  c(-HG, 0, 0, 0, 'M180'),
  c(0, 0, 2, 0, 'M90'),
  c(2, 0, 2, 1, 'V90'),
  c(2, 1, 2, 2, 'M90'),
  c(2, 2, 2, HG, 'V90'),
  c(-HG, 2, 0, 2, 'V90'),
  c(0, 2, HG, 2, 'M180'),
  c(-2, 2, 0, 0, 'V180'),
  c(-2, 0, -1, 1, 'V180'),
  c(-1, 1, 0, 2, 'M180'),
  c(0, 2, 1, 1, 'V180'),
  c(1, 1, 3, -1, 'M180'),
  c(-2, 0, -1, -1, 'V180'),
  c(-1, -1, 1, -3, 'M180'),
];

/** Dead end: wall east only. 28 creases. */
export const DEG1: readonly Crease[] = (() => {
  const out: Crease[] = [];
  for (const s of SIGNS) {
    out.push(c(-HG, s * 2, -2, s * 2, 'M180'));
    out.push(c(-2, s * HG, -2, s * 2, 'M180'));
    out.push(c(-2, s * 2, -1, s * 3, 'V180'));
    out.push(c(-2, s * 2, 0, 0, 'M180'));
    out.push(c(0, s * 2, 0, s * 1, 'M90'));
    out.push(c(0, s * 2, 1, s * 2, 'V90'));
    out.push(c(1, s * 2, 2, s * 2, 'M90'));
    out.push(c(2, s * 2, HG, s * 2, 'V90'));
    out.push(c(-1, s * 3, 1, s * 1, 'M180'));
    out.push(c(1, s * 1, 2, 0, 'V180'));
    out.push(c(-HG, s * 1, 1, s * 1, 'V180'));
    out.push(c(1, s * HG, 1, s * 1, 'V180'));
  }
  out.push(c(-1, -HG, -1, HG, 'V180'));
  out.push(c(0, -1, 0, 1, 'V90'));
  out.push(c(2, -HG, 2, HG, 'M180'));
  out.push(c(0, 0, HG, 0, 'M180'));
  return out;
})();

/** T junction: walls west, north, south (east missing). 27 creases (1 dup). */
export const TEE: readonly Crease[] = (() => {
  const out: Crease[] = [];
  for (const s of SIGNS) {
    out.push(c(-1, s * 1, HG, s * 1, 'V180'));
    out.push(c(-2, s * 2, HG, s * 2, 'M180'));
    out.push(c(-2, s * 2, -HG, s * 2, 'V90'));
    out.push(c(-2, s * 2, -2, s * HG, 'V90'));
    out.push(c(-2, 0, -1, s * 1, 'M180'));
    out.push(c(-2, s * 2, -1, s * 1, 'V180'));
    out.push(c(-2, s * 2, -1, s * 1, 'V180')); // duplicated in the original
    out.push(c(0, s * 1, 0, s * 2, 'V180'));
    out.push(c(0, s * 2, 0, s * HG, 'M180'));
    out.push(c(2, s * 1, 2, s * 2, 'M90'));
    out.push(c(2, s * 2, 2, s * HG, 'V90'));
  }
  out.push(c(-2, -2, -2, 2, 'V90'));
  out.push(c(-1, -1, -1, 1, 'V180'));
  out.push(c(0, -1, 0, 1, 'M180'));
  out.push(c(2, -1, 2, 1, 'V90'));
  out.push(c(-HG, 0, -2, 0, 'M180'));
  return out;
})();

/** Four-way crossing. 17 creases. */
export const CROSS: readonly Crease[] = (() => {
  const out: Crease[] = [];
  for (const s of SIGNS) {
    out.push(c(-HG, s * 2, 0, s * 2, 'V90'));
    out.push(c(0, s * 2, 2, s * 2, 'M90'));
    out.push(c(2, s * 2, HG, s * 2, 'V90'));
    out.push(c(-2, s * HG, -2, s * 2, 'V90'));
    out.push(c(-2, s * 2, 2, -s * 2, 'V180'));
    out.push(c(2, s * HG, 2, s * 2, 'V90'));
  }
  out.push(c(-2, -2, -2, 2, 'M180'));
  out.push(c(0, -HG, 0, HG, 'M180'));
  out.push(c(-HG, 0, -2, 0, 'M180'));
  out.push(c(-2, 0, 0, 0, 'V180'));
  out.push(c(0, 0, HG, 0, 'M180'));
  return out;
})();

/** No walls: two crossed flat pleats. 24 creases. */
export const DEG0: readonly Crease[] = (() => {
  const out: Crease[] = [];
  for (const s of SIGNS) {
    for (const t of SIGNS) {
      out.push(c(s * HG, 2 * t, s * 2, 2 * t, 'M180'));
      out.push(c(s * 2, 2 * t, s * 1, 2 * t, 'V180'));
      out.push(c(s * HG, 1 * t, s * 2, 1 * t, 'V180'));
      out.push(c(s * 2, 1 * t, s * 1, 1 * t, 'M180'));
    }
    out.push(c(-1, 2 * s, 1, 2 * s, 'M180'));
    out.push(c(-1, 1 * s, 1, 1 * s, 'V180'));
    out.push(c(s * 2, -HG, s * 2, HG, 'M180'));
    out.push(c(s * 1, -HG, s * 1, HG, 'V180'));
  }
  return out;
})();

/** No walls, "locked" variant (twist that pins the pleats). 38 creases (2 dups). */
export const DEG0_LOCKED: readonly Crease[] = (() => {
  const out: Crease[] = [];
  for (const s of SIGNS) {
    for (const t of SIGNS) {
      out.push(c(s * HG, t * 2, s * 2, t * 2, 'M180'));
      out.push(c(s * HG, t * 1, s * 1, t * 1, 'V180'));
      out.push(c(s * 1, t * HG, s * 1, t * 1, 'V180'));
      out.push(c(s * 3, t * 1, s * 2, 0, 'M180'));
      out.push(c(s * 2, t * 2, s * 1, t * 1, 'M180'));
      out.push(c(s * 3, t * 1, s * 2, t * 2, 'V180'));
    }
    out.push(c(s * 2, -HG, s * 2, -1, 'M180'));
    out.push(c(s * 2, -1, s * 2, 0, 'V180'));
    out.push(c(s * 2, 2, s * 2, HG, 'M180'));
    out.push(c(s * 2, -2, s * 1, -2, 'V180'));
    out.push(c(s, s, -s, -s, 'V180')); // duplicated across s
    out.push(c(-s, s, s, -s, 'V180')); // duplicated across s
  }
  out.push(c(-1, -2, 1, -2, 'M180'));
  out.push(c(-2, 0, 2, 0, 'M180'));
  return out;
})();
