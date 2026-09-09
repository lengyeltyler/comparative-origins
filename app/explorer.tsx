'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  ArrowRight,
  BookOpen,
  Download,
  SlidersHorizontal,
  Layers3,
  Compass,
  ExternalLink,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableCaption,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import rawCorpus from '@/site/generated/corpus.json';
import type {
  Corpus,
  Citation,
  Claim,
  DateRecord,
  TextRecord,
  ObjectRecord,
  Research,
  Category,
} from '@/lib/model';
import {
  comparisonFields,
  defaultSelection,
  initialMotifs,
  parseRoute,
  selectionFromParams,
  comparisonHash,
  compareTexts,
  timelineEntries,
  motifOccurrences,
  matrixCell,
  fullTextIndex,
  searchIndex,
  normalize,
} from '@/lib/engine.mjs';
const corpus = rawCorpus as Corpus;
const sourceMap = Object.fromEntries(corpus.sources.map((s) => [s.id, s]));
const textMap = Object.fromEntries(corpus.texts.map((t) => [t.id, t]));
const searchData = fullTextIndex(corpus);
const nav = [
  ['explore', 'Explore'],
  ['timeline', 'Timeline'],
  ['traditions', 'Traditions'],
  ['texts', 'Texts'],
  ['compare', 'Compare'],
  ['motifs', 'Motifs'],
  ['objects', 'Objects'],
  ['figures', 'People & Gods'],
  ['places', 'Places'],
  ['sources', 'Sources'],
  ['research', 'Research Questions'],
];
const categoryNames: Record<Category, string> = {
  'primary-evidence': 'Primary evidence',
  'textual-reconstruction': 'Textual reconstruction',
  'historical-interpretation': 'Historical interpretation',
  'traditional-interpretation': 'Traditional / religious interpretation',
  speculation: 'Hypothesis / speculation',
};
const pretty = (s: string) => s.replaceAll('-', ' ');
function href(page: string, id = '') {
  return '#/' + page + (id ? '/' + id : '');
}
function Cite({ refs }: { refs: Citation[] }) {
  return (
    <div className="citations">
      {refs.map((r, i) => (
        <a
          key={r.source + r.locator + i}
          href={sourceMap[r.source]?.url}
          target="_blank"
          rel="noreferrer"
          className="citation"
          title={sourceMap[r.source]?.title}
        >
          {r.source} · {r.locator}{' '}
          <ExternalLink size={11} aria-label="external source" />
        </a>
      ))}
    </div>
  );
}
function Evidence({
  claim,
  compact = false,
}: {
  claim: Claim;
  compact?: boolean;
}) {
  return (
    <div className={'evidence ' + (compact ? 'compact' : '')}>
      <span className={'badge ' + claim.category + ' ' + claim.status}>
        {claim.label}
      </span>
      {claim.status !== 'todo' && (
        <span className="certainty">{pretty(claim.confidence)} confidence</span>
      )}
      <p>{claim.text}</p>
      {!compact && claim.status !== 'todo' && (
        <small className="category">{categoryNames[claim.category]}</small>
      )}
      <Cite refs={claim.citations} />
    </div>
  );
}
function DateInfo({ date }: { date: DateRecord }) {
  return (
    <div className="date-info">
      <strong>{date.label}</strong>
      <small>
        {pretty(date.scope)} · {pretty(date.confidence)} confidence
      </small>
      <Cite refs={date.citations} />
    </div>
  );
}
function Title({
  eyebrow = 'CREATION & PRIMORDIAL HISTORY',
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="page-title">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {description && <p className="intro">{description}</p>}
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="empty">
      <Compass size={28} />
      <h2>No results in this edition</h2>
      <p>{children}</p>
    </div>
  );
}
function Picker({
  value,
  onChange,
  label,
  items,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  items: { value: string; label: string }[];
}) {
  return (
    <div className="picker">
      <span>{label}</span>
      <Select
        value={value}
        onValueChange={(v) => {
          if (v !== null) onChange(v as string);
        }}
      >
        <SelectTrigger aria-label={label}>
          <SelectValue>
            {items.find((x) => x.value === value)?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {items.map((x) => (
            <SelectItem key={x.value} value={x.value}>
              {x.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
function FilterInput({
  query,
  setQuery,
  label = 'Filter this collection',
}: {
  query: string;
  setQuery: (s: string) => void;
  label?: string;
}) {
  return (
    <label className="filter-input">
      <Search size={18} />
      <input
        aria-label={label}
        placeholder={label}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </label>
  );
}
function TextCard({ t }: { t: TextRecord }) {
  return (
    <article className="text-card">
      <div className="card-meta">
        {t.culture} <span>{t.language}</span>
      </div>
      <h2>
        <a href={href('texts', t.id)}>{t.title}</a>
      </h2>
      <p>{t.comparison['primordial-state'].text}</p>
      <div className="card-bottom">
        <span>{t.motifs.length} motif entries</span>
        <a
          href={comparisonHash(
            [t.id, ...defaultSelection.filter((id) => id !== t.id)].slice(0, 3),
          )}
        >
          Compare <ArrowRight size={14} />
        </a>
      </div>
      <Cite refs={t.metadata_citations} />
    </article>
  );
}
function Compare({ params }: { params: URLSearchParams }) {
  const selected = selectionFromParams(
    params,
    corpus.texts.map((t) => t.id),
  );
  const chosen = compareTexts(corpus, selected) as TextRecord[];
  const [mode, setMode] = useState('narrative');
  function change(ids: string[]) {
    window.location.hash = comparisonHash(ids);
  }
  function exportSelected() {
    const data = {
      notice:
        'Original project summaries. No motif entry means not yet documented, not absent.',
      texts: chosen,
      occurrences: corpus.occurrences.filter((o) => selected.includes(o.text)),
      sources: corpus.sources,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comparative-origins-selection.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <Title
        title="Read the evidence together."
        description="Compare what the surviving sources say. Keep the passage, its interpretation, and what remains unknown in view."
      />
      <div className="comparison-layout">
        <section className="selection-panel" aria-label="Text selection">
          <div className="panel-heading">
            <SlidersHorizontal size={16} />
            <h2>Select texts</h2>
            <span>
              {selected.length} / {corpus.texts.length}
            </span>
          </div>
          <div className="preset">
            <Button variant="ghost" onClick={() => change(defaultSelection)}>
              Creation trio
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                change(
                  corpus.texts
                    .filter((t) => t.tradition === 'egyptian')
                    .map((t) => t.id),
                )
              }
            >
              Egyptian dossiers
            </Button>
          </div>
          <div className="checklist">
            {corpus.texts.map((t) => (
              <label
                className={selected.includes(t.id) ? 'checked' : ''}
                key={t.id}
              >
                <Checkbox
                  checked={selected.includes(t.id)}
                  onCheckedChange={(v) =>
                    change(
                      v
                        ? [...selected, t.id]
                        : selected.filter((id) => id !== t.id),
                    )
                  }
                />
                <span>
                  {t.title}
                  <small>{t.culture}</small>
                </span>
              </label>
            ))}
          </div>
          <div className="selection-actions">
            <Button
              variant="ghost"
              onClick={() => change(corpus.texts.map((t) => t.id))}
            >
              Select all
            </Button>
            <Button variant="ghost" onClick={() => change([])}>
              Clear
            </Button>
          </div>
          <p className="quiet">
            Each selection has a shareable address. Scroll the table sideways to
            compare larger groups.
          </p>
        </section>
        <section className="comparison-surface">
          <div className="toolbar">
            <span className="result-count" aria-live="polite">
              {chosen.length} texts selected
            </span>
            <Button
              variant="outline"
              onClick={exportSelected}
              disabled={!chosen.length}
            >
              <Download size={15} /> Export selection
            </Button>
          </div>
          {!chosen.length ? (
            <Empty>Select one or more texts to begin a comparison.</Empty>
          ) : (
            <Tabs value={mode} onValueChange={(v) => setMode(v as string)}>
              <TabsList aria-label="Comparison view" variant="line">
                <TabsTrigger value="narrative">
                  Accounts side by side
                </TabsTrigger>
                <TabsTrigger value="motifs">Motif matrix</TabsTrigger>
                <TabsTrigger value="dates">Dates & witnesses</TabsTrigger>
              </TabsList>
              <TabsContent value="narrative">
                <Table className="comparison">
                  <TableCaption>
                    Original summaries. Citations open the source used; they are
                    not a claim of manuscript-level collation.
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">READING THE SOURCES</TableHead>
                      {chosen.map((t) => (
                        <TableHead scope="col" key={t.id}>
                          <a href={href('texts', t.id)}>{t.title}</a>
                          <small>
                            {t.culture} · {t.language}
                          </small>
                          <Cite refs={t.metadata_citations} />
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisonFields.map(([key, title]) => (
                      <TableRow key={key}>
                        <TableHead scope="row">{title}</TableHead>
                        {chosen.map((t) => (
                          <TableCell key={t.id}>
                            <Evidence compact claim={t.comparison[key]} />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="motifs">
                <Table className="comparison motif-matrix">
                  <TableCaption>
                    No entry means not yet documented here. Interpretive and
                    reported occurrences do not become explicit attestations.
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">MOTIF</TableHead>
                      {chosen.map((t) => (
                        <TableHead scope="col" key={t.id}>
                          {t.title}
                          <Cite refs={t.metadata_citations} />
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {initialMotifs.map((id) => (
                      <TableRow key={id}>
                        <TableHead scope="row">
                          <a href={href('motifs', id)}>
                            {corpus.motifs.find((m) => m.id === id)?.name}
                          </a>
                        </TableHead>
                        {chosen.map((t) => {
                          const o = matrixCell(corpus, t.id, id);
                          return (
                            <TableCell key={t.id}>
                              {o ? (
                                <>
                                  <span className="attestation">
                                    {pretty(o.attestation)}
                                  </span>
                                  <Evidence compact claim={o.claim} />
                                </>
                              ) : (
                                <span className="unrecorded">
                                  Not yet documented
                                  <br />
                                  <small>Database coverage, not absence</small>
                                </span>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="dates">
                <Table className="comparison">
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">CHRONOLOGY</TableHead>
                      {chosen.map((t) => (
                        <TableHead scope="col" key={t.id}>
                          {t.title}
                          <Cite refs={t.metadata_citations} />
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableHead scope="row">Claimed setting</TableHead>
                      {chosen.map((t) => (
                        <TableCell key={t.id}>
                          <Evidence compact claim={t.claimed_setting} />
                        </TableCell>
                      ))}
                    </TableRow>
                    {(
                      [
                        'estimated_composition',
                        'surviving_manuscript',
                        'earliest_witness',
                      ] as const
                    ).map((key) => (
                      <TableRow key={key}>
                        <TableHead scope="row">
                          {key.replaceAll('_', ' ')}
                        </TableHead>
                        {chosen.map((t) => (
                          <TableCell key={t.id}>
                            <DateInfo date={t[key]} />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          )}
        </section>
      </div>
      <aside className="note">
        <strong>A resemblance is a question, not a conclusion.</strong> Literary
        dependence, common tradition and independent development require
        separate arguments.{' '}
        <a href={href('research', 'root-hypothesis')}>
          Examine the Root Hypothesis →
        </a>
      </aside>
    </>
  );
}
function TextDetail({ t }: { t: TextRecord }) {
  return (
    <>
      <a className="back" href={href('texts')}>
        ← All texts
      </a>
      <Title
        eyebrow={t.culture + ' / ' + t.language}
        title={t.title}
        description="Initial research dossier. Statements are classified individually; open fields remain visible."
      />
      <div className="toolbar">
        <a
          className="action-link"
          href={comparisonHash(
            [t.id, ...defaultSelection.filter((id) => id !== t.id)].slice(0, 3),
          )}
        >
          <Layers3 size={16} /> Compare this source
        </a>
        <span className="pill">{t.motifs.length} documented motif entries</span>
      </div>
      <div className="detail-layout">
        <article>
          <h2>What the source says</h2>
          {comparisonFields.map(([key, title]) => (
            <section className="dossier-section" key={key}>
              <h3>{title}</h3>
              <Evidence claim={t.comparison[key]} />
            </section>
          ))}
          {t.original_terms.length > 0 && (
            <section className="dossier-section">
              <h2>Original-language terms</h2>
              {t.original_terms.map((term) => (
                <div className="term" key={term.original}>
                  <strong
                    lang={term.language.includes('Hebrew') ? 'he' : undefined}
                    dir="auto"
                  >
                    {term.original}
                  </strong>
                  <span>
                    {term.transliteration} · {term.gloss}
                  </span>
                  <Cite refs={term.citations} />
                </div>
              ))}
            </section>
          )}
          <h2>Motifs in this dossier</h2>
          <div className="tags">
            {t.motifs.map((id) => (
              <a key={id} href={href('motifs', id)}>
                {corpus.motifs.find((m) => m.id === id)?.name}
              </a>
            ))}
          </div>
          {t.id.startsWith('genesis') && (
            <section className="dossier-section">
              <VariantView />
            </section>
          )}
          <section className="dossier-section">
            <h2>Research gaps</h2>
            <ul>
              {t.gaps.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </section>
        </article>
        <aside className="dossier-meta">
          <h2>Source chronology</h2>
          <h3>Story setting</h3>
          <Evidence compact claim={t.claimed_setting} />
          <h3>Composition</h3>
          <DateInfo date={t.estimated_composition} />
          <h3>Surviving witness</h3>
          <DateInfo date={t.surviving_manuscript} />
          <h3>Earliest physical witness</h3>
          <DateInfo date={t.earliest_witness} />
          <h3>Provenance</h3>
          <Evidence compact claim={t.provenance} />
          <h3>Witness inventory</h3>
          {t.manuscripts.length ? (
            <ul>
              {t.manuscripts.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          ) : (
            <p>TODO: individual witness inventory.</p>
          )}
          <h3>Figures</h3>
          <div className="tags">
            {t.figures.map((f) => (
              <a
                key={f}
                href={href(
                  'figures',
                  corpus.figures.find((x) => x.name === f)?.id,
                )}
              >
                {f}
              </a>
            ))}
          </div>
          <h3>Bibliography</h3>
          {t.bibliography.map((id) => (
            <p key={id}>
              <a href={href('sources', id)}>{sourceMap[id].title}</a>
              <small>{sourceMap[id].review_status}</small>
            </p>
          ))}
        </aside>
      </div>
    </>
  );
}
function VariantView() {
  const v = corpus.variants[0];
  return (
    <>
      <p className="eyebrow">TEXTUAL WITNESSES</p>
      <h2>{v.title}</h2>
      <p className="quiet">
        Reading traditions are shown at edition level. A blank Qumran reading is
        a coverage gap; it does not support either alternative.
      </p>
      <div className="witness-grid">
        {v.witnesses.map((w) => (
          <article key={w.id}>
            <span className={'badge ' + (w.status === 'todo' ? 'todo' : '')}>
              {w.status === 'todo' ? 'UNKNOWN' : 'PRIMARY READING'}
            </span>
            <h3>{w.name}</h3>
            <p
              className="original"
              lang={w.language === 'Hebrew' ? 'he' : 'grc'}
              dir="auto"
            >
              {w.original || 'Not collated'}
            </p>
            {w.transliteration && <p className="quiet">{w.transliteration}</p>}
            <strong>{w.translation}</strong>
            <p className="quiet">{w.manuscript}</p>
            <Cite refs={w.citations} />
          </article>
        ))}
      </div>
      {(
        [
          ['Meaning', v.meaning],
          ['Possible reason', v.possible_reason],
          ['Scholarly assessment', v.assessment],
          ['Traditional interpretation', v.traditional],
        ] as [string, Claim][]
      ).map(([title, c]) => (
        <section className="dossier-section" key={title}>
          <h3>{title}</h3>
          <Evidence claim={c} />
        </section>
      ))}
    </>
  );
}
function Texts({ id, query }: { id: string; query: string }) {
  if (id)
    return textMap[id] ? (
      <TextDetail t={textMap[id]} />
    ) : (
      <Empty>That text record is not in the corpus.</Empty>
    );
  const ts = corpus.texts.filter((t) =>
    normalize(JSON.stringify(t)).includes(normalize(query)),
  );
  return (
    <>
      <Title
        title="The creation corpus."
        description="Eleven separate dossiers across six cultural groupings. A dossier can contain fragmentary evidence or a group of dated passages."
      />
      <div className="cards">
        {ts.map((t) => (
          <TextCard key={t.id} t={t} />
        ))}
      </div>
      {!ts.length && (
        <Empty>Try a title, culture, figure or passage term.</Empty>
      )}
    </>
  );
}
function Timeline() {
  const [basis, setBasis] = useState('surviving_manuscript');
  const [context, setContext] = useState(false);
  const entries = timelineEntries(corpus.texts, basis, context) as {
    text: TextRecord;
    date: DateRecord;
  }[];
  const dated = entries.filter((e) => e.date.start !== null),
    unknown = entries.filter((e) => e.date.start === null);
  const excluded = corpus.texts.length - entries.length;
  const min = -2400,
    max = 1100;
  return (
    <>
      <Title
        title="Dates, with their limits."
        description="A surviving copy is not a composition date. Change the evidence layer to see each chronology separately."
      />
      <div className="toolbar timeline-controls">
        <Picker
          label="Evidence layer"
          value={basis}
          onChange={setBasis}
          items={[
            { value: 'surviving_manuscript', label: 'Surviving witnesses' },
            { value: 'estimated_composition', label: 'Composition proposals' },
            { value: 'earliest_witness', label: 'Earliest physical witnesses' },
          ]}
        />
        <label className="inline-check" htmlFor="include-corpus-context">
          <Checkbox
            id="include-corpus-context"
            checked={context}
            onCheckedChange={(v) => setContext(!!v)}
          />
          Include broad corpus context
        </label>
        <span className="quiet">
          {dated.length} dated · {unknown.length} without numerical dates
          {excluded > 0 ? ` · ${excluded} corpus ranges excluded` : ''}
        </span>
      </div>
      <section className="timeline">
        <div className="time-axis">
          <span style={{ left: '0%' }}>2400 BCE</span>
          <span style={{ left: '25.714%' }}>1500 BCE</span>
          <span style={{ left: '54.286%' }}>500 BCE</span>
          <span style={{ left: '100%' }}>1100 CE</span>
        </div>
        {dated.map((e) => (
          <article
            className={
              'time-row ' + (e.date.scope === 'corpus-context' ? 'context' : '')
            }
            key={e.text.id}
          >
            <div>
              <a href={href('texts', e.text.id)}>{e.text.title}</a>
              <small>{pretty(e.date.scope)}</small>
            </div>
            <div className="time-evidence">
              <div className="track" aria-hidden="true">
                <span
                  className={e.date.start === e.date.end ? 'point' : 'range'}
                  style={{
                    left: ((e.date.start! - min) / (max - min)) * 100 + '%',
                    width:
                      Math.max(
                        0.6,
                        ((e.date.end! - e.date.start!) / (max - min)) * 100,
                      ) + '%',
                  }}
                />
              </div>
              <DateInfo date={e.date} />
            </div>
          </article>
        ))}
      </section>
      <aside className="note">
        Ranges represent the cited uncertainty or the dated corpus context, not
        the duration of a myth. Approximate points are not exact event dates.
        BCE/CE notation has no historical year zero.
      </aside>
      <h2>Not plotted</h2>
      <div className="cards">
        {unknown.map((e) => (
          <article className="text-card" key={e.text.id}>
            <h3>
              <a href={href('texts', e.text.id)}>{e.text.title}</a>
            </h3>
            <DateInfo date={e.date} />
          </article>
        ))}
      </div>
      <p>
        <a href="data/timeline.json" download>
          Download all three chronology layers
        </a>
      </p>
      <ContactView />
    </>
  );
}
function Motifs({ id, query }: { id: string; query: string }) {
  const [basis, setBasis] = useState('surviving_manuscript');
  if (id) {
    const m = corpus.motifs.find((x) => x.id === id);
    if (!m) return <Empty>Unknown motif.</Empty>;
    const os = motifOccurrences(
      corpus,
      id,
      basis,
    ) as (Corpus['occurrences'][number] & { record: TextRecord })[];
    return (
      <>
        <a className="back" href={href('motifs')}>
          ← All motifs
        </a>
        <Title
          eyebrow={'MOTIF / ' + m.group}
          title={m.name}
          description={m.definition}
        />
        <Picker
          label="Chronological order"
          value={basis}
          onChange={setBasis}
          items={[
            {
              value: 'surviving_manuscript',
              label: 'Documented witness dates',
            },
            { value: 'estimated_composition', label: 'Composition proposals' },
          ]}
        />
        <p className="quiet">
          {os.length} entries. Undated entries and corpus-level contexts follow
          the individually dated records.
        </p>
        {os.map((o) => (
          <article className="occurrence" key={o.id}>
            <div>
              <span className="attestation">{pretty(o.attestation)}</span>
              <h2>
                <a href={href('texts', o.text)}>{o.record.title}</a>
              </h2>
              <DateInfo
                date={
                  o.record[
                    basis as 'surviving_manuscript' | 'estimated_composition'
                  ]
                }
              />
            </div>
            <Evidence claim={o.claim} />
          </article>
        ))}
        {!os.length && <Empty>{m.scope_note}</Empty>}
      </>
    );
  }
  const ms = corpus.motifs.filter((m) =>
    normalize(JSON.stringify(m)).includes(normalize(query)),
  );
  return (
    <>
      <Title
        title="Patterns worth investigating."
        description="A reusable vocabulary, grounded in individual occurrences. A motif match records resemblance; it does not establish a historical relationship."
      />
      {[
        'Cosmology',
        'Human creation',
        'Divine structure',
        'Catastrophe',
        'Symbols / objects',
      ].map((group) => (
        <section className="motif-group" key={group}>
          <h2>{group}</h2>
          <div className="motif-grid">
            {ms
              .filter((m) => m.group === group)
              .map((m) => {
                const n = corpus.occurrences.filter(
                  (o) => o.motif === m.id,
                ).length;
                return (
                  <a href={href('motifs', m.id)} key={m.id}>
                    <span>{m.name}</span>
                    <span className={n ? 'count' : 'count zero'}>
                      {n}
                      <span className="sr-only"> documented entries</span>
                    </span>
                  </a>
                );
              })}
          </div>
        </section>
      ))}
    </>
  );
}
function ObjectDetail({ o }: { o: ObjectRecord }) {
  return (
    <>
      <a className="back" href={href('objects')}>
        ← All objects
      </a>
      <Title eyebrow={'OBJECT DOSSIER / ' + o.tradition} title={o.name} />
      <div className="detail-layout">
        <article>
          <section className="term-box">
            <span className="eyebrow">ORIGINAL TERMINOLOGY</span>
            <p className="original" dir="auto">
              {o.original_word || 'TODO: ancient term unverified'}
            </p>
            <p>
              {o.transliteration} · {o.literal_meaning}
            </p>
            <small>{o.language}</small>
            <Cite refs={o.terminology_citations} />
          </section>
          {(
            [
              ['Object description', o.description],
              ['Owner / wielder', o.owner],
              ['Attributed powers', o.powers],
              ['Where the power is attributed', o.power_locus],
              ['Context', o.context],
              ['Scholarly interpretation', o.interpretation],
            ] as [string, Claim][]
          ).map(([h, c]) => (
            <section className="dossier-section" key={h}>
              <h2>{h}</h2>
              <Evidence claim={c} />
            </section>
          ))}
        </article>
        <aside className="dossier-meta">
          <h2>Date</h2>
          <DateInfo date={o.date} />
          <h3>Earliest attestation</h3>
          <DateInfo date={o.earliest_attestation} />
          <h3>Comparable objects to investigate</h3>
          {o.comparables.map((id) => (
            <p key={id}>
              <a href={href('objects', id)}>
                {corpus.objects.find((x) => x.id === id)?.name}
              </a>
            </p>
          ))}
          <span className="badge speculation">
            SPECULATION · {pretty(o.parallel_confidence)}
          </span>
          <p>{o.parallel_explanation}</p>
          <a href={href('research', 'staff-and-scepter')}>
            Read the research dossier →
          </a>
        </aside>
      </div>
    </>
  );
}
function Objects({ id, query }: { id: string; query: string }) {
  if (id) {
    const o = corpus.objects.find((x) => x.id === id);
    return o ? <ObjectDetail o={o} /> : <Empty>Unknown object.</Empty>;
  }
  const os = corpus.objects.filter((o) =>
    normalize(JSON.stringify(o)).includes(normalize(query)),
  );
  return (
    <>
      <Title
        title="Objects, words & attributed powers."
        description="Staffs, rods, scepters and wands are compared by terminology, material, wielder and context. Their English names are not evidence of identity."
      />
      <a className="action-link" href={href('research', 'staff-and-scepter')}>
        Staff & scepter research dossier <ArrowRight size={16} />
      </a>
      <div className="object-grid">
        {os.map((o) => (
          <article key={o.id}>
            <p className="eyebrow">
              {o.tradition} /{' '}
              {o.original_word
                ? 'LITERARY OCCURRENCE'
                : 'ARCHAEOLOGICAL OBJECT'}
            </p>
            <h2>
              <a href={href('objects', o.id)}>{o.name}</a>
            </h2>
            <div className="object-word" dir="auto">
              {o.original_word || '86.1.91'}
            </div>
            <p>{o.transliteration || 'Ancient name not established'}</p>
            <p>{o.description.text}</p>
            <Cite refs={o.citations} />
            <a href={href('objects', o.id)}>Inspect record →</a>
          </article>
        ))}
      </div>
      {!os.length && <Empty>Try “staff,” “Moses,” “laurel,” or “ivory.”</Empty>}
    </>
  );
}
function Sources({ id, query }: { id: string; query: string }) {
  const ss = corpus.sources.filter(
    (s) =>
      (!id || s.id === id) &&
      normalize(JSON.stringify(s)).includes(normalize(query)),
  );
  return (
    <>
      <Title
        title="Follow every claim to its source."
        description="Ancient passages, critical editions, museum catalogues and attributed scholarship. Discovery leads are explicitly marked and cannot substantiate comparison claims."
      />
      <div className="toolbar">
        <span>{ss.length} sources</span>
        <a href="downloads/bibliography.bib" download>
          <Download size={15} /> Bibliography (.bib)
        </a>
      </div>
      {ss.map((s) => (
        <article className="source-record" key={s.id} id={s.id}>
          <div className="source-id">
            {s.id}
            <span
              className={
                'badge ' + (s.review_status === 'discovery-only' ? 'todo' : '')
              }
            >
              {s.review_status === 'discovery-only'
                ? 'DISCOVERY LEAD'
                : 'SELECTED MATERIAL CHECKED'}
            </span>
          </div>
          <div>
            <p className="eyebrow">{pretty(s.kind)}</p>
            <h2>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.title} <ExternalLink size={17} />
              </a>
            </h2>
            <p>
              {s.author} · {s.edition}
            </p>
            <p>{s.notes}</p>
            <p className="quiet">
              {s.rights} Accessed {s.accessed}.
            </p>
            <a href={'#/explore?q=' + encodeURIComponent(s.id)}>
              Find records citing this source →
            </a>
          </div>
        </article>
      ))}
      {!ss.length && <Empty>No matching bibliography entry.</Empty>}
    </>
  );
}
function ContactView() {
  return (
    <section className="dossier-section">
      <p className="eyebrow">CULTURAL CONTACT REGISTER</p>
      <h2>Contact is evidence of opportunity.</h2>
      <p className="quiet">
        One dated connection is entered. The wider network remains a research
        task; these edges are not lines of religious descent.
      </p>
      {corpus.contacts.map((c) => (
        <div className="contact" key={c.id}>
          <div className="contact-nodes">
            <span>{c.from_culture}</span>
            <span aria-hidden="true">↔</span>
            <span>{c.to_culture}</span>
          </div>
          <DateInfo date={c.date} />
          <Evidence claim={c.claim} />
        </div>
      ))}
    </section>
  );
}
function ResearchPage({ q }: { q: Research }) {
  return (
    <>
      <a className="back" href={href('research')}>
        ← Research questions
      </a>
      <Title eyebrow={q.status} title={q.title} description={q.question} />
      <div className="research-layout">
        <article>
          {q.sections.map((s, i) => (
            <section className="research-section" key={s.title}>
              <span className="section-number">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <span className={'badge ' + s.category}>
                  {categoryNames[s.category]}
                </span>
                <h2>{s.title}</h2>
                <p>{s.body}</p>
                <Cite refs={s.citations} />
              </div>
            </section>
          ))}
        </article>
        <aside className="dossier-meta">
          <h2>Next evidence to collect</h2>
          <ol>
            {q.next_steps.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ol>
          <a href={href('compare')}>Open the comparison workspace →</a>
          {q.id === 'staff-and-scepter' && (
            <p>
              <a href={href('objects')}>Inspect all four object records →</a>
            </p>
          )}
        </aside>
      </div>
      {q.id === 'root-hypothesis' && (
        <>
          <RelationshipView />
          <ContactView />
        </>
      )}
    </>
  );
}
function RelationshipView() {
  return (
    <section className="dossier-section">
      <h2>Proposed relationships</h2>
      {corpus.relationships.map((r) => (
        <article className="relationship" key={r.id}>
          <span className="badge speculation">
            {pretty(r.classification)} · {pretty(r.confidence)}
          </span>
          <h3>
            {textMap[r.from_text].title} ↔ {textMap[r.to_text].title}
          </h3>
          <p>{r.explanation}</p>
          <p>
            <strong>Limits / counterevidence:</strong> {r.counterevidence}
          </p>
          <p>
            <strong>Chronology:</strong> {r.chronology}
          </p>
          <Cite refs={r.support} />
        </article>
      ))}
    </section>
  );
}
function ResearchList({ id }: { id: string }) {
  if (id) {
    const q = corpus.research.find((x) => x.id === id);
    return q ? (
      <ResearchPage q={q} />
    ) : (
      <Empty>Unknown research question.</Empty>
    );
  }
  return (
    <>
      <Title
        title="Questions before conclusions."
        description="Research dossiers keep supporting evidence, counterevidence and missing links visible."
      />
      <div className="cards">
        {corpus.research.map((q) => (
          <article
            className={
              'text-card ' + (q.id === 'root-hypothesis' ? 'root-card' : '')
            }
            key={q.id}
          >
            <span className="eyebrow">{q.status}</span>
            <h2>
              <a href={href('research', q.id)}>{q.title}</a>
            </h2>
            <p>{q.question}</p>
            <a href={href('research', q.id)}>Open dossier →</a>
          </article>
        ))}
      </div>
      <h2>Expansion queue</h2>
      <div className="expansions">
        {corpus.expansions.map((e) => (
          <details key={e.id}>
            <summary>
              {e.name}
              <span className="badge todo">TODO</span>
            </summary>
            <p>{e.requirements}</p>
          </details>
        ))}
      </div>
    </>
  );
}
function Traditions({ id }: { id: string }) {
  const ts = corpus.traditions.filter((t) => !id || id === t.id);
  return (
    <>
      <Title
        title="Traditions in their own contexts."
        description="These groupings organize research. They do not imply uniform beliefs, a single text, or a single date."
      />
      {ts.map((t) => (
        <section className="tradition-section" key={t.id}>
          <p className="eyebrow">
            {corpus.texts.filter((x) => x.tradition === t.id).length} DOSSIERS
          </p>
          <h2>{t.name}</h2>
          <p>{t.scope}</p>
          <div className="cards">
            {corpus.texts
              .filter((x) => x.tradition === t.id)
              .map((x) => (
                <TextCard t={x} key={x.id} />
              ))}
          </div>
        </section>
      ))}
    </>
  );
}
function IndexPage({
  page,
  id,
  query,
}: {
  page: string;
  id: string;
  query: string;
}) {
  const records = (
    page === 'figures' ? corpus.figures : corpus.locations
  ).filter(
    (x) => (!id || x.id === id) && normalize(x.name).includes(normalize(query)),
  );
  return (
    <>
      <Title
        title={page === 'figures' ? 'People & gods.' : 'Places & provenance.'}
        description={
          page === 'figures'
            ? 'An index of dossier figures. Similar roles or names do not establish cross-cultural identity.'
            : 'Narrative settings and source locations have different evidentiary roles. Coordinates remain unassigned where identification needs review.'
        }
      />
      <div className="index-grid">
        {records.map((r) => (
          <article key={r.id}>
            <span className="eyebrow">
              {page === 'figures'
                ? 'DOSSIER INDEX'
                : pretty(r.kind || 'location')}
            </span>
            <h2>{r.name}</h2>
            <p className="quiet">{r.note}</p>
            {r.texts.map((id) => (
              <p key={id}>
                <a href={href('texts', id)}>{textMap[id].title}</a>
              </p>
            ))}
            <Cite refs={r.citations} />
          </article>
        ))}
      </div>
      {!records.length && <Empty>No matching index entry.</Empty>}
    </>
  );
}
function Methodology() {
  return (
    <>
      <Title
        title="Keep five kinds of claim separate."
        description="Epistemic neutrality is a method: identify what is asserted, by whom, in which source, and with what uncertainty."
      />
      <div className="method-grid">
        {Object.entries(categoryNames).map(([id, title], i) => (
          <article key={id}>
            <span className="section-number">0{i + 1}</span>
            <h2>{title}</h2>
            <p>
              {
                [
                  'What surviving texts or objects say or show. A source claim is not automatically a historical event.',
                  'Editorial joins, restored readings and decisions between variants. Damaged text stays visibly damaged.',
                  'Arguments by historians and language or material specialists. Attribute the argument and avoid inventing consensus.',
                  'Dated interpretations within religious traditions. They are evidence for reception, distinct from the source being interpreted.',
                  'Possibilities whose proposed mechanism or historical chain remains unproved. Record what would test them.',
                ][i]
              }
            </p>
          </article>
        ))}
      </div>
      <h2>Labels and confidence</h2>
      <div className="legend">
        {[
          'PRIMARY SOURCE',
          'SCHOLARLY CONSENSUS',
          'MAJORITY VIEW',
          'DISPUTED',
          'MINORITY VIEW',
          'SPECULATION',
          'UNKNOWN',
        ].map((label) => (
          <span
            className={
              'badge ' +
              (label === 'UNKNOWN'
                ? 'todo'
                : label === 'SPECULATION'
                  ? 'speculation'
                  : '')
            }
            key={label}
          >
            {label}
          </span>
        ))}
      </div>
      <p className="prose">
        Consensus, majority and minority labels require documented evidence
        about scholarly positions. This edition uses attributed scholarly
        interpretation instead. Confidence describes support for a particular
        claim, not the probability of a supernatural event.
      </p>
      <div className="scale">
        {[
          ['Very high', 'Direct, unambiguous evidence with corroboration.'],
          ['High', 'Clear evidence in a checked source.'],
          ['Moderate', 'A supported but contestable interpretation or dating.'],
          ['Low', 'Limited, indirect or ambiguous support.'],
          ['Speculative', 'A possibility without a demonstrated chain.'],
          ['Unknown', 'Unreviewed or insufficient evidence; no score.'],
        ].map(([a, b]) => (
          <div key={a}>
            <strong>{a}</strong>
            <span>{b}</span>
          </div>
        ))}
      </div>
      <h2>Dates, absences and copyright</h2>
      <p className="prose">
        Story setting, composition, surviving manuscript and earliest witness
        remain separate. A corpus-level range is excluded from
        individual-witness chronology by default. “Not yet documented” never
        means that a motif is absent from an ancient culture. Summaries are
        original project prose; modern translations are linked, not reproduced
        wholesale.
      </p>
      <h2>Relationship categories</h2>
      <p className="prose">
        Direct dependence · shared tradition · cultural transmission ·
        typological parallel · weak parallel · no known connection · disputed ·
        unknown. Every entered relationship requires an explanation, sources,
        confidence, chronology and counterevidence.
      </p>
      <aside className="note">
        This is an initial research edition, not a completed critical edition or
        a claim of expert peer review. Validation checks structure and
        references; human review must still check historical arguments and
        readings.
      </aside>
      <p>
        <a href="data/corpus.json" download>
          Download the complete structured corpus
        </a>{' '}
        ·{' '}
        <a href="downloads/comparisons.md" download>
          Download cited comparison tables
        </a>
      </p>
    </>
  );
}
function Explore({ params }: { params: URLSearchParams }) {
  const q = params.get('q') || '';
  const results = searchIndex(searchData, q) as {
    id: string;
    title: string;
    kind: string;
    href: string;
    text: string;
  }[];
  return (
    <>
      <Title
        title={
          q
            ? 'Search the evidence.'
            : 'An open question. A source-first method.'
        }
        description={
          q
            ? `Results for “${q}” across texts, terms, sources, objects and research dossiers.`
            : 'Begin with the creation corpus, then trace a motif, inspect a witness, or compare an object in its original context.'
        }
      />
      {q ? (
        <>
          <p aria-live="polite">{results.length} matching records</p>
          {results.map((r) => (
            <article className="search-result" key={r.kind + r.id}>
              <span className="eyebrow">{r.kind}</span>
              <h2>
                <a href={r.href}>{r.title}</a>
              </h2>
              <p className="quiet">
                Open the record for evidence categories and citations.
              </p>
            </article>
          ))}
          {!results.length && (
            <Empty>
              Try fewer words, a source identifier, or a term such as “clay,”
              “waters,” or “staff.”
            </Empty>
          )}
        </>
      ) : (
        <>
          <div className="explore-banner">
            <div>
              <span className="eyebrow">PHASE 1 / CREATION</span>
              <h2>
                Eleven accounts.
                <br />
                Many different beginnings.
              </h2>
              <a href={href('compare')}>
                Open side-by-side comparison <ArrowRight size={18} />
              </a>
            </div>
            <div className="stats">
              {[
                [corpus.texts.length, 'text dossiers'],
                [corpus.occurrences.length, 'motif entries'],
                [corpus.sources.length, 'sources'],
                [corpus.objects.length, 'object records'],
              ].map(([n, label]) => (
                <div key={label}>
                  <strong>{n}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="cards">
            {[
              [
                'motifs',
                'primordial-waters',
                'Primordial waters',
                'Follow each documented occurrence and its chronology.',
              ],
              [
                'objects',
                '',
                'Staff, rod & scepter',
                'Compare words, wielders and attributed powers.',
              ],
              [
                'research',
                'root-hypothesis',
                'The Root Hypothesis',
                'Examine competing models without drawing unsupported lines of descent.',
              ],
            ].map(([p, id, title, desc]) => (
              <article className="text-card" key={title}>
                <h2>
                  <a href={href(p, id)}>{title}</a>
                </h2>
                <p>{desc}</p>
                <a href={href(p, id)}>Investigate →</a>
              </article>
            ))}
          </div>
          <aside className="note">
            Accuracy before completeness. This edition exposes missing dates and
            uncollated witnesses as TODOs.{' '}
            <a href={href('methodology')}>Read the method →</a>
          </aside>
        </>
      )}
    </>
  );
}
export default function Explorer() {
  const [hash, setHash] = useState('#/compare');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  useEffect(() => {
    const update = () => {
      setHash(window.location.hash || '#/compare');
      setQuery('');
    };
    update();
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  const route = useMemo(() => parseRoute(hash), [hash]);
  useEffect(() => {
    document.title =
      (nav.find(([id]) => id === route.page)?.[1] || 'Methodology') +
      ' | Comparative Origins';
  }, [route.page]);
  const filterable =
    ['texts', 'motifs', 'objects', 'sources', 'figures', 'places'].includes(
      route.page,
    ) && !route.id;
  return (
    <>
      <a
        className="skip"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
      >
        Skip to research
      </a>
      <header className="masthead">
        <a
          className="brand"
          href={href('explore')}
          aria-label="Comparative Origins home"
        >
          C<span>O</span>
          <strong>Comparative Origins</strong>
        </a>
        <form
          className="site-search"
          onSubmit={(e) => {
            e.preventDefault();
            window.location.hash = '#/explore?q=' + encodeURIComponent(search);
          }}
        >
          <Search size={17} />
          <input
            aria-label="Search all research"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sources, motifs, figures…"
          />
          <button aria-label="Run research search" type="submit">
            <ArrowRight size={18} />
          </button>
        </form>
        <span className="edition">RESEARCH EDITION / 01</span>
      </header>
      <nav className="mainnav" aria-label="Main navigation">
        {nav.map(([id, title]) => (
          <a
            key={id}
            href={href(id)}
            aria-current={route.page === id ? 'page' : undefined}
          >
            {title}
          </a>
        ))}
      </nav>
      <div className="edition-strip">
        <span>
          <BookOpen size={13} /> Ancient creation & primordial history
        </span>
        <a href={href('methodology')}>
          Evidence ≠ interpretation <ArrowRight size={13} />
        </a>
      </div>
      <main id="main-content" tabIndex={-1}>
        {filterable && (
          <div className="collection-filter">
            <FilterInput query={query} setQuery={setQuery} />
          </div>
        )}
        {route.page === 'compare' ? (
          <Compare params={route.params} />
        ) : route.page === 'texts' ? (
          <Texts id={route.id} query={query} />
        ) : route.page === 'timeline' ? (
          <Timeline />
        ) : route.page === 'motifs' ? (
          <Motifs id={route.id} query={query} />
        ) : route.page === 'objects' ? (
          <Objects id={route.id} query={query} />
        ) : route.page === 'sources' ? (
          <Sources id={route.id} query={query} />
        ) : route.page === 'research' ? (
          <ResearchList id={route.id} />
        ) : route.page === 'traditions' ? (
          <Traditions id={route.id} />
        ) : route.page === 'figures' || route.page === 'places' ? (
          <IndexPage page={route.page} id={route.id} query={query} />
        ) : route.page === 'methodology' ? (
          <Methodology />
        ) : route.page === 'explore' ? (
          <Explore params={route.params} />
        ) : (
          <Empty>
            This address does not match a research section.{' '}
            <a href={href('compare')}>Return to Compare</a>.
          </Empty>
        )}
      </main>
      <footer>
        <div>
          <strong>Comparative Origins</strong>
          <p>Preserve the evidence. Keep the question open.</p>
        </div>
        <div>
          <a href={href('methodology')}>Methodology & source policy</a>
          <a href="data/corpus.json" download>
            Structured data
          </a>
          <a href={href('research')}>Research gaps</a>
        </div>
        <p>
          Initial research edition · 2026
          <br />
          Original summaries; external sources retain their rights.
        </p>
      </footer>
    </>
  );
}

export {
  Compare,
  TextDetail,
  Timeline,
  Motifs,
  Objects,
  Sources,
  ResearchList,
  Traditions,
  IndexPage,
  Methodology,
  Explore,
};
