import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
export const root = fileURLToPath(new URL('../', import.meta.url));
export const read = (p) => JSON.parse(readFileSync(root + p, 'utf8'));
export function loadCorpus() {
  return {
    version: '0.1.0',
    texts: readdirSync(root + 'data/texts')
      .filter((x) => x.endsWith('.json'))
      .sort()
      .map((x) => read('data/texts/' + x)),
    sources: read('sources/bibliography/sources.json'),
    motifs: read('data/motifs/vocabulary.json'),
    occurrences: read('data/motifs/occurrences.json'),
    objects: read('data/objects/objects.json'),
    variants: read('data/variants/variants.json'),
    relationships: read('data/relationships/relationships.json'),
    contacts: read('data/relationships/contacts.json'),
    figures: read('data/figures/figures.json'),
    locations: read('data/locations/locations.json'),
    traditions: readdirSync(root + 'data/traditions')
      .sort()
      .map((x) => read('data/traditions/' + x + '/index.json')),
    research: read('research/questions.json'),
    expansions: read('data/expansions.json'),
  };
}
