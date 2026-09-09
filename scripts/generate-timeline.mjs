import { mkdirSync, writeFileSync } from 'node:fs';
import { loadCorpus, root } from './load-data.mjs';
import { validateCorpus } from './validate-data.mjs';
import { timelineEntries } from '../lib/engine.mjs';
const c = loadCorpus(),
  result = validateCorpus(c);
if (result.errors.length) throw new Error(result.errors.join('\n'));
mkdirSync(root + 'public/data', { recursive: true });
const output = {
  note: 'Negative years are BCE; no year zero. Date classes never merged. Corpus contexts excluded.',
  composition: timelineEntries(c.texts, 'estimated_composition'),
  surviving_witness: timelineEntries(c.texts),
  earliest_witness: timelineEntries(c.texts, 'earliest_witness'),
};
writeFileSync(
  root + 'public/data/timeline.json',
  JSON.stringify(output, null, 2) + '\n',
);
console.log('Generated three separately typed timelines.');
