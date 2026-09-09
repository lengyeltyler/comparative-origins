import { mkdirSync, writeFileSync } from 'node:fs';
import { loadCorpus, root } from './load-data.mjs';
import { validateCorpus } from './validate-data.mjs';
import { comparisonFields } from '../lib/engine.mjs';
const corpus = loadCorpus(),
  result = validateCorpus(corpus);
if (result.errors.length) throw new Error(result.errors.join('\n'));
mkdirSync(root + 'public/data', { recursive: true });
mkdirSync(root + 'public/downloads', { recursive: true });
mkdirSync(root + 'site/generated', { recursive: true });
const json = JSON.stringify(corpus, null, 2) + '\n';
writeFileSync(root + 'site/generated/corpus.json', json);
writeFileSync(root + 'public/data/corpus.json', json);
const sources = Object.fromEntries(corpus.sources.map((s) => [s.id, s]));
const cell = (x) =>
  x.text.replaceAll('|', '\\|') +
  ' ' +
  x.citations
    .map((c) => `[${c.source}: ${c.locator}](${sources[c.source].url})`)
    .join('; ');
let md =
  '# Creation comparisons\n\nOriginal project summaries; source categories and citations are authoritative in corpus.json. TODO is unreviewed, not absence.\n\n';
for (const [field, title] of comparisonFields) {
  md += `## ${title}\n\n| Text | Category | Evidence |\n|---|---|---|\n`;
  for (const t of corpus.texts)
    md += `| ${t.title} | ${t.comparison[field].category} | ${cell(t.comparison[field])} |\n`;
  md += '\n';
}
writeFileSync(root + 'public/downloads/comparisons.md', md.trimEnd() + '\n');
writeFileSync(root + 'research/creation/comparisons.md', md.trimEnd() + '\n');
writeFileSync(
  root + 'public/downloads/bibliography.bib',
  corpus.sources
    .map(
      (s) =>
        `@misc{${s.id},\n  author = {${s.author}},\n  title = {${s.title}},\n  howpublished = {${s.url}},\n  note = {${s.edition}. Accessed ${s.accessed}; ${s.review_status}}\n}\n`,
    )
    .join('\n'),
);
console.log(
  `Generated corpus, ${corpus.texts.length}-text comparisons and bibliography.`,
);
// Human-readable dossiers are generated from the same classified research records.
for (const q of corpus.research) {
  let md = `# ${q.title}\n\n${q.question}\n\nStatus: ${q.status}.\n`;
  for (const s of q.sections) {
    md += `\n## ${s.title}\n\n**${s.category}**\n\n${s.body}\n`;
    if (s.citations.length)
      md +=
        '\n' +
        s.citations
          .map(
            (c) =>
              `[${sources[c.source].title} — ${c.locator}](${sources[c.source].url})`,
          )
          .join('; ') +
        '\n';
  }
  md +=
    '\n## Next evidence to collect\n\n' +
    q.next_steps.map((n) => '- ' + n).join('\n') +
    '\n';
  mkdirSync(root + 'research/' + q.id, { recursive: true });
  writeFileSync(root + 'research/' + q.id + '/README.md', md);
  writeFileSync(root + 'public/downloads/' + q.id + '.md', md);
}
