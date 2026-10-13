import { init, save, plan, directions, select, sample, readJSON, root } from '../src/engine.js';
import { join } from 'node:path';

let profile = init('Fieldwork Coffee');
profile = save(profile.id, readJSON(join(root, 'examples/fieldwork-answers.json')));
profile = plan(profile.id, { ...readJSON(join(root, 'examples/coffee-design-plan.json')), expectedVersion: profile.version });
const board = directions(profile.id);
profile = select(profile.id, { expectedVersion: profile.version, styleId: 'editorial', reason: 'A fictional cafe brief uses calm service, warm paper, and clear type.' });
const draft = sample(profile.id, profile.version);
process.stdout.write(`${JSON.stringify({ brandId: profile.id, directions: board.path, sample: draft.path, sampleHash: draft.sampleHash, approval: 'not requested or recorded' }, null, 2)}\n`);
