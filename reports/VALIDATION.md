# Phase 1 validation results

Run date: 2026-09-09.

| Check | Result |
|---|---|
| JSON Schema and reference validation | PASS: 11 text dossiers, 33 sources, 67 motifs, 68 occurrences, 4 objects, 1 textual-variant record, 2 relationships, 1 contact edge, 55 figure-index records, 12 location-index records, 6 traditions, 7 research dossiers and 17 expansion hooks. |
| Research gaps | 62 structured TODO fields/records counted. These are permitted, visibly unresolved values; passing validation does not fill them. |
| Regression tests | PASS: 18/18; see tests.tap. |
| React rendering | PASS: 37 render cases across all major views and every text, object and research dossier; see render-checks.json. |
| TypeScript | PASS. |
| Project-authored lint | PASS. |
| Static production build | PASS; HTML/CSS/JS and evidence downloads emitted under site/dist. |
| Dependency audit | 0 reported vulnerabilities after compatible dependency updates; see dependency-audit.json. |
| Source HTTP availability | 25/33 reachable; 8 need network review. See source-links.json. |

## What the tests check

The suite rejects unknown sources, missing citations, claims based on discovery-only leads, unsupported scholarly-consensus labels, guessed Qumran readings, reversed intervals and broken object links. It checks shareable selection order, explicitly empty comparisons, search over terms/citations, the distinction between dust and clay, and the separation of composition, physical copies and corpus context.

Render checks instantiate views and inspect their generated HTML, including no-result searches, unrecorded motifs, empty/all selections and all dossiers. No interactive browser tests, screenshots, assistive-technology tests or independent expert philological review are claimed.

## Limits and nonblocking findings

- Eight source URLs returned 403, 429 or connection failures to the direct HTTP checker. The earlier research-browser checks and source snippets were separately used for the selected passages; a link check is neither a content audit nor proof that a citation is invalid. Retry affected URLs from normal institutional access before deeper collation.
- A production JavaScript bundle slightly exceeds Vite’s 500 kB uncompressed advisory threshold; the bundle is approximately 154 kB gzip. This is an advisory, not a failed build. Corpus growth will eventually warrant code/data splitting.
- The untouched Sites starter includes unused components/hooks that trigger its full vendor lint rules. Project-authored lint passes and type checking covers the full TypeScript project. The `lint:starter` diagnostic is retained; unused starter code was not altered to satisfy unrelated rules.
- The static output requires JavaScript for interactive views. No-script readers can download the cited Markdown tables and full structured corpus.
- Research claims remain initial dossiers. Structural checks do not establish textual accuracy, provenance, composition dates, transmission or supernatural historicity.
