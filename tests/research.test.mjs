import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCorpus } from '../scripts/load-data.mjs';
import { validateCorpus } from '../scripts/validate-data.mjs';
import {
  parseRoute,
  selectionFromParams,
  comparisonHash,
  compareTexts,
  timelineEntries,
  motifOccurrences,
  matrixCell,
  fullTextIndex,
  searchIndex,
} from '../lib/engine.mjs';
const c = loadCorpus();
await test('the initial corpus satisfies schema and all cross references', () =>
  assert.deepEqual(validateCorpus(c).errors, []));
await test('broken citations fail validation', () => {
  const x = structuredClone(c);
  x.texts[0].metadata_citations[0].source = 'invented-source';
  assert.ok(
    validateCorpus(x).errors.some((e) => e.includes('invented-source')),
  );
});
await test('a non-TODO assertion without citations is rejected', () => {
  const x = structuredClone(c);
  x.texts[0].comparison['first-actors'].citations = [];
  assert.ok(validateCorpus(x).errors.length > 0);
});
await test('a discovery lead cannot support an asserted reading', () => {
  const x = structuredClone(c);
  x.texts[0].comparison['first-actors'].citations[0].source = 'ebl';
  assert.ok(validateCorpus(x).errors.some((e) => e.includes('discovery-only')));
});
await test('confidence labels cannot fabricate scholarly consensus', () => {
  const x = structuredClone(c);
  x.texts[0].comparison['first-actors'].label = 'SCHOLARLY CONSENSUS';
  assert.ok(validateCorpus(x).errors.some((e) => e.includes('survey field')));
});
await test('missing Qumran coverage cannot be populated with a guessed reading', () => {
  const x = structuredClone(c);
  x.variants[0].witnesses.find((w) => w.id === 'dss').original = 'invented';
  assert.ok(
    validateCorpus(x).errors.some((e) => e.includes('unverified witness')),
  );
});
await test('unknown and reversed chronology intervals fail', () => {
  const x = structuredClone(c);
  x.texts[0].estimated_composition.start = -1000;
  x.texts[0].estimated_composition.end = -1200;
  assert.ok(validateCorpus(x).errors.some((e) => e.includes('interval')));
});
await test('an explicit empty comparison stays empty', () =>
  assert.deepEqual(
    selectionFromParams(
      new URLSearchParams('texts='),
      c.texts.map((t) => t.id),
    ),
    [],
  ));
await test('selection links preserve order and reject unknown or repeated ids', () => {
  const ids = ['theogony', 'genesis-1', 'theogony', 'invalid'];
  const route = parseRoute(comparisonHash(ids));
  assert.deepEqual(
    selectionFromParams(
      route.params,
      c.texts.map((t) => t.id),
    ),
    ['theogony', 'genesis-1'],
  );
});
await test('comparison engine honors selected order', () =>
  assert.deepEqual(
    compareTexts(c, ['genesis-1', 'atrahasis']).map((t) => t.id),
    ['genesis-1', 'atrahasis'],
  ));
await test('missing motif means no documented entry, never absence', () =>
  assert.equal(matrixCell(c, 'genesis-1', 'cosmic-egg'), null));
await test('clay and dust are not automatically merged', () => {
  assert.equal(matrixCell(c, 'genesis-2-3', 'humanity-from-clay'), null);
  assert.ok(matrixCell(c, 'genesis-2-3', 'humanity-from-earth'));
  assert.ok(matrixCell(c, 'atrahasis', 'humanity-from-clay'));
});
await test('individual-witness chronology excludes broad corpus ranges', () => {
  const e = timelineEntries(c.texts);
  assert.ok(!e.some((e) => e.date.scope === 'corpus-context'));
  assert.ok(
    timelineEntries(c.texts, 'surviving_manuscript', true).some(
      (e) => e.date.scope === 'corpus-context',
    ),
  );
});
await test('composition proposals never inherit medieval manuscript dates', () => {
  const g = timelineEntries(c.texts, 'estimated_composition').find(
    (e) => e.text.id === 'genesis-1',
  );
  assert.equal(g.date.start, null);
  assert.equal(
    c.texts.find((t) => t.id === 'genesis-1').surviving_manuscript.start,
    1008,
  );
});
await test('unknown dates sort after known intervals', () => {
  const es = timelineEntries(c.texts);
  let unknown = false;
  for (const e of es) {
    if (e.date.start === null) unknown = true;
    else assert.equal(unknown, false);
  }
});
await test('motif chronology sends corpus contexts to the undated group', () => {
  const es = motifOccurrences(c, 'primordial-waters');
  assert.equal(es.at(-1).record.id, 'hermopolitan');
});
await test('full-text search covers original terms, objects, and citations', () => {
  const idx = fullTextIndex(c);
  assert.ok(searchIndex(idx, 'maṭṭeh').some((x) => x.id === 'moses-staff'));
  assert.ok(searchIndex(idx, 'heidel').some((x) => x.id === 'enuma-elish'));
  assert.ok(
    searchIndex(idx, 'primordial waters').some(
      (x) => x.id === 'primordial-waters',
    ),
  );
});
await test('source references cannot silently point to non-existent object comparables', () => {
  const x = structuredClone(c);
  x.objects[0].comparables.push('invented-object');
  assert.ok(
    validateCorpus(x).errors.some((e) => e.includes('invented-object')),
  );
});
