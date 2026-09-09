import Ajv from 'ajv';
import { loadCorpus, read } from './load-data.mjs';
import { pathToFileURL } from 'node:url';
export function validateCorpus(c) {
  const errors = [],
    warnings = [];
  const ajv = new Ajv({ allErrors: true, strict: false });
  ajv.addSchema(read('schemas/definitions.json'));
  const types = {
    texts: 'text',
    sources: 'source',
    motifs: 'motif',
    occurrences: 'occurrence',
    objects: 'object',
    variants: 'variant',
    relationships: 'relationship',
    contacts: 'contact',
    figures: 'index',
    locations: 'index',
    traditions: 'tradition',
    research: 'research',
    expansions: 'expansion',
  };
  const sets = {};
  for (const [key, type] of Object.entries(types)) {
    const check = ajv.compile(read('schemas/' + type + '.schema.json'));
    sets[key] = new Set();
    for (const r of c[key]) {
      if (sets[key].has(r.id)) errors.push(`${key}: duplicate ${r.id}`);
      sets[key].add(r.id);
      if (!check(r))
        errors.push(`${key}/${r.id}: ${ajv.errorsText(check.errors)}`);
    }
  }
  const link = (set, id, where) => {
    if (!sets[set].has(id))
      errors.push(`${where}: unknown ${set} reference ${id}`);
  };
  const walk = (x, p) => {
    if (!x || typeof x !== 'object') return;
    if ('source' in x && 'locator' in x) {
      link('sources', x.source, p);
      const s = c.sources.find((s) => s.id === x.source);
      if (s?.review_status === 'discovery-only' && !/bibliography/.test(p))
        errors.push(`${p}: discovery-only source cannot substantiate a claim`);
    }
    if ('start' in x && 'end' in x) {
      if ((x.start === null) !== (x.end === null))
        errors.push(`${p}: partial date interval`);
      if (x.start !== null && (x.start > x.end || x.start === 0 || x.end === 0))
        errors.push(`${p}: invalid historical interval (no year zero)`);
    }
    if (x.status === 'todo') warnings.push(`${p}: unresolved`);
    if (
      x.category === 'primary-evidence' &&
      x.label &&
      x.label !== 'PRIMARY SOURCE' &&
      x.status !== 'todo'
    )
      errors.push(`${p}: primary claim has misleading label`);
    if (
      ['SCHOLARLY CONSENSUS', 'MAJORITY VIEW', 'MINORITY VIEW'].includes(
        x.label,
      )
    )
      errors.push(
        `${p}: population-of-scholars labels require a survey field not supported in this edition`,
      );
    for (const [k, v] of Object.entries(x)) walk(v, `${p}/${k}`);
  };
  walk(c, 'corpus');
  for (const t of c.texts) {
    link('traditions', t.tradition, t.id);
    for (const id of t.motifs) link('motifs', id, t.id);
    for (const id of t.objects) link('objects', id, t.id);
    for (const id of t.related_texts) link('texts', id, t.id);
    for (const id of [...t.bibliography, ...t.primary_sources])
      link('sources', id, t.id);
    for (const name of t.figures)
      if (!c.figures.some((f) => f.name === name && f.texts.includes(t.id)))
        errors.push(`${t.id}: figure index mismatch ${name}`);
    for (const name of t.places)
      if (!c.locations.some((p) => p.name === name && p.texts.includes(t.id)))
        errors.push(`${t.id}: location index mismatch ${name}`);
    for (const id of t.motifs)
      if (!c.occurrences.some((o) => o.text === t.id && o.motif === id))
        errors.push(`${t.id}: motif ${id} lacks occurrence`);
  }
  for (const o of c.occurrences) {
    link('texts', o.text, o.id);
    link('motifs', o.motif, o.id);
    if (!c.texts.find((t) => t.id === o.text)?.motifs.includes(o.motif))
      errors.push(`${o.id}: text motif index mismatch`);
    if (o.attestation === 'explicit' && o.claim.category !== 'primary-evidence')
      errors.push(`${o.id}: explicit motif must point to primary evidence`);
  }
  for (const o of c.objects) {
    link('traditions', o.tradition, o.id);
    for (const id of o.comparables) link('objects', id, o.id);
    if (o.original_word && !o.terminology_citations.length)
      errors.push(`${o.id}: original term lacks citation`);
  }
  for (const v of c.variants) {
    link('texts', v.text, v.id);
    const ids = new Set();
    for (const w of v.witnesses) {
      if (ids.has(w.id)) errors.push(`${v.id}: duplicate witness`);
      ids.add(w.id);
      if (
        w.status === 'todo' &&
        [w.original, w.translation, w.transliteration].some((x) => x !== null)
      )
        errors.push(`${v.id}/${w.id}: unverified witness has a reading`);
    }
  }
  for (const r of c.relationships) {
    link('texts', r.from_text, r.id);
    link('texts', r.to_text, r.id);
    if (r.from_text === r.to_text) errors.push(`${r.id}: self relationship`);
  }
  for (const r of [...c.figures, ...c.locations])
    for (const id of r.texts) link('texts', id, r.id);
  return {
    errors,
    warnings,
    counts: Object.fromEntries(Object.keys(types).map((k) => [k, c[k].length])),
  };
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = validateCorpus(loadCorpus());
  console.log(
    JSON.stringify(
      {
        status: r.errors.length ? 'FAIL' : 'PASS',
        counts: r.counts,
        errors: r.errors,
        unresolved_fields: r.warnings.length,
        scope:
          'Structural integrity and citation resolution; not independent historical verification.',
      },
      null,
      2,
    ),
  );
  process.exitCode = r.errors.length ? 1 : 0;
}
