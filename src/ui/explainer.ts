import { CP_STYLES, HG } from '../constants';
import { CORNER, CROSS, DEG0, DEG1, STRAIGHT, TEE, type Crease } from '../cp/gadgets';
import { canonicalize } from '../cp/generate';

const ENTRIES: Array<{ label: string; table: readonly Crease[] }> = [
  { label: 'empty', table: DEG0 },
  { label: 'dead end', table: DEG1 },
  { label: 'straight', table: STRAIGHT },
  { label: 'corner', table: CORNER },
  { label: 'T', table: TEE },
  { label: 'cross', table: CROSS },
];

function gadgetSVG(table: readonly Crease[]): string {
  const pad = 0.15;
  const lines = canonicalize(table)
    .map(
      (c) =>
        `<line class="${c.mv === 'M' ? 'mountain' : 'valley'} f${c.deg}" ` +
        `x1="${c.x1}" y1="${c.y1}" x2="${c.x2}" y2="${c.y2}"/>`,
    )
    .join('');
  const s = HG + pad;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-s} ${-s} ${2 * s} ${2 * s}"><style>${CP_STYLES}</style>${lines}</svg>`;
}

/** The six vertex gadgets, rendered from the same tables the app folds with. */
export function renderGadgetLegend(container: HTMLElement): void {
  container.innerHTML = ENTRIES.map(
    ({ label, table }) =>
      `<figure><div class="mini">${gadgetSVG(table)}</div><figcaption>${label}</figcaption></figure>`,
  ).join('');
}
