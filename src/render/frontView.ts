import { THICK, THIN } from '../constants';
import { type Maze, left, top } from '../maze/model';

// Constants from the original app's draw_front3.
const EPS = 0.1; // wall thickness on each side of the grid line
const OFFSET = 0.5; // fake-height shear: walls extend by (+OFFSET, -OFFSET)

const SVG_NS = 'http://www.w3.org/2000/svg';

type Pt = [number, number];

function poly(svg: SVGSVGElement, pts: Pt[], stroked = true): void {
  const el = document.createElementNS(SVG_NS, 'polygon');
  el.setAttribute('points', pts.map(([x, y]) => `${x},${y}`).join(' '));
  el.setAttribute('fill', 'yellow');
  if (stroked) {
    el.setAttribute('stroke', 'black');
    el.setAttribute('stroke-width', String(THIN));
    el.setAttribute('stroke-linejoin', 'round');
  }
  svg.appendChild(el);
}

function rect(svg: SVGSVGElement, x: number, y: number, w: number, h: number, fill: string, stroke?: string): void {
  const el = document.createElementNS(SVG_NS, 'rect');
  el.setAttribute('x', String(x));
  el.setAttribute('y', String(y));
  el.setAttribute('width', String(w));
  el.setAttribute('height', String(h));
  el.setAttribute('fill', fill);
  if (stroke) {
    el.setAttribute('stroke', stroke);
    el.setAttribute('stroke-width', String(THIN));
  }
  svg.appendChild(el);
}

/**
 * Top-down view with walls drawn as sheared yellow slabs (a fake axonometric
 * "front view") — port of the original app's draw_front3, including its
 * eight neighbor-dependent end-extension rules that miter wall junctions.
 */
export function renderFrontView(m: Maze): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  const fm = OFFSET + EPS + THICK;
  svg.setAttribute('viewBox', `${-fm} ${-fm} ${m.nx + 2 * fm} ${m.ny + 2 * fm}`);

  // Static floor.
  for (let x = 0; x < m.nx; x++) {
    for (let y = 0; y < m.ny; y++) rect(svg, x, y, 1, 1, '#c0c0c0', 'blue');
  }

  for (let y = 0; y <= m.ny; y++) {
    // Horizontal walls, back (upper) face.
    for (let x = 0; x < m.nx; x++) {
      if (!top(m, x, y)) continue;
      const e1 = left(m, x, y - 1) ? -1 : top(m, x - 1, y) ? 0 : 1;
      const e2 = left(m, x + 1, y - 1) ? -1 : top(m, x + 1, y) ? 0 : 1;
      poly(svg, [
        [x - e1 * EPS, y - EPS],
        [x + e2 * EPS + 1, y - EPS],
        [x + e2 * EPS + 1 + OFFSET, y - EPS - OFFSET],
        [x - e1 * EPS + OFFSET, y - EPS - OFFSET],
      ]);
    }
    // End slivers for horizontal walls.
    for (let x = 0; x < m.nx; x++) {
      if (top(m, x, y) && !top(m, x - 1, y) && !left(m, x, y) && !left(m, x, y - 1)) {
        poly(svg, [
          [x - EPS, y + EPS],
          [x - EPS + OFFSET, y + EPS - OFFSET],
          [x - EPS + OFFSET, y - EPS - OFFSET],
          [x - EPS, y - EPS],
        ]);
      }
      if (top(m, x, y) && !top(m, x + 1, y) && !left(m, x + 1, y) && !left(m, x + 1, y - 1)) {
        poly(svg, [
          [x + 1 + EPS, y + EPS],
          [x + 1 + EPS + OFFSET, y + EPS - OFFSET],
          [x + 1 + EPS + OFFSET, y - EPS - OFFSET],
          [x + 1 + EPS, y - EPS],
        ]);
      }
    }
    // Horizontal walls, front (lower) face.
    for (let x = 0; x < m.nx; x++) {
      if (!top(m, x, y)) continue;
      const e1 = left(m, x, y) ? -1 : top(m, x - 1, y) ? 0 : 1;
      const e2 = left(m, x + 1, y) ? -1 : top(m, x + 1, y) ? 0 : 1;
      poly(svg, [
        [x - e1 * EPS, y + EPS],
        [x + e2 * EPS + 1, y + EPS],
        [x + e2 * EPS + 1 + OFFSET, y + EPS - OFFSET],
        [x - e1 * EPS + OFFSET, y + EPS - OFFSET],
      ]);
    }
    if (y < m.ny) {
      // Top slivers for vertical walls.
      for (let x = 0; x <= m.nx; x++) {
        if (left(m, x, y) && !left(m, x, y - 1) && !top(m, x, y) && !top(m, x - 1, y)) {
          poly(svg, [
            [x - EPS, y - EPS],
            [x - EPS + OFFSET, y - EPS - OFFSET],
            [x + EPS + OFFSET, y - EPS - OFFSET],
            [x + EPS, y - EPS],
          ]);
        }
      }
      // Vertical walls, back (right) and front (left) faces.
      for (let x = 0; x <= m.nx; x++) {
        if (!left(m, x, y)) continue;
        let e1 = top(m, x, y) ? -1 : left(m, x, y - 1) ? 0 : 1;
        let e2 = top(m, x, y + 1) ? -1 : left(m, x, y + 1) ? 0 : 1;
        poly(svg, [
          [x + EPS, y - e1 * EPS],
          [x + EPS, y + e2 * EPS + 1],
          [x + EPS + OFFSET, y + e2 * EPS + 1 - OFFSET],
          [x + EPS + OFFSET, y - e1 * EPS - OFFSET],
        ]);
        e1 = top(m, x - 1, y) ? -1 : left(m, x, y - 1) ? 0 : 1;
        e2 = top(m, x - 1, y + 1) ? -1 : left(m, x, y + 1) ? 0 : 1;
        poly(svg, [
          [x - EPS, y - e1 * EPS],
          [x - EPS, y + e2 * EPS + 1],
          [x - EPS + OFFSET, y + e2 * EPS + 1 - OFFSET],
          [x - EPS + OFFSET, y - e1 * EPS - OFFSET],
        ]);
      }
      // Bottom slivers for vertical walls.
      for (let x = 0; x <= m.nx; x++) {
        if (left(m, x, y) && !left(m, x, y + 1) && !top(m, x, y + 1) && !top(m, x - 1, y + 1)) {
          poly(svg, [
            [x - EPS, y + 1 + EPS],
            [x - EPS + OFFSET, y + 1 + EPS - OFFSET],
            [x + EPS + OFFSET, y + 1 + EPS - OFFSET],
            [x + EPS, y + 1 + EPS],
          ]);
        }
      }
    }
  }

  // Flat wall tops, drawn last to cover the face strokes.
  for (let y = 0; y <= m.ny; y++) {
    for (let x = 0; x < m.nx; x++) {
      if (top(m, x, y)) {
        rect(
          svg,
          x - EPS + OFFSET + THIN / 2,
          y - OFFSET - EPS + THIN / 2,
          1 - THIN + 2 * EPS,
          2 * EPS - THIN,
          'yellow',
        );
      }
    }
    if (y < m.ny) {
      for (let x = 0; x <= m.nx; x++) {
        if (left(m, x, y)) {
          rect(
            svg,
            x + OFFSET - EPS + THIN / 2,
            y - EPS - OFFSET + THIN / 2,
            2 * EPS - THIN,
            1 - THIN + 2 * EPS,
            'yellow',
          );
        }
      }
    }
  }

  return svg;
}
