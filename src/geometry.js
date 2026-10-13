export const escapeXML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]);

const shapes = {
  portal: '<path d="M128 384V224a128 128 0 0 1 256 0v160h-64V224a64 64 0 0 0-128 0v160Z"/>',
  petal: '<path d="M256 112a144 144 0 1 0 0 288 144 144 0 0 0 0-288Zm0 64a80 80 0 1 1 0 160 80 80 0 0 1 0-160Z" fill-rule="evenodd"/><path d="M240 80h32v352h-32Z"/>',
  diamond: '<path d="m256 96 160 160-160 160L96 256Zm0 96-64 64 64 64 64-64Z" fill-rule="evenodd"/>',
  badge: '<path d="M256 96 384 144v128c0 64-48 112-128 144-80-32-128-80-128-144V144Zm0 64-72 28v84c0 36 24 64 72 84 48-20 72-48 72-84v-84Z" fill-rule="evenodd"/>',
  orbit: '<path d="M256 104a152 152 0 1 0 0 304 152 152 0 0 0 0-304Zm0 24a128 128 0 1 1 0 256 128 128 0 0 1 0-256Z" fill-rule="evenodd"/><path d="m256 168 88 88-88 88-88-88Zm0 34-54 54 54 54 54-54Z" fill-rule="evenodd"/>',
  tiles: '<rect x="112" y="112" width="128" height="128" rx="48"/><rect x="272" y="112" width="128" height="128" rx="48"/><rect x="112" y="272" width="128" height="128" rx="48"/><rect x="272" y="272" width="128" height="128" rx="48"/>',
  stack: '<path d="m256 96 160 96-160 96-160-96Zm0 64-64 32 64 32 64-32Z" fill-rule="evenodd"/><path d="m96 256 160 96 160-96v64l-160 96-160-96Z"/>'
};

// Custom symbols contain only local geometric primitives. No raw markup is accepted.
export function customGeometry(spec) {
  if (!spec || !Array.isArray(spec.elements) || !spec.elements.length || spec.elements.length > 100) throw Error('Use 1 to 100 geometric elements.');
  const allowed = {
    path: ['d', 'fill-rule'], rect: ['x', 'y', 'width', 'height', 'rx', 'ry'],
    circle: ['cx', 'cy', 'r'], ellipse: ['cx', 'cy', 'rx', 'ry'], polygon: ['points']
  };
  return spec.elements.map(element => {
    if (!allowed[element.tag] || !element.attrs || typeof element.attrs !== 'object' || Array.isArray(element.attrs)) throw Error('Use a supported geometric primitive.');
    const attrs = Object.entries(element.attrs).map(([key, value]) => {
      if (!allowed[element.tag].includes(key)) throw Error(`Unsupported attribute: ${key}`);
      const string = String(value);
      if (key === 'd') {
        if (!/^[MmLlHhVvCcSsQqTtAaZz0-9eE+.,\s-]+$/.test(string) || !/[Mm]/.test(string)) throw Error('Invalid path data.');
      } else if (key === 'points') {
        if (!/^[0-9eE+.,\s-]+$/.test(string)) throw Error('Invalid polygon points.');
      } else if (key === 'fill-rule') {
        if (!['evenodd', 'nonzero'].includes(string)) throw Error('Invalid fill rule.');
      } else if (!Number.isFinite(Number(value))) throw Error('Use finite geometry values.');
      return `${key}="${escapeXML(string)}"`;
    }).join(' ');
    return `<${element.tag} ${attrs}/>`;
  }).join('');
}

export function geometry(style, custom) {
  return custom ? customGeometry(custom) : shapes[style.shape];
}

export function guides() {
  let grid = '';
  for (let n = 32; n < 512; n += 32) grid += `<path d="M${n} 0V512M0 ${n}H512"/>`;
  return `<g id="construction-guides" fill="none" stroke="#62929e"><g opacity=".2" stroke-width="1">${grid}</g><g stroke-width="2" stroke-dasharray="8 8"><path d="M256 0V512M0 256H512"/><rect x="80" y="80" width="352" height="352"/><circle cx="256" cy="256" r="160"/></g><circle cx="256" cy="256" r="4" fill="#62929e"/></g>`;
}

export function symbolSVG(style, { color = style.palette.ink, guide = false, custom } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-labelledby="title"><title id="title">${escapeXML(style.name)} symbol${guide ? ' with construction guides' : ''}</title><g id="symbol" fill="${color}">${geometry(style, custom)}</g>${guide ? guides() : ''}</svg>\n`;
}

export function logoSVG(name, style, { color = style.palette.ink, custom } = {}) {
  // Text remains editable. Font files must accompany a draft wordmark.
  const fontSize = Math.min(88, 790 / Math.max(name.length * .64, 1));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 320" role="img" aria-labelledby="title"><title id="title">${escapeXML(name)} logo draft</title><g transform="translate(8 8) scale(.59375)" fill="${color}">${geometry(style, custom)}</g><text x="350" y="182" font-family="${style.heading}, ${style.heading === 'Fraunces' ? 'Georgia, serif' : 'Arial, sans-serif'}" font-size="${fontSize}" font-weight="${style.weight}" fill="${color}">${escapeXML(name)}</text></svg>\n`;
}
