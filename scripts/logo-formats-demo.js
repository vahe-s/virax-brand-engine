import { init, save, plan, select, sample, readJSON, root, json } from '../src/engine.js';
import { join } from 'node:path';

let profile = init('Fieldwork Coffee');
profile = save(profile.id, readJSON(join(root, 'examples/fieldwork-answers.json')));
const design = readJSON(join(root, 'examples/coffee-design-plan.json'));
const editorial = design.concepts.find(concept => concept.styleId === 'editorial');
editorial.wordmarkGeometry = readJSON(join(root, 'examples/logo-formats/wordmark-geometry.json'));
editorial.integratedWordmark = readJSON(join(root, 'examples/logo-formats/integrated-geometry.json'));
editorial.wordmarkReason = 'A coffee bean replaces the dot above the i in Fieldwork. The letter stem stays intact. Use the plain wordmark when the bean becomes too small.';
profile = plan(profile.id, { ...design, expectedVersion: profile.version });
profile = select(profile.id, { expectedVersion: profile.version, styleId: 'editorial', logoMode: 'combined-horizontal', reason: 'Compare the symbol, name, combined layouts, and coffee bean above the i.' });
const draft = sample(profile.id, profile.version);
json(join(root, '.data/qa/logo-formats-demo.json'), { brandId: profile.id, ...draft });
process.stdout.write(`${JSON.stringify({ brandId: profile.id, ...draft, approval: 'No owner approval exists.' }, null, 2)}\n`);
