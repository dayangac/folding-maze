import { TILE } from '../constants';
import { type CreasePattern, canonicalize } from './generate';

/**
 * Export a crease pattern in the FOLD format (Demaine et al.,
 * https://github.com/edemaine/fold), consumable by Origami Simulator,
 * Flat-Folder, ORIPA, etc.
 *
 * FOLD wants a planar mesh, so crossing creases and T-junctions must share
 * vertices: we split every segment at every intersection with any other
 * segment (including the paper boundary) before emitting edges. Sign
 * convention per spec: valley folds positive, mountain folds negative.
 */

interface Seg {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  assignment: 'M' | 'V' | 'B';
  angle: number;
}

const EPS = 1e-9;

/** Split params (t in [0,1]) where segment i meets segment j, and vice versa. */
function intersect(a: Seg, b: Seg, splitsA: number[], splitsB: number[]): void {
  const d1x = a.x2 - a.x1;
  const d1y = a.y2 - a.y1;
  const d2x = b.x2 - b.x1;
  const d2y = b.y2 - b.y1;
  const cross = d1x * d2y - d1y * d2x;
  if (Math.abs(cross) < EPS) return; // parallel; exact duplicates already removed
  const ex = b.x1 - a.x1;
  const ey = b.y1 - a.y1;
  const t = (ex * d2y - ey * d2x) / cross;
  const u = (ex * d1y - ey * d1x) / cross;
  if (t < -EPS || t > 1 + EPS || u < -EPS || u > 1 + EPS) return;
  splitsA.push(Math.min(1, Math.max(0, t)));
  splitsB.push(Math.min(1, Math.max(0, u)));
}

/** Planarize: subdivide all segments so they only meet at shared endpoints. */
function planarize(segs: Seg[]): Seg[] {
  // Bucket by the TILE-sized cells a segment's bbox overlaps; only segments
  // sharing a bucket can intersect. Gadget creases live within one tile, so
  // this keeps the pairwise work linear in the maze size.
  const buckets = new Map<string, number[]>();
  segs.forEach((s, i) => {
    const x0 = Math.floor((Math.min(s.x1, s.x2) - EPS) / TILE);
    const x1 = Math.floor((Math.max(s.x1, s.x2) + EPS) / TILE);
    const y0 = Math.floor((Math.min(s.y1, s.y2) - EPS) / TILE);
    const y1 = Math.floor((Math.max(s.y1, s.y2) + EPS) / TILE);
    for (let bx = x0; bx <= x1; bx++) {
      for (let by = y0; by <= y1; by++) {
        const k = `${bx},${by}`;
        let list = buckets.get(k);
        if (!list) buckets.set(k, (list = []));
        list.push(i);
      }
    }
  });

  const splits: number[][] = segs.map(() => []);
  const seenPairs = new Set<number>();
  for (const list of buckets.values()) {
    for (let ai = 0; ai < list.length; ai++) {
      for (let bi = ai + 1; bi < list.length; bi++) {
        const i = list[ai]!;
        const j = list[bi]!;
        const pairKey = i * segs.length + j;
        if (seenPairs.has(pairKey)) continue;
        seenPairs.add(pairKey);
        intersect(segs[i]!, segs[j]!, splits[i]!, splits[j]!);
      }
    }
  }

  const out: Seg[] = [];
  segs.forEach((s, i) => {
    const ts = [0, 1, ...splits[i]!].sort((a, b) => a - b);
    for (let k = 0; k + 1 < ts.length; k++) {
      const t0 = ts[k]!;
      const t1 = ts[k + 1]!;
      if (t1 - t0 < 1e-7) continue;
      out.push({
        x1: s.x1 + t0 * (s.x2 - s.x1),
        y1: s.y1 + t0 * (s.y2 - s.y1),
        x2: s.x1 + t1 * (s.x2 - s.x1),
        y2: s.y1 + t1 * (s.y2 - s.y1),
        assignment: s.assignment,
        angle: s.angle,
      });
    }
  });
  return out;
}

export function cpToFOLD(cp: CreasePattern): string {
  const segs: Seg[] = canonicalize(cp.creases).map((c) => ({
    x1: c.x1,
    y1: c.y1,
    x2: c.x2,
    y2: c.y2,
    assignment: c.mv,
    angle: (c.mv === 'V' ? 1 : -1) * c.deg,
  }));
  const w = cp.width;
  const h = cp.height;
  segs.push(
    { x1: 0, y1: 0, x2: w, y2: 0, assignment: 'B', angle: 0 },
    { x1: w, y1: 0, x2: w, y2: h, assignment: 'B', angle: 0 },
    { x1: 0, y1: h, x2: w, y2: h, assignment: 'B', angle: 0 },
    { x1: 0, y1: 0, x2: 0, y2: h, assignment: 'B', angle: 0 },
  );

  const planar = planarize(segs);

  const coords: Array<[number, number]> = [];
  const vertexIndex = new Map<string, number>();
  const vertexOf = (x: number, y: number): number => {
    const rx = Math.round(x * 1e6) / 1e6;
    const ry = Math.round(y * 1e6) / 1e6;
    const k = `${rx},${ry}`;
    let idx = vertexIndex.get(k);
    if (idx === undefined) {
      idx = coords.length;
      coords.push([rx, ry]);
      vertexIndex.set(k, idx);
    }
    return idx;
  };

  const edgesVertices: Array<[number, number]> = [];
  const edgesAssignment: string[] = [];
  const edgesFoldAngle: number[] = [];
  const seenEdges = new Set<string>();
  for (const s of planar) {
    const a = vertexOf(s.x1, s.y1);
    const b = vertexOf(s.x2, s.y2);
    if (a === b) continue;
    const k = a < b ? `${a},${b}` : `${b},${a}`;
    if (seenEdges.has(k)) continue;
    seenEdges.add(k);
    edgesVertices.push([a, b]);
    edgesAssignment.push(s.assignment);
    edgesFoldAngle.push(s.angle);
  }

  return JSON.stringify({
    file_spec: 1.1,
    file_creator: 'maze-fold (Emre Dayangac, 2026) — algorithm by Demaine/Demaine/Ku',
    file_classes: ['singleModel'],
    frame_classes: ['creasePattern'],
    frame_attributes: ['2D'],
    vertices_coords: coords,
    edges_vertices: edgesVertices,
    edges_assignment: edgesAssignment,
    edges_foldAngle: edgesFoldAngle,
  });
}
