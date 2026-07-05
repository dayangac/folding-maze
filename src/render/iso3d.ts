import { CHANNEL } from '../constants';
import { type Mat3, type Vec3, mat3Apply, mat3Mul, mod, rotX, rotZ } from '../geom';
import { type Maze, left, top } from '../maze/model';

const SVG_NS = 'http://www.w3.org/2000/svg';

export interface ViewAngles {
  xang: number;
  yang: number;
}

export const RESET_ANGLES: ViewAngles = { xang: -45, yang: 45 };

function polygon(
  svg: SVGSVGElement,
  pts: Array<[number, number]>,
  fill: string,
  stroke: string,
): void {
  const poly = document.createElementNS(SVG_NS, 'polygon');
  poly.setAttribute('points', pts.map(([px, py]) => `${px},${py}`).join(' '));
  poly.setAttribute('fill', fill);
  poly.setAttribute('stroke', stroke);
  poly.setAttribute('stroke-width', '1');
  poly.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(poly);
}

/**
 * Rotatable orthographic rendering of the folded maze (grey floor, yellow
 * walls), drawn back-to-front with a painter's algorithm keyed off the two
 * camera angles — a port of the original app's d3renderNow.
 */
export function renderIso3D(
  m: Maze,
  { xang, yang }: ViewAngles,
  width: number,
  height: number,
): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

  const scale = Math.min(width, height) / Math.hypot(m.nx, m.ny);
  // Affine map p -> A*p + t, built as screen-scale · RotX · RotZ · center.
  let a: Mat3 = [
    [scale, 0, 0],
    [0, -scale, 0],
    [0, 0, scale],
  ];
  a = mat3Mul(mat3Mul(a, rotX(xang)), rotZ(yang));
  const centered = mat3Apply(a, [-m.nx / 2, -m.ny / 2, 0]);
  const t: Vec3 = [centered[0] + width / 2, centered[1] + height / 2, centered[2]];
  const project = (p: Vec3): [number, number] => {
    const q = mat3Apply(a, p);
    return [q[0] + t[0], q[1] + t[1]];
  };

  const drawFloor = () => {
    for (let x = 0; x < m.nx; x++) {
      for (let y = 0; y < m.ny; y++) {
        polygon(
          svg,
          [
            project([x, y, 0]),
            project([x + 1, y, 0]),
            project([x + 1, y + 1, 0]),
            project([x, y + 1, 0]),
          ],
          '#c0c0c0',
          'blue',
        );
      }
    }
  };

  const zmax = 1 / CHANNEL;
  const floorBelow = !(mod(xang, 360) >= 90 && mod(xang, 360) <= 270);
  if (floorBelow) drawFloor();

  const xOrder = Array.from({ length: m.nx + 1 }, (_, i) => i);
  const yOrder = Array.from({ length: m.ny + 1 }, (_, i) => i);
  if (mod(yang, 360) < 180) xOrder.reverse();
  if (mod(yang, 360) >= 90 && mod(yang, 360) <= 270) yOrder.reverse();

  for (const x of xOrder) {
    for (const y of yOrder) {
      if (x < m.nx && top(m, x, y)) {
        const wy = m.ny - y; // maze y grows down; world y grows up
        polygon(
          svg,
          [
            project([x, wy, 0]),
            project([x + 1, wy, 0]),
            project([x + 1, wy, zmax]),
            project([x, wy, zmax]),
          ],
          'yellow',
          'black',
        );
      }
      if (y < m.ny && left(m, x, y)) {
        const wy1 = m.ny - y;
        const wy2 = m.ny - (y + 1);
        polygon(
          svg,
          [
            project([x, wy1, 0]),
            project([x, wy2, 0]),
            project([x, wy2, zmax]),
            project([x, wy1, zmax]),
          ],
          'yellow',
          'black',
        );
      }
    }
  }

  if (!floorBelow) drawFloor();
  return svg;
}
