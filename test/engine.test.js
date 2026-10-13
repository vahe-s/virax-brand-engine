import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { init, next, save, plan, select, directions, sample, approve, kit, brandDir, load, contrast, styles, root, readJSON } from '../src/engine.js';
import { customGeometry, symbolSVG } from '../src/geometry.js';
import { layoutSVG, logoModes } from '../src/layouts.js';

process.env.VIRAX_BRAND_DATA = mkdtempSync(join(tmpdir(), 'virax-brand-test-'));
const planned = (name = 'Example & Co') => {
  let profile = init(name);
  profile = save(profile.id, { ...readJSON(join(root, 'examples/fieldwork-answers.json')), expectedVersion: profile.version });
  return plan(profile.id, { ...readJSON(join(root, 'examples/coffee-design-plan.json')), expectedVersion: profile.version });
};
const selected = () => {
  const profile = planned();
  return select(profile.id, { expectedVersion: profile.version, styleId: 'precision', reason: 'The test needs a clear symbol.' });
};
const approved = () => {
  const profile = selected();
  const draft = sample(profile.id, profile.version);
  return approve(profile.id, { expectedVersion: draft.version, sampleHash: draft.sampleHash, approvedBy: 'Test reviewer', basis: 'Automated fixture only. No owner approval exists.' });
};

