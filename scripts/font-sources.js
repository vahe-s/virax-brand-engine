import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { root, hash, json } from '../src/engine.js';

const sources = [
  { family: 'Inter', file: 'inter.ttf', licenseFile: 'inter-OFL.txt', commit: '0b58fb370093f9a9f4ff785d94405710b79de67c', source: 'https://raw.githubusercontent.com/google/fonts/0b58fb370093f9a9f4ff785d94405710b79de67c/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf', licenseSource: 'https://raw.githubusercontent.com/google/fonts/0b58fb370093f9a9f4ff785d94405710b79de67c/ofl/inter/OFL.txt' },
  { family: 'Fraunces', file: 'fraunces.ttf', licenseFile: 'fraunces-OFL.txt', commit: '4024282d9b0cffcdb8e3024560862746178d741f', source: 'https://raw.githubusercontent.com/google/fonts/4024282d9b0cffcdb8e3024560862746178d741f/ofl/fraunces/Fraunces%5BSOFT%2CWONK%2Copsz%2Cwght%5D.ttf', licenseSource: 'https://raw.githubusercontent.com/google/fonts/4024282d9b0cffcdb8e3024560862746178d741f/ofl/fraunces/OFL.txt' }
].map(source => ({ ...source, sha256: hash(readFileSync(join(root, 'assets/fonts', source.file))), licenseSha256: hash(readFileSync(join(root, 'assets/fonts', source.licenseFile))), license: 'SIL Open Font License 1.1', checkedDate: '2026-10-13', style: 'upright variable font' }));
json(join(root, 'assets/fonts/sources.json'), sources);
