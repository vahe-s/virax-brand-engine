import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync, cpSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { symbolSVG, escapeXML } from './geometry.js';
import { validatePlan, requirePlan, conceptFor } from './concepts.js';
import { layoutSVG, logoModes } from './layouts.js';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const styles = JSON.parse(readFileSync(join(root, 'catalog/styles.json'), 'utf8'));
export const questions = JSON.parse(readFileSync(join(root, 'catalog/questions.json'), 'utf8'));
export const readJSON = path => JSON.parse(readFileSync(path, 'utf8'));
export const hash = data => createHash('sha256').update(data).digest('hex');
export const dataRoot = () => resolve(process.env.VIRAX_BRAND_DATA || join(root, '.data'));
export function brandDir(id) {
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(id)) throw Error('Use a valid brand ID.');
  return join(dataRoot(), 'brands', id);
}
export function write(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.${randomUUID()}.tmp`;
  writeFileSync(temp, data);
  renameSync(temp, path);
}
export const json = (path, value) => write(path, `${JSON.stringify(value, null, 2)}\n`);
export const load = id => readJSON(join(brandDir(id), 'profile.json'));
function store(profile, previous) {
  const dir = brandDir(profile.id);
  if (previous) json(join(dir, 'history', `profile-v${previous.version}.json`), previous);
  json(join(dir, 'profile.json'), profile);
  json(join(dir, 'design-plan.json'), profile.designPlan ?? null);
  write(join(dir, 'brand-profile.md'), `# ${profile.answers.businessName}\n\nProfile version: ${profile.version}\n\n` + questions.filter(q => profile.answers[q.id]).map(q => `## ${q.stage}: ${q.id}\n\n${profile.answers[q.id]}\n`).join('\n'));
  return profile;
}
function current(id, expected) {
  const profile = load(id);
  if (expected !== profile.version) throw Error(`Stale version. Current version: ${profile.version}`);
  return profile;
}
function commit(previous, changes) {
  return store({ ...previous, ...changes, version: previous.version + 1 }, previous);
}
export function init(name) {
  if (typeof name !== 'string' || !name.trim() || name.length > 100) throw Error('Use a business name with 1 to 100 characters.');
  const prefix = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'brand';
  const id = `${prefix}-${randomUUID().slice(0, 8)}`;
  return store({ id, version: 1, answers: { businessName: name.trim() }, designPlan: null, selection: null, sample: null, approval: null });
}
export function next(id) {
  const profile = load(id);
  const missing = questions.filter(q => !profile.answers[q.id]);
  return { id, version: profile.version, complete: missing.length === 0, questions: missing.slice(0, 3) };
}
export function save(id, input) {
  const profile = current(id, input.expectedVersion);
  if (!input.answers || typeof input.answers !== 'object' || Array.isArray(input.answers)) throw Error('Supply an answers object.');
  for (const [key, value] of Object.entries(input.answers)) {
    if (!questions.some(q => q.id === key)) throw Error(`Unknown answer: ${key}`);
    if (typeof value !== 'string' || !value.trim() || value.length > 10000) throw Error(`Use a nonempty text answer: ${key}`);
    if (key === 'businessName' && value.length > 100) throw Error('Use a business name with 1 to 100 characters.');
  }
  return commit(profile, { answers: { ...profile.answers, ...input.answers }, designPlan: null, selection: null, sample: null, approval: null });
}
export function plan(id, input) {
  const profile = current(id, input.expectedVersion);
  const designPlan = validatePlan(profile, input, styles);
  return commit(profile, { designPlan, selection: null, sample: null, approval: null });
}
function validatePalette(palette) {
  if (!palette || Object.keys(palette).sort().join(',') !== 'accent,ink,paper') throw Error('Supply ink, paper, and accent colors.');
  for (const value of Object.values(palette)) if (!/^#[\da-f]{6}$/i.test(value)) throw Error('Use six-digit HEX colors.');
}
export function select(id, input) {
  const profile = current(id, input.expectedVersion);
  if (!styles.some(s => s.id === input.styleId)) throw Error('Unknown style ID.');
  const concept = conceptFor(profile, input.styleId);
  const logoMode = input.logoMode || 'combined-horizontal';
  if (!logoModes.includes(logoMode)) throw Error('Choose a supported logo layout.');
  if (logoMode === 'integrated-wordmark' && !concept.integratedWordmark) throw Error('Save integrated letter geometry and its reason in the design plan first.');
  if (typeof input.reason !== 'string' || !input.reason.trim()) throw Error('Record the reason for this choice.');
  if (input.palette) validatePalette(input.palette);
  if (input.customSymbol) throw Error('Revise the design plan before you change the symbol.');
  return commit(profile, { selection: { styleId: input.styleId, logoMode, reason: input.reason, ...(input.palette ? { palette: input.palette } : {}), customSymbol: concept.customSymbol }, sample: null, approval: null });
}
export function contrast(a, b) {
  const luminance = hex => {
    const rgb = hex.slice(1).match(/../g).map(x => parseInt(x, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  };
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + .05) / (values[1] + .05);
}
export function chosen(profile) {
  if (!profile.selection) throw Error('Choose a direction first.');
  const style = structuredClone(styles.find(s => s.id === profile.selection.styleId));
  style.palette = conceptFor(profile, style.id).palette;
  if (profile.selection.palette) style.palette = profile.selection.palette;
  return style;
}
const digest = profile => hash(JSON.stringify({ answers: profile.answers, designPlan: profile.designPlan, selection: profile.selection }));
function fonts(dir) {
  const source = join(root, 'assets/fonts');
  if (existsSync(source)) cpSync(source, join(dir, 'fonts'), { recursive: true });
}
const css = `@font-face{font-family:Inter;src:url('fonts/inter.ttf');font-weight:100 900}@font-face{font-family:Fraunces;src:url('fonts/fraunces.ttf');font-weight:100 900}*{box-sizing:border-box}body{margin:0;background:#f4f2ed;color:#212521;font-family:Inter,Arial,sans-serif}main{max-width:1240px;margin:auto;padding:40px 24px}h1{font-size:clamp(28px,5vw,56px);letter-spacing:-.045em;margin:12px 0}h2{font-size:24px;margin:0 0 16px}p{line-height:1.55;max-width:75ch}header{padding-bottom:32px}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px}.card{border:1px solid #d2d2cd;border-radius:12px;overflow:hidden;background:white}.art{padding:32px;min-height:320px;display:flex;flex-direction:column;justify-content:center}.art svg{width:144px;height:144px}.name{font-size:30px;line-height:1.1;overflow-wrap:anywhere;margin:16px 0}.details{padding:24px}small{display:block;line-height:1.5}.swatches{display:flex;gap:8px;margin:16px 0}.swatch{flex:1;padding:12px 6px;border:1px solid #ddd;font:12px Inter,Arial,sans-serif;text-align:center}.preview{padding:28px;border:1px solid #d2d2cd;background:white;border-radius:12px;margin:24px 0}.preview img{max-width:100%}.preview svg{display:block;width:100%;height:auto}.sizes{display:flex;align-items:center;gap:24px;flex-wrap:wrap}a{color:#165a52}code{overflow-wrap:anywhere}@media(max-width:420px){main{padding:24px 16px}.cards{grid-template-columns:1fr}.art{padding:24px}.details{padding:20px}}`;
const document = (title, content) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeXML(title)}</title><style>${css}</style></head><body><main>${content}</main></body></html>`;
export function directions(id) {
  const profile = load(id);
  requirePlan(profile);
  const dir = join(brandDir(id), `directions-v${profile.version}`);
  fonts(dir);
  for (const base of styles) {
    const concept = conceptFor(profile, base.id);
    write(join(dir, `${base.id}.svg`), symbolSVG({ ...base, palette: concept.palette }, { custom: concept.customSymbol }));
  }
  const cards = styles.map(base => {
    const style = { ...base, palette: conceptFor(profile, base.id).palette };
    const concept = conceptFor(profile, style.id);
    const reason = [concept.businessConnection, concept.customerReason, concept.fontReason, concept.colorReason];
    return `<article class="card"><div class="art" style="background:${style.palette.paper};color:${style.palette.ink}">${symbolSVG(style, { custom: concept.customSymbol })}<div class="name" style="font-family:${style.heading};font-weight:${style.weight}">${escapeXML(profile.answers.businessName)}</div><span>${escapeXML(concept.subject)}</span></div><div class="details"><h2>${escapeXML(concept.title)}</h2><small>${escapeXML(style.name)} · ${escapeXML(concept.representation)}</small>${reason.map(text => `<p>${escapeXML(text)}</p>`).join('')}<small>${style.heading} / ${style.body}</small><div class="swatches">${Object.values(style.palette).map(color => `<div class="swatch" style="background:${color};color:${contrast(color, '#FFFFFF') > contrast(color, '#000000') ? '#FFFFFF' : '#000000'}">${color}</div>`).join('')}</div><small>Concept: ${style.id}<br>Text contrast: ${contrast(style.palette.ink, style.palette.paper).toFixed(2)}:1</small></div></article>`;
  }).join('');
  write(join(dir, 'index.html'), document('Compare brand directions', `<header><h1>Seven ideas with a business reason</h1><p>${escapeXML(profile.answers.businessName)} · Profile version ${profile.version}</p><p>${escapeXML(profile.designPlan.businessSummary)}</p><p>Reference review: ${escapeXML(profile.designPlan.referenceReview.summary)}</p><p>These are business-linked concept drafts. Review the subject and design reasons before sample selection.</p></header><section class="cards">${cards}</section>`));
  json(join(dir, 'design-plan.json'), profile.designPlan);
  return { path: join(dir, 'index.html'), version: profile.version, status: 'business-linked-concepts' };
}
export function sample(id, expectedVersion) {
  const profile = current(id, expectedVersion);
  requirePlan(profile);
  const style = chosen(profile);
  const version = profile.version + 1;
  const dir = join(brandDir(id), `sample-v${version}`);
  const custom = profile.selection.customSymbol;
  const selectedConcept = conceptFor(profile, style.id);
  const mode = profile.selection.logoMode || 'combined-horizontal';
  const textNote = selectedConcept.wordmarkGeometry ? 'The wordmark uses outlined letter paths. Check the spacing and any custom letter before approval.' : 'This draft uses editable text. Check the actual fonts before approval. An outlined wordmark needs a separate export.';
  fonts(dir);
  const assets = {
    'symbol.svg': symbolSVG(style, { custom }),
    'symbol-guides.svg': symbolSVG(style, { guide: true, custom }),
    'symbol-black.svg': symbolSVG(style, { color: '#000000', custom }),
    'symbol-white.svg': symbolSVG(style, { color: '#FFFFFF', custom }),
    'primary-logo.svg': layoutSVG(profile.answers.businessName, style, selectedConcept, mode),
    'primary-logo-black.svg': layoutSVG(profile.answers.businessName, style, selectedConcept, mode, '#000000'),
    'primary-logo-white.svg': layoutSVG(profile.answers.businessName, style, selectedConcept, mode, '#FFFFFF'),
    'wordmark.svg': layoutSVG(profile.answers.businessName, style, selectedConcept, 'wordmark'),
    'logo-horizontal.svg': layoutSVG(profile.answers.businessName, style, selectedConcept, 'combined-horizontal'),
    'logo-stacked.svg': layoutSVG(profile.answers.businessName, style, selectedConcept, 'combined-stacked')
  };
  if (selectedConcept.integratedWordmark) assets['integrated-wordmark.svg'] = layoutSVG(profile.answers.businessName, style, selectedConcept, 'integrated-wordmark');
  for (const [name, data] of Object.entries(assets)) write(join(dir, name), data);
  const sizes = [16, 24, 32, 64, 128].map(size => `<div><img src="symbol.svg" width="${size}" height="${size}" alt="Symbol at ${size} pixels"><small>${size} px</small></div>`).join('');
  const concept = conceptFor(profile, style.id);
  const logic = `<h2>Why this logo</h2><p>Subject: ${escapeXML(concept.subject)}.</p><p>${escapeXML(concept.businessConnection)}</p><p>${escapeXML(concept.customerReason)}</p><p>${escapeXML(concept.fontReason)}</p><p>${escapeXML(concept.colorReason)}</p><p>${escapeXML(concept.symmetryReason)}</p>`;
  const content = `<header><h1>${escapeXML(profile.answers.businessName)}</h1><p>${escapeXML(style.name)} · Sample version ${version}</p><p>${escapeXML(profile.selection.reason)}</p>${logic}<p>${textNote}</p></header><section class="preview" style="background:${style.palette.paper}"><h2>Primary logo</h2>${layoutSVG(profile.answers.businessName, style, selectedConcept, mode)}</section><section class="preview"><h2>Small symbol check</h2><div class="sizes">${sizes}</div></section><section class="cards"><div class="preview"><h2>Construction guides</h2><img src="symbol-guides.svg" alt="Construction guides"><p>The guides show the grid, central axes, and a bounding reference. They do not prove that a custom symbol is symmetrical.</p></div><div class="preview" style="background:${style.palette.ink};color:${style.palette.paper}"><h2>Reverse logo</h2>${layoutSVG(profile.answers.businessName, style, selectedConcept, mode, '#FFFFFF')}<p>Check contrast on the actual background.</p></div></section><section class="preview"><h2>Type and color</h2><p style="font-family:${style.heading};font-size:36px">A clear voice for your business.</p><p>Body type: ${style.body}. Heading type: ${style.heading}.</p><p>Text contrast: ${contrast(style.palette.ink, style.palette.paper).toFixed(2)}:1. Accent contrast: ${contrast(style.palette.accent, style.palette.paper).toFixed(2)}:1.</p><p>These ratios describe these color pairs only. Check each final text size and background.</p></section>`;
  const formats = ['symbol', 'wordmark', 'combined-horizontal', 'combined-stacked', ...(selectedConcept.integratedWordmark ? ['integrated-wordmark'] : [])];
  const layoutContent = `<section class="preview"><h2>Choose the logo format</h2><p>Selected primary format: ${escapeXML(mode)}.</p><p>A wordmark is the business name as a logo. A combined logo places a symbol with the name.</p><p>An integrated wordmark uses a business cue inside a letter. Check that every letter still reads correctly.</p></section><section class="cards">${formats.map(format => `<article class="preview"><h2>${escapeXML(format.replaceAll('-', ' '))}</h2>${layoutSVG(profile.answers.businessName, style, selectedConcept, format)}</article>`).join('')}</section>`;
  write(join(dir, 'index.html'), document('Review the logo sample', content + layoutContent));
  json(join(dir, 'design-plan.json'), profile.designPlan);
  // Bind approval to every review file, font, and license, as well as the profile.
  const files = Object.keys(assets).concat('index.html', 'design-plan.json', 'fonts/inter.ttf', 'fonts/fraunces.ttf', 'fonts/inter-OFL.txt', 'fonts/fraunces-OFL.txt', 'fonts/sources.json');
  const fileHashes = Object.fromEntries(files.map(name => [name, hash(readFileSync(join(dir, name)))]));
  const record = { version, directory: `sample-v${version}`, profileDigest: digest(profile), files: fileHashes, status: 'draft' };
  record.hash = hash(JSON.stringify(record));
  json(join(dir, 'manifest.json'), record);
  const updated = commit(profile, { sample: record, approval: null });
  return { version: updated.version, sampleHash: record.hash, path: join(dir, 'index.html'), status: 'draft' };
}
function verifySample(profile) {
  requirePlan(profile);
  if (!profile.sample || profile.sample.profileDigest !== digest(profile)) throw Error('Create a new sample for the current profile.');
  const dir = join(brandDir(profile.id), profile.sample.directory);
  for (const [name, expected] of Object.entries(profile.sample.files)) {
    if (hash(readFileSync(join(dir, name))) !== expected) throw Error(`The sample changed: ${name}. Create a new sample before approval.`);
  }
  const { hash: expectedHash, ...record } = profile.sample;
  if (hash(JSON.stringify(record)) !== expectedHash) throw Error('The sample record changed.');
  return dir;
}
export function approve(id, input) {
  const profile = current(id, input.expectedVersion);
  verifySample(profile);
  if (input.sampleHash !== profile.sample.hash) throw Error('Approval must name the exact sample hash.');
  if (![input.approvedBy, input.basis].every(value => typeof value === 'string' && value.trim())) throw Error('Record the reviewer and the actual approval basis.');
  return commit(profile, { approval: { sampleHash: input.sampleHash, approvedBy: input.approvedBy, basis: input.basis, date: new Date().toISOString() } });
}
export function kit(id) {
  const profile = load(id);
  const sampleDir = verifySample(profile);
  if (profile.approval?.sampleHash !== profile.sample.hash) throw Error('The owner must approve this sample before the kit export.');
  const style = chosen(profile);
  const dir = join(brandDir(id), `kit-v${profile.version}`);
  const wordmarkNote = conceptFor(profile, style.id).wordmarkGeometry ? 'The SVG wordmark uses outlined paths. Inspect the spelling, curves, and spacing before final delivery.' : 'The SVG wordmark contains editable text. Install the fonts or make a separate outlined wordmark before external delivery.';
  cpSync(sampleDir, dir, { recursive: true });
  const tokens = { colors: style.palette, typography: { heading: style.heading, headingWeight: style.weight, body: style.body }, symbol: { viewBox: '0 0 512 512', gridUnit: 32, proposedClearSpace: 32 }, contrast: { textOnPaper: contrast(style.palette.ink, style.palette.paper), accentOnPaper: contrast(style.palette.accent, style.palette.paper) } };
  json(join(dir, 'tokens.json'), tokens);
  write(join(dir, 'tokens.css'), `:root {\n  --brand-ink: ${style.palette.ink};\n  --brand-paper: ${style.palette.paper};\n  --brand-accent: ${style.palette.accent};\n  --brand-heading: '${style.heading}', ${style.heading === 'Fraunces' ? 'Georgia, serif' : 'Arial, sans-serif'};\n  --brand-body: 'Inter', Arial, sans-serif;\n}\n`);
  json(join(dir, 'brand-profile.json'), profile);
  write(join(dir, 'BRAND-GUIDE.md'), `# ${profile.answers.businessName}\n\nThis kit contains the approved sample assets. Final production checks remain separate.\n\n## Brand brief\n\n${questions.filter(q => profile.answers[q.id]).map(q => `- ${q.id}: ${profile.answers[q.id]}`).join('\n')}\n\n## Design direction\n\n${style.name}. ${profile.selection.reason}\n\n## Logo use\n\nUse primary-logo.svg on a clear background.\nUse symbol.svg where the business name appears elsewhere.\nUse black or white files for one-color output.\nKeep construction guides outside production artwork.\nStart with 32 units of clear space in the 512-unit symbol box.\nInspect the symbol at 16, 24, 32, and 64 pixels.\nRecord the smallest size that stays clear.\nDo not claim symmetry from guide lines alone.\n\n## Fonts\n\nHeading: ${style.heading}. Body: ${style.body}.\nFont files and their licenses are in fonts/.\nCheck all required language glyphs.\n${wordmarkNote}\nKeep the editable source after the outline export.\n\n## Colors\n\nInk: ${style.palette.ink}. Paper: ${style.palette.paper}. Accent: ${style.palette.accent}.\nText contrast on paper: ${tokens.contrast.textOnPaper.toFixed(2)}:1.\nAccent contrast on paper: ${tokens.contrast.accentOnPaper.toFixed(2)}:1.\nHEX colors describe screen output.\nConfirm print colors with the printer and a physical proof.\n\n## Review record\n\nApproved by: ${profile.approval.approvedBy}\nSample hash: ${profile.sample.hash}\nApproval basis: ${profile.approval.basis}\n\n## Production checks\n\n- Inspect all SVG files in a browser and a vector editor.\n- Inspect the full sample at 390 px without zoom.\n- Inspect the small symbol and record the minimum size.\n- Check symmetry or record the intended optical correction.\n- Check required glyphs and the exact font weights.\n- Export an outlined wordmark and compare it with the editable source.\n- Export PNG, PDF, and print files when the brief requires them.\n- Check requested print colors with the printer.\n- Check the name and symbol for conflicts before commercial use.\n- Obtain approval for the final kit and record its exact file hashes.\n\nSample approval does not mark these checks as complete.\n`);
  json(join(dir, 'delivery-manifest.json'), { status: 'sample-approved-production-review-pending', profileVersion: profile.version, sampleHash: profile.sample.hash, tokens, checks: { visual: 'pending', phoneWidth: 'pending', symmetry: 'pending', languageGlyphs: 'pending', outlinedWordmark: 'pending', finalKitApproval: 'pending' } });
  return { path: dir, status: 'sample-approved-production-review-pending' };
}
