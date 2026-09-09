import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import assert from 'node:assert/strict';
import { loadCorpus, root } from './load-data.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
const server = await createServer({
  configFile: root + 'site/vite.config.ts',
  server: { middlewareMode: true },
  appType: 'custom',
});
let checked = 0;
try {
  const ui = await server.ssrLoadModule(root + 'app/explorer.tsx');
  const c = loadCorpus();
  /** @type {Array<[string, Record<string, unknown>, string]>} */
  const cases = [
    ['Compare', { params: new URLSearchParams() }, 'Read the evidence'],
    [
      'Compare',
      { params: new URLSearchParams('texts=') },
      'Select one or more',
    ],
    [
      'Compare',
      {
        params: new URLSearchParams(
          'texts=' + c.texts.map((t) => t.id).join(','),
        ),
      },
      '11 texts selected',
    ],
    ['Timeline', {}, 'Dates, with their limits'],
    ['Motifs', { id: 'primordial-waters', query: '' }, 'Primordial waters'],
    ['Motifs', { id: 'cosmic-egg', query: '' }, 'No results'],
    ['Objects', { id: '', query: '' }, 'Objects, words'],
    ['Sources', { id: '', query: '' }, 'Follow every claim'],
    ['ResearchList', { id: '' }, 'Questions before conclusions'],
    ['Traditions', { id: '' }, 'Traditions in their own contexts'],
    ['IndexPage', { page: 'figures', id: '', query: '' }, 'People &amp; gods'],
    [
      'IndexPage',
      { page: 'places', id: '', query: '' },
      'Places &amp; provenance',
    ],
    ['Methodology', {}, 'five kinds'],
    [
      'Explore',
      { params: new URLSearchParams('q=clay') },
      'Search the evidence',
    ],
    [
      'Explore',
      { params: new URLSearchParams('q=never-matching-word') },
      'No results',
    ],
  ];
  for (const t of c.texts)
    cases.push(['TextDetail', { t }, t.title.replaceAll('’', '’')]);
  for (const q of c.research)
    cases.push([
      'ResearchList',
      { id: q.id },
      q.title.replaceAll('&', '&amp;'),
    ]);
  for (const o of c.objects)
    cases.push(['Objects', { id: o.id, query: '' }, o.name]);
  for (const [name, props, expected] of cases) {
    const html = renderToStaticMarkup(createElement(ui[name], props));
    assert.ok(
      html.includes(expected),
      `${name}: missing expected content ${expected}`,
    );
    assert.ok(!html.includes('href="undefined"'), `${name}: broken href`);
    assert.ok(!html.includes('NaN%'), `${name}: invalid timeline geometry`);
    checked++;
  }
  mkdirSync(root + 'reports', { recursive: true });
  writeFileSync(
    root + 'reports/render-checks.json',
    JSON.stringify(
      {
        status: 'PASS',
        checked,
        scope:
          'React static rendering of all major views and records, empty selection, all selection, search empty states, and unrecorded motifs. No interactive browser testing claimed.',
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`PASS: ${checked} static React render cases.`);
} finally {
  await server.close();
}
