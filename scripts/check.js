import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { root, hash, styles, questions } from '../src/engine.js';

const required = ['README.md', 'START-HERE.md', 'AGENTS.md', 'PROJECT-INSTRUCTIONS.md', 'LICENSE', 'package-lock.json', 'docs/agent-workflow.md', 'docs/questionnaire.md', 'docs/logo-construction.md', 'docs/fonts-and-colors.md', 'docs/brand-kit.md', 'docs/capabilities.md'];
const files = [];
required.push('docs/design-logic.md', 'templates/design-plan.json');
required.push('.agents/skills/logo-design/SKILL.md', '.agents/skills/logo-design/LICENSE', '.agents/skills/logo-design/TRADEMARKS.md', 'docs/logo-formats.md', 'docs/logo-design-skill.md');
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (['.git', '.data', 'node_modules'].includes(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else files.push(path);
  }
}
walk(root);
for (const name of required) if (!files.includes(join(root, name))) throw Error(`Missing file: ${name}`);
for (const path of files) {
  if (path.endsWith('.json')) JSON.parse(readFileSync(path, 'utf8'));
  if (path.endsWith('.js')) {
    const check = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
    if (check.status !== 0) throw Error(check.stderr);
  }
  if (/\.(js|json|md|css|html|yml)$/.test(path)) {
    const text = readFileSync(path, 'utf8');
    if (new RegExp('gh' + '[opusr]_[A-Za-z0-9]{30,}|AIza[A-Za-z0-9_-]{30,}|-----BEGIN ' + '(?:RSA |EC )?PRIVATE KEY-----').test(text)) throw Error(`Possible secret: ${relative(root, path)}`);
  }
}
if (styles.length !== 7 || new Set(styles.map(s => s.id)).size !== 7) throw Error('Supply seven distinct style IDs.');
if (new Set(questions.map(q => q.id)).size !== questions.length) throw Error('Question IDs must be unique.');
const sources = JSON.parse(readFileSync(join(root, 'assets/fonts/sources.json'), 'utf8'));
for (const source of sources) {
  if (hash(readFileSync(join(root, 'assets/fonts', source.file))) !== source.sha256) throw Error(`Font hash mismatch: ${source.family}`);
  if (hash(readFileSync(join(root, 'assets/fonts', source.licenseFile))) !== source.licenseSha256) throw Error(`Font license mismatch: ${source.family}`);
}
process.stdout.write(`Checked ${files.length} public files. Syntax, JSON, required docs, font hashes, and secret patterns passed.\n`);
