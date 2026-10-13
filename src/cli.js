import { init, next, save, load, select, directions, sample, approve, kit, readJSON, root, styles, questions } from './engine.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const [command, id, file] = process.argv.slice(2);
try {
  let result;
  switch (command) {
    case 'init': result = init(id); break;
    case 'next': result = next(id); break;
    case 'show': result = load(id); break;
    case 'save': result = save(id, readJSON(file)); break;
    case 'directions': result = directions(id); break;
    case 'select': result = select(id, readJSON(file)); break;
    case 'sample': result = sample(id, Number(file)); break;
    case 'approve': result = approve(id, readJSON(file)); break;
    case 'kit': result = kit(id); break;
    case 'doctor': {
      const [major, minor] = process.versions.node.split('.').map(Number);
      const ok = ((major === 22 && minor >= 16) || major === 23 || major === 24) && ['inter.ttf', 'fraunces.ttf', 'inter-OFL.txt', 'fraunces-OFL.txt', 'sources.json'].every(name => existsSync(join(root, 'assets/fonts', name)));
      result = { ok, node: process.versions.node, styles: styles.length, questions: questions.length, networkRequired: false, interface: 'agent-chat', capabilities: ['saved questionnaire', 'seven starter directions', 'custom geometric symbols', 'SVG construction guides', 'font previews', 'color contrast ratios', 'sample approval', 'brand kit export'], limits: ['The agent must adapt starter concepts.', 'The wordmark contains editable text.', 'PNG, PDF, outline, print, and name checks require separate tools.'] };
      if (!ok) process.exitCode = 1;
      break;
    }
    default: result = { commands: ['doctor', 'init "Business name"', 'next BRAND_ID', 'show BRAND_ID', 'save BRAND_ID answers.json', 'directions BRAND_ID', 'select BRAND_ID selection.json', 'sample BRAND_ID VERSION', 'approve BRAND_ID approval.json', 'kit BRAND_ID'] };
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
