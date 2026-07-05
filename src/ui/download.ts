export function downloadText(
  filename: string,
  text: string,
  mime = 'image/svg+xml',
): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Serialize a live SVG element into a standalone document with styles inlined. */
export function svgElementToString(svg: SVGSVGElement, styles?: string): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  if (styles) {
    const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    styleEl.textContent = styles;
    clone.insertBefore(styleEl, clone.firstChild);
  }
  return new XMLSerializer().serializeToString(clone);
}