test('The questionnaire saves answers, resumes, and asks at most three questions.', () => {
  let profile = init('Example');
  const first = next(profile.id);
  assert.equal(first.questions.length, 3);
  assert.ok(!first.questions.some(q => q.id === 'businessName'));
  profile = save(profile.id, { expectedVersion: profile.version, answers: { offer: 'Repair service', market: 'One city', audience: 'Homeowners' } });
  assert.ok(!next(profile.id).questions.some(q => ['offer', 'market', 'audience'].includes(q.id)));
  assert.equal(readJSON(join(brandDir(profile.id), 'history/profile-v1.json')).answers.offer, undefined);
  assert.equal(load(profile.id).answers.offer, 'Repair service');
});
test('The questionnaire accepts the original-ideas path and can complete.', () => {
  const profile = init('Fieldwork Coffee');
  save(profile.id, readJSON(join(root, 'examples/fieldwork-answers.json')));
  assert.equal(next(profile.id).complete, true);
  assert.equal(next(profile.id).questions.length, 0);
});
test('Stale versions and unknown answer fields are rejected.', () => {
  const profile = init('Example');
  assert.throws(() => save(profile.id, { expectedVersion: 0, answers: { offer: 'A' } }), /Stale version/);
  assert.throws(() => save(profile.id, { expectedVersion: 1, answers: { password: 'A' } }), /Unknown answer/);
});
test('Private paths reject directory traversal and separate business profiles.', () => {
  assert.throws(() => brandDir('../other'), /valid brand ID/);
  assert.notEqual(init('Same name').id, init('Same name').id);
});
test('Seven directions contain escaped owner text and distinct symbol geometry.', () => {
  const profile = planned('<script> & Co');
  const board = directions(profile.id);
  const html = readFileSync(board.path, 'utf8');
  assert.ok(html.includes('&lt;script&gt; &amp; Co'));
  assert.ok(!html.includes('<script>'));
  assert.equal(new Set(styles.map(s => symbolSVG(s))).size, 7);
});
test('Construction guides remain absent from clean SVG files.', () => {
  const profile = selected();
  sample(profile.id, profile.version);
  const dir = join(brandDir(profile.id), load(profile.id).sample.directory);
  assert.ok(!readFileSync(join(dir, 'symbol.svg'), 'utf8').includes('construction-guides'));
  assert.ok(readFileSync(join(dir, 'symbol-guides.svg'), 'utf8').includes('construction-guides'));
});
test('Custom geometry accepts direct vector shapes and rejects active or external content.', () => {
  assert.ok(customGeometry({ elements: [{ tag: 'circle', attrs: { cx: 256, cy: 256, r: 100 } }] }).includes('<circle'));
  assert.throws(() => customGeometry({ elements: [{ tag: 'script', attrs: {} }] }), /supported/);
  assert.throws(() => customGeometry({ elements: [{ tag: 'path', attrs: { d: 'M0 0', onclick: 'alert(1)' } }] }), /Unsupported/);
  assert.throws(() => customGeometry({ elements: [{ tag: 'path', attrs: { d: 'M0 0"/><image href="https://example.com' } }] }), /Invalid path/);
});
test('Invalid colors cannot inject SVG attributes.', () => {
  const profile = planned('Example');
  assert.throws(() => select(profile.id, { expectedVersion: profile.version, styleId: 'bold', reason: 'Test', palette: { ink: 'red" onclick="x', paper: '#FFFFFF', accent: '#000000' } }), /HEX/);
});
test('The kit requires approval for the exact sample.', () => {
  const profile = selected();
  const draft = sample(profile.id, profile.version);
  assert.throws(() => kit(profile.id), /approve this sample/);
  assert.throws(() => approve(profile.id, { expectedVersion: draft.version, sampleHash: 'wrong', approvedBy: 'Test', basis: 'Fixture' }), /exact sample hash/);
});
test('A changed SVG or review board invalidates export.', () => {
  for (const file of ['symbol.svg', 'wordmark.svg', 'logo-stacked.svg', 'index.html']) {
    const profile = approved();
    writeFileSync(join(brandDir(profile.id), profile.sample.directory, file), 'Modified');
    assert.throws(() => kit(profile.id), /sample changed/);
  }
});
test('The primary file follows each supported layout, with no live text in outlined examples.', () => {
  for (const mode of logoModes) {
    let profile = planned();
    const design = readJSON(join(root, 'examples/coffee-design-plan.json'));
    const concept = design.concepts[0];
    concept.wordmarkGeometry = readJSON(join(root, 'examples/logo-formats/wordmark-geometry.json'));
    concept.integratedWordmark = readJSON(join(root, 'examples/logo-formats/integrated-geometry.json'));
    concept.wordmarkReason = 'The coffee bean replaces the dot above the i.';
    profile = plan(profile.id, { ...design, expectedVersion: profile.version });
    profile = select(profile.id, { expectedVersion: profile.version, styleId: 'precision', logoMode: mode, reason: 'Test the selected layout.' });
    sample(profile.id, profile.version);
    const updated = load(profile.id);
    const svg = readFileSync(join(brandDir(profile.id), updated.sample.directory, 'primary-logo.svg'), 'utf8');
    assert.equal(svg, layoutSVG(profile.answers.businessName, { ...styles[0], palette: concept.palette }, concept, mode));
    assert.ok(!svg.includes('<text'));
    assert.ok(updated.sample.files['wordmark.svg']);
    assert.ok(updated.sample.files['logo-stacked.svg']);
  }
});
test('An integrated selection requires its geometric source and business reason.', () => {
  const profile = planned();
  assert.throws(() => select(profile.id, { expectedVersion: profile.version, styleId: 'precision', logoMode: 'integrated-wordmark', reason: 'Test' }), /integrated letter geometry/);
  assert.throws(() => select(profile.id, { expectedVersion: profile.version, styleId: 'precision', logoMode: 'unknown', reason: 'Test' }), /supported logo layout/);
  const design = readJSON(join(root, 'examples/coffee-design-plan.json'));
  design.concepts[0].integratedWordmark = readJSON(join(root, 'examples/logo-formats/integrated-geometry.json'));
  assert.throws(() => plan(profile.id, { ...design, expectedVersion: profile.version }), /wordmark and any letter change/);
});
test('A brand rule change clears approval and requires a new sample.', () => {
  const profile = approved();
  const changed = save(profile.id, { expectedVersion: profile.version, answers: { rules: 'Use larger clear space.' } });
  assert.equal(changed.approval, null);
  assert.equal(changed.sample, null);
  assert.equal(changed.designPlan, null);
  assert.throws(() => kit(profile.id), /design plan before artwork/);
});
test('An approved kit preserves the source and leaves production checks pending.', () => {
  const profile = approved();
  const result = kit(profile.id);
  assert.ok(existsSync(join(result.path, 'tokens.css')));
  assert.ok(existsSync(join(result.path, 'fonts/inter-OFL.txt')));
  assert.deepEqual(readFileSync(join(result.path, 'symbol.svg')), readFileSync(join(brandDir(profile.id), profile.sample.directory, 'symbol.svg')));
  assert.equal(readJSON(join(result.path, 'delivery-manifest.json')).checks.outlinedWordmark, 'pending');
  assert.ok(readFileSync(join(result.path, 'BRAND-GUIDE.md'), 'utf8').includes('editable text'));
});
test('Contrast matches known reference pairs.', () => {
  assert.equal(contrast('#000000', '#FFFFFF'), 21);
  assert.equal(contrast('#FFFFFF', '#FFFFFF'), 1);
  assert.ok(Math.abs(contrast('#777777', '#FFFFFF') - 4.478) < .01);
});
test('Directions and selection require a design plan before artwork.', () => {
  const profile = init('Example');
  assert.throws(() => directions(profile.id), /design plan before artwork/);
  assert.throws(() => select(profile.id, { expectedVersion: 1, styleId: 'precision', reason: 'Test' }), /design plan before artwork/);
});
test('The design plan requires interview answers and business-linked geometry.', () => {
  const profile = init('Example');
  const input = readJSON(join(root, 'examples/coffee-design-plan.json'));
  assert.throws(() => plan(profile.id, { ...input, expectedVersion: 1 }), /design questions first/);
  const ready = save(profile.id, { ...readJSON(join(root, 'examples/fieldwork-answers.json')), expectedVersion: 1 });
  delete input.concepts[0].customSymbol;
  assert.throws(() => plan(profile.id, { ...input, expectedVersion: ready.version }), /business-linked geometry/);
});
test('Abstract symbols require an owner permission record.', () => {
  const profile = planned();
  const input = readJSON(join(root, 'examples/coffee-design-plan.json'));
  input.concepts[0].representation = 'abstract';
  assert.throws(() => plan(profile.id, { ...input, expectedVersion: profile.version }), /owner permission/);
});
test('The selected symbol comes from its concept, and the exact plan belongs to the sample.', () => {
  const profile = selected();
  assert.deepEqual(profile.selection.customSymbol, profile.designPlan.concepts[0].customSymbol);
  const draft = sample(profile.id, profile.version);
  const updated = load(profile.id);
  assert.deepEqual(readJSON(join(brandDir(profile.id), updated.sample.directory, 'design-plan.json')), profile.designPlan);
  assert.ok(updated.sample.files['design-plan.json']);
  assert.equal(draft.version, updated.version);
});
test('A plan change clears prior selection and approval.', () => {
  const profile = approved();
  const updated = plan(profile.id, { ...readJSON(join(root, 'examples/coffee-design-plan.json')), expectedVersion: profile.version });
  assert.equal(updated.selection, null);
  assert.equal(updated.sample, null);
  assert.equal(updated.approval, null);
});
test('A concept requires valid palette values, answer links, reasons, and inspected source records.', () => {
  const profile = planned();
  const mutations = [
    [input => { input.concepts[0].palette.ink = 'red'; }, /HEX colors/],
    [input => { input.concepts[0].answerLinks = ['personality']; }, /Link each concept/],
    [input => { input.concepts[0].customerReason = ''; }, /customerReason/],
    [input => { input.referenceReview.mode = 'provided'; }, /inspected reference sources/]
  ];
  for (const [mutate, expected] of mutations) {
    const input = readJSON(join(root, 'examples/coffee-design-plan.json'));
    mutate(input);
    assert.throws(() => plan(profile.id, { ...input, expectedVersion: profile.version }), expected);
  }
});
