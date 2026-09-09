export const defaultSelection = ['genesis-1', 'enuma-elish', 'theogony'];
export const comparisonFields = [
  ['primordial-state', 'Primordial state'],
  ['first-actors', 'First actors'],
  ['creation-order', 'Creation / order'],
  ['human-creation', 'Human creation'],
  ['divine-structure', 'Divine structure'],
  ['knowledge-mortality', 'Knowledge & mortality'],
];
export const initialMotifs = [
  'primordial-state',
  'primordial-waters',
  'chaos-unordered-state',
  'darkness',
  'creation-order',
  'divine-generation',
  'separation-of-heaven-and-earth',
  'human-creation',
  'humanity-from-clay',
  'divine-breath-life',
  'knowledge',
  'mortality',
  'divine-council',
  'divine-succession',
  'flood',
  'serpent',
  'staff-rod-scepter',
];
export const routeNames = [
  'explore',
  'timeline',
  'traditions',
  'texts',
  'compare',
  'motifs',
  'objects',
  'figures',
  'places',
  'sources',
  'research',
  'methodology',
];
export function parseRoute(hash) {
  const raw = hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  const [page = 'compare', id = ''] = path.split('/');
  return { page: page || 'compare', id, params: new URLSearchParams(query) };
}
export function selectionFromParams(params, ids) {
  if (!params.has('texts'))
    return defaultSelection.filter((id) => ids.includes(id));
  return [...new Set((params.get('texts') || '').split(','))].filter((id) =>
    ids.includes(id),
  );
}
export function comparisonHash(ids) {
  return '#/compare?texts=' + encodeURIComponent([...new Set(ids)].join(','));
}
export function compareTexts(c, ids) {
  return ids.map((id) => c.texts.find((t) => t.id === id)).filter(Boolean);
}
export function normalize(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
export function fullTextIndex(c) {
  const groups = [
    ['texts', 'texts', 'title'],
    ['sources', 'sources', 'title'],
    ['motifs', 'motifs', 'name'],
    ['objects', 'objects', 'name'],
    ['research', 'research', 'title'],
    ['figures', 'figures', 'name'],
    ['locations', 'places', 'name'],
  ];
  return groups.flatMap(([key, route, title]) =>
    c[key].map((r) => ({
      id: r.id,
      title: r[title],
      kind: route,
      href: `#/${route}/${r.id}`,
      text: normalize(JSON.stringify(r)),
    })),
  );
}
export function searchIndex(index, query) {
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return index.filter((r) => terms.every((t) => r.text.includes(t)));
}
export function timelineEntries(
  texts,
  basis = 'surviving_manuscript',
  includeContext = false,
) {
  return texts
    .map((t) => ({ text: t, date: t[basis] }))
    .filter(
      (x) => x.date && (includeContext || x.date.scope !== 'corpus-context'),
    )
    .sort(
      (a, b) =>
        (a.date.start ?? Infinity) - (b.date.start ?? Infinity) ||
        a.text.title.localeCompare(b.text.title),
    );
}
export function motifOccurrences(c, id, basis = 'surviving_manuscript') {
  return c.occurrences
    .filter((o) => o.motif === id)
    .map((o) => ({ ...o, record: c.texts.find((t) => t.id === o.text) }))
    .sort((a, b) => {
      const ad = a.record[basis],
        bd = b.record[basis];
      return (
        ((ad.scope === 'corpus-context' ? null : ad.start) ?? Infinity) -
          ((bd.scope === 'corpus-context' ? null : bd.start) ?? Infinity) ||
        a.record.title.localeCompare(b.record.title)
      );
    });
}
export function dateLabel(year) {
  return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
}
export function matrixCell(c, text, motif) {
  return (
    c.occurrences.find((o) => o.text === text && o.motif === motif) ?? null
  );
}
