# Comparative Origins

A source-first research database and static website for comparative ancient religion, mythology, cosmology and textual history.

**Question:** If traditions preserve inherited memories, ideas, observations or older material, what can systematic comparison of the surviving evidence recover?

This project exposes evidence and research gaps. It does not assume one original religion, literal or fictional gods, the possibility or impossibility of supernatural events, or that similarity proves borrowing.

## Phase 1: what is implemented

- Eleven initial creation dossiers: Eridu Genesis, Atrahasis, Enuma Elish, Genesis 1 (through 2:3), Genesis 2–3 (from 2:4), Hesiod’s Theogony, Hermopolitan/Ogdoad, Heliopolitan/Atum, Memphite theology, Kumarbi, and the Baal Cycle.
- 67 controlled motif terms and 68 passage-specific entries. The central comparison offers six narrative questions, seventeen initial motif rows, and a separate chronology/witness view.
- Selection and record addresses are shareable hash routes. Empty selections and undated records are preserved explicitly.
- Full-text search across source identifiers, original terms, texts, figures, places, objects and research dossiers. Local collection filters and downloadable selected comparisons.
- Four object records: Moses’ staff, Aaron’s staff, Hesiod’s scepter and Met ivory wand 86.1.91. Each distinguishes original term, attributed powers, wielder, agency, context and proposed parallels.
- Genesis 2:2 witness comparison: MT, LXX and Samaritan edition-level readings; Qumran remains explicitly uncollated.
- Three separate chronology layers: composition proposals, surviving witnesses and earliest physical witnesses. Broad corpus context is opt-in and never silently substituted for an individual witness date.
- Seven research dossiers, including Staff & Scepter and the Root Hypothesis; two proposed relationships and one dated cultural-contact edge.
- 33 linked bibliography entries; JSON schemas, source-reference validation, meaningful regression tests, generated data/tables/timelines and optional HTTP source checks.

**Research status:** an initial, auditable research edition, not a complete critical edition or independently peer-reviewed dataset. Some Egyptian and Anatolian dossiers currently rely on explicitly labeled scholarly summaries. Exact witness dates, full original-language texts and some creation passages remain TODO. Read [RESEARCH_GAPS.md](RESEARCH_GAPS.md).

## Evidence and interpretation

Every comparison claim belongs to one of five categories:

1. Primary evidence — what a text or object says or shows, often accessed through an identified edition or translation.
2. Textual reconstruction — lacunae, joins and variant decisions.
3. Historical interpretation — explicitly attributed scholarly arguments.
4. Traditional / religious interpretation — dated reception and religious readings.
5. Speculation — proposed but unproved explanations.

Confidence is separate from category. A clear literary account of a transformation can be high-confidence evidence of what the text says without being evidence that the transformation physically happened.

“Not yet documented” means no entry in this database, **not** absence from the culture. “Earliest witness” is never inferred from the oldest item currently entered. This edition rejects unsupported consensus/majority/minority labels rather than inventing a scholarly vote.

## Repository architecture

```
app/                       shared TypeScript/React research interface; Sites development shell
site/                      static Vite entrypoint, generated corpus, production output
lib/                       typed records and shared comparison/search/chronology engine
data/
  traditions/              six scoped tradition records
  texts/                   one JSON dossier per text/tradition unit
  motifs/                  controlled vocabulary and occurrence records
  objects/                 terminology, context, powers and material evidence
  figures/, locations/     dossier indexes (not identity or coordinate claims)
  relationships/           proposed textual links and dated contact evidence
  variants/                witness readings and separately classified assessment
  expansions.json          deferred corpus and research hooks
research/                  seven readable research dossiers and questions.json
sources/bibliography/      authoritative linked source register
sources/primary/           primary-source acquisition and rights policy
schemas/                   shared JSON Schema definitions and typed entrypoints
scripts/                   validate-data, build-comparisons, generate-timeline, source checks
public/                    generated download corpus, timeline, bibliography and tables
reports/                   actual validation results and source-link availability
.github/workflows/         CI validation and manually triggered GitHub Pages publication
```

`data/`, `sources/bibliography/sources.json`, and `research/questions.json` are canonical. `site/generated/corpus.json`, `public/data/*` and comparison exports are generated. Edit the canonical records, then run generation. Research README files are generated from questions.json by `npm run generate`.

## Run and validate

Requires Node.js 22.13 or newer and npm. No external database, API key or account is required to build or read the exported site.

```sh
npm ci
npm run dev              # Sites/Vinext local development
npm test                 # regression tests for integrity and comparison behavior
npm run test:render      # static React render coverage for every major view
npm run lint             # project-authored code
npm run build            # schema validation, generation, types and static production build
npm run preview:static   # serve the actual static output locally
npm run check:sources    # optional network availability check; saves a report
```

The command wrappers `scripts/validate-data`, `scripts/build-comparisons`, and `scripts/generate-timeline` are also executable.

The publication artifact is **dist/**: static HTML, CSS, JavaScript and downloadable JSON/Markdown/BibTeX. The production site uses React in the browser, with hash navigation for compatibility with GitHub Pages project subpaths. JavaScript is required for interactive browsing; cited tables and full data remain available without it. The Sites development shell is not a production database or required server.

## Publish

Public source repository: [lengyeltyler/comparative-origins](https://github.com/lengyeltyler/comparative-origins).

The static research site is hosted with Sites. GitHub Pages is also supported: enable Pages with GitHub Actions and run **Publish static site to GitHub Pages** manually. The separate validation workflow runs on pushes and pull requests.

Sites hosting metadata lives in `.openai/hosting.json`; it contains an identifier and the static output path, no credentials. Hosting access is managed outside the repository.

## Source and reuse policy

Follow [SOURCE_POLICY.md](SOURCE_POLICY.md), [METHODOLOGY.md](METHODOLOGY.md), [CONFIDENCE_SCALE.md](CONFIDENCE_SCALE.md) and [CONTRIBUTING.md](CONTRIBUTING.md). Original project code and summaries are MIT licensed; third-party sources and translations retain their own rights. Linked access is not permission to copy. No continuous copyrighted modern translation is included.

See [reports/VALIDATION.md](reports/VALIDATION.md) for actual checks, limitations and remaining issues. Structural validation cannot establish the correctness of a historical conclusion.
