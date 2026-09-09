import { loadCorpus, root } from './load-data.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
const sources = loadCorpus().sources,
  results = [];
let cursor = 0;
async function worker() {
  while (cursor < sources.length) {
    const s = sources[cursor++];
    try {
      const r = await fetch(s.url, {
        signal: AbortSignal.timeout(12000),
        headers: { 'User-Agent': 'ComparativeOrigins/0.1 source-link-check' },
      });
      results.push({
        id: s.id,
        url: s.url,
        status: r.status,
        resolved_url: r.url,
        result: r.ok ? 'reachable' : 'needs-review',
      });
      await r.body?.cancel();
    } catch (e) {
      results.push({
        id: s.id,
        url: s.url,
        status: null,
        result: 'needs-review',
        error: e.message,
      });
    }
  }
}
await Promise.all([worker(), worker(), worker(), worker()]);
results.sort((a, b) => a.id.localeCompare(b.id));
mkdirSync(root + 'reports', { recursive: true });
const report = {
  checked_at: new Date().toISOString(),
  scope:
    'HTTP availability only. A successful response does not verify an ancient reading or scholarly conclusion. Blocks and timeouts are not evidence of invalid citations.',
  reachable: results.filter((r) => r.result === 'reachable').length,
  total: results.length,
  results,
};
writeFileSync(
  root + 'reports/source-links.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(
  JSON.stringify(
    {
      reachable: report.reachable,
      total: report.total,
      needs_review: results
        .filter((r) => r.result !== 'reachable')
        .map((r) => ({ id: r.id, status: r.status, error: r.error })),
    },
    null,
    2,
  ),
);
