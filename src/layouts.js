import { escapeXML, geometry, customGeometry, logoSVG, symbolSVG } from './geometry.js';

export const logoModes = ['symbol', 'wordmark', 'combined-horizontal', 'combined-stacked', 'integrated-wordmark'];

export function validateWordmark(spec) {
  if (!spec || !Number.isFinite(spec.width) || !Number.isFinite(spec.height) || spec.width <= 0 || spec.height <= 0 || spec.width > 100000 || spec.height > 100000) throw Error('Supply positive wordmark dimensions.');
  return customGeometry(spec);
}

function wordmarkGroup(name, style, spec, color, x, y, width, height) {
  if (spec) {
    const scale = Math.min(width / spec.width, height / spec.height);
    return `<g id="wordmark" fill="${color}" transform="translate(${x + (width - spec.width * scale) / 2} ${y + (height - spec.height * scale) / 2}) scale(${scale})">${validateWordmark(spec)}</g>`;
  }
  const size = Math.min(height * .75, width / Math.max(name.length * .64, 1));
  return `<text id="wordmark" x="${x + width / 2}" y="${y + height * .68}" text-anchor="middle" font-family="${style.heading}, ${style.heading === 'Fraunces' ? 'Georgia, serif' : 'Arial, sans-serif'}" font-size="${size}" font-weight="${style.weight}" fill="${color}">${escapeXML(name)}</text>`;
}

export function layoutSVG(name, style, concept, mode, color = style.palette.ink) {
  if (!logoModes.includes(mode)) throw Error('Choose a supported logo layout.');
  if (mode === 'symbol') return symbolSVG(style, { custom: concept.customSymbol, color });
  const outlined = mode === 'integrated-wordmark' ? concept.integratedWordmark : concept.wordmarkGeometry;
  if (mode === 'integrated-wordmark' && !outlined) throw Error('Save integrated letter geometry and its reason in the design plan first.');
  let width = 1200, height = 320, content;
  if (mode === 'combined-horizontal') {
    if (!outlined) return logoSVG(name, style, { custom: concept.customSymbol, color });
    content = `<g id="symbol" transform="translate(8 8) scale(.59375)" fill="${color}">${geometry(style, concept.customSymbol)}</g>${wordmarkGroup(name, style, outlined, color, 350, 40, 810, 240)}`;
  } else if (mode === 'combined-stacked') {
    width = 900; height = 660;
    content = `<g id="symbol" transform="translate(270 24) scale(.703125)" fill="${color}">${geometry(style, concept.customSymbol)}</g>${wordmarkGroup(name, style, outlined, color, 64, 420, 772, 144)}`;
  } else {
    content = wordmarkGroup(name, style, outlined, color, 48, 40, 1104, 240);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title"><title id="title">${escapeXML(name)} ${escapeXML(mode)} ${outlined ? 'outline concept' : 'editable text draft'}</title>${content}</svg>\n`;
}
