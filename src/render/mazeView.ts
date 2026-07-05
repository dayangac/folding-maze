import { THICK, THIN } from '../constants';
import { type Maze } from '../maze/model';

export type EdgeKind = 'top' | 'left';

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  stroke: string,
  width: number,
): SVGLineElement {
  const line = document.createElementNS(SVG_NS, 'line');
  line.setAttribute('x1', String(x1));
  line.setAttribute('y1', String(y1));
  line.setAttribute('x2', String(x2));
  line.setAttribute('y2', String(y2));
  line.setAttribute('stroke', stroke);
  line.setAttribute('stroke-width', String(width));
  line.setAttribute('stroke-linecap', 'round');
  return line;
}

/**
 * Editor view: gray grid, black walls. Clicking toggles the nearest edge
 * (vertical if the click is closer to a vertical grid line, else horizontal).
 */
export function renderMazeView(
  m: Maze,
  onToggle: (kind: EdgeKind, x: number, y: number) => void,
): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  const margin = THICK;
  svg.setAttribute(
    'viewBox',
    `${-margin / 2} ${-margin / 2} ${m.nx + margin} ${m.ny + margin}`,
  );

  for (let x = 0; x <= m.nx; x++) svg.appendChild(svgLine(x, 0, x, m.ny, 'gray', THIN));
  for (let y = 0; y <= m.ny; y++) svg.appendChild(svgLine(0, y, m.nx, y, 'gray', THIN));
  for (let x = 0; x <= m.nx; x++) {
    for (let y = 0; y <= m.ny; y++) {
      if (x < m.nx && m.edgeTop[x]![y]) {
        svg.appendChild(svgLine(x, y, x + 1, y, 'black', THICK));
      }
      if (y < m.ny && m.edgeLeft[x]![y]) {
        svg.appendChild(svgLine(x, y, x, y + 1, 'black', THICK));
      }
    }
  }

  svg.addEventListener('click', (event) => {
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const pt = new DOMPoint(event.clientX, event.clientY).matrixTransform(ctm.inverse());
    if (Math.abs(pt.x - Math.round(pt.x)) < Math.abs(pt.y - Math.round(pt.y))) {
      const x = Math.round(pt.x);
      const y = Math.floor(pt.y);
      if (x >= 0 && x <= m.nx && y >= 0 && y < m.ny) onToggle('left', x, y);
    } else {
      const x = Math.floor(pt.x);
      const y = Math.round(pt.y);
      if (x >= 0 && x < m.nx && y >= 0 && y <= m.ny) onToggle('top', x, y);
    }
  });

  return svg;
}
