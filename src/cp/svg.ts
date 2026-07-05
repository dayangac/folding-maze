import { CP_SIM_STYLES, CP_STYLES, THICK } from '../constants';
import { type CreasePattern, canonicalize } from './generate';

/**
 * Render a crease pattern as a standalone SVG document string. Styles are
 * embedded, so the same string serves the live view and the downloaded file.
 * The 'simulator' variant uses Origami Simulator's color/opacity convention.
 */
export function cpToSVG(cp: CreasePattern, variant: 'normal' | 'simulator' = 'normal'): string {
  const margin = THICK;
  const lines = canonicalize(cp.creases)
    .map(
      (c) =>
        `<line class="${c.mv === 'M' ? 'mountain' : 'valley'} f${c.deg}" ` +
        `x1="${c.x1}" y1="${c.y1}" x2="${c.x2}" y2="${c.y2}"/>`,
    )
    .join('\n  ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-margin / 2} ${-margin / 2} ${
    cp.width + margin
  } ${cp.height + margin}">
  <style>${variant === 'simulator' ? CP_SIM_STYLES : CP_STYLES}</style>
  <rect class="boundary" x="0" y="0" width="${cp.width}" height="${cp.height}"/>
  ${lines}
</svg>`;
}
