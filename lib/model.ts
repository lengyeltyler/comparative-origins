export type Category =
  | 'primary-evidence'
  | 'textual-reconstruction'
  | 'historical-interpretation'
  | 'traditional-interpretation'
  | 'speculation';
export type Confidence =
  | 'very-high'
  | 'high'
  | 'moderate'
  | 'low'
  | 'speculative'
  | 'unknown';
export interface Citation {
  source: string;
  locator: string;
}
export interface Claim {
  text: string;
  category: Category;
  confidence: Confidence;
  status: 'documented' | 'todo' | 'fragmentary';
  label: string;
  citations: Citation[];
}
export interface DateRecord {
  label: string;
  start: number | null;
  end: number | null;
  status: 'documented' | 'todo';
  scope:
    | 'composition'
    | 'individual-witness'
    | 'earliest-witness'
    | 'corpus-context';
  confidence: Confidence;
  citations: Citation[];
}
export interface Term {
  original: string;
  transliteration: string;
  gloss: string;
  language: string;
  citations: Citation[];
}
export interface TextRecord {
  id: string;
  title: string;
  tradition: string;
  culture: string;
  language: string;
  record_status: string;
  metadata_citations: Citation[];
  claimed_setting: Claim;
  estimated_composition: DateRecord;
  surviving_manuscript: DateRecord;
  earliest_witness: DateRecord;
  provenance: Claim;
  primary_sources: string[];
  translations: { kind: string; note: string }[];
  manuscripts: string[];
  motifs: string[];
  figures: string[];
  objects: string[];
  places: string[];
  related_texts: string[];
  bibliography: string[];
  comparison: Record<string, Claim>;
  claims: Claim[];
  original_terms: Term[];
  gaps: string[];
}
export interface Source {
  id: string;
  title: string;
  author: string;
  url: string;
  kind: string;
  edition: string;
  accessed: string;
  review_status: string;
  rights: string;
  notes: string;
}
export interface Motif {
  id: string;
  name: string;
  group: string;
  definition: string;
  scope_note: string;
}
export interface Occurrence {
  id: string;
  text: string;
  motif: string;
  attestation: string;
  claim: Claim;
}
export interface ObjectRecord {
  id: string;
  name: string;
  tradition: string;
  family: string;
  original_word: string | null;
  transliteration: string | null;
  literal_meaning: string;
  language: string;
  terminology_citations: Citation[];
  description: Claim;
  owner: Claim;
  powers: Claim;
  power_locus: Claim;
  context: Claim;
  date: DateRecord;
  earliest_attestation: DateRecord;
  comparables: string[];
  interpretation: Claim;
  parallel_confidence: Confidence;
  parallel_explanation: string;
  citations: Citation[];
}
export interface Witness {
  id: string;
  name: string;
  language: string;
  original: string | null;
  transliteration: string | null;
  translation: string | null;
  status: string;
  manuscript: string;
  citations: Citation[];
}
export interface Variant {
  id: string;
  title: string;
  text: string;
  passage: string;
  witnesses: Witness[];
  meaning: Claim;
  possible_reason: Claim;
  assessment: Claim;
  traditional: Claim;
}
export interface Relationship {
  id: string;
  from_text: string;
  to_text: string;
  classification: string;
  confidence: Confidence;
  explanation: string;
  support: Citation[];
  counterevidence: string;
  chronology: string;
  category: Category;
}
export interface Contact {
  id: string;
  from_culture: string;
  to_culture: string;
  date: DateRecord;
  kind: string;
  claim: Claim;
}
export interface IndexRecord {
  id: string;
  name: string;
  texts: string[];
  note: string;
  kind?: string;
  citations: Citation[];
}
export interface Tradition {
  id: string;
  name: string;
  scope: string;
  status: string;
}
export interface Research {
  id: string;
  title: string;
  question: string;
  status: string;
  sections: {
    title: string;
    body: string;
    category: Category;
    citations: Citation[];
  }[];
  next_steps: string[];
}
export interface Corpus {
  version: string;
  texts: TextRecord[];
  sources: Source[];
  motifs: Motif[];
  occurrences: Occurrence[];
  objects: ObjectRecord[];
  variants: Variant[];
  relationships: Relationship[];
  contacts: Contact[];
  figures: IndexRecord[];
  locations: IndexRecord[];
  traditions: Tradition[];
  research: Research[];
  expansions: {
    id: string;
    name: string;
    status: string;
    requirements: string;
  }[];
}
