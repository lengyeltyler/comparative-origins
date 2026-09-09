# Contributing

1. Choose a bounded source, passage, object or question. Open the relevant research gaps before expanding scope.
2. Add or verify the bibliography entry, including edition, passage locator, rights note and access date. Discovery leads are not evidence.
3. Create or update the canonical JSON record. Use the schema under `schemas/`. Mark genuinely unreviewed data TODO rather than entering plausible values.
4. Separate the five evidence categories and date classes. Support every factual assertion. Avoid automatically upgrading a source’s description into a claim of historical occurrence.
5. Add motifs as separate occurrence records. Do not infer absence from an empty lookup. Distinguish interpretation from explicit wording and update the text’s motif index.
6. For objects, record ancient terminology only when verified, material/shape, owner, attributed powers, source of power, context, dates, comparables and confidence. Do not identify objects by English vocabulary alone.
7. For variants, identify each reading’s edition or manuscript and actual verse coverage. Never fill Qumran gaps from MT or LXX. Provide meaning, possible explanation, attributed assessment and confidence separately.
8. Update research JSON and regenerate its readable Markdown counterpart. Record disagreements without harmonizing them silently.
9. Run `npm test`, `npm run test:render`, `npm run lint`, and `npm run build`. `npm run check:sources` is optional and network-dependent. Inspect generated comparison data and chronology.
10. Submit a review describing the evidence added, uncertainties, rights and meaningful checks. A specialist should verify languages, joins, dates and scholarly arguments before promoting a dossier to reviewed.

Do not add a genealogy or claim direct borrowing without a dated argument, distinctive evidence and counterevidence. Do not copy whole modern translations. Do not edit generated corpus files as the source of truth.
