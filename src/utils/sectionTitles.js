// Translates the section *headings* a document shows (Experience,
// Education, Professional Profile, Quote, ...) into the document's own
// Content language (globalStyle.contentLanguage — see BuilderContext.jsx
// and ContentLibraryContext's CONTENT_LANGUAGES). This is separate from
// the Content Library's per-language wording (what you actually typed):
// that's already stored once per language. Headings, though, are either a
// fixed default string baked into a block when it's created (block.title
// on Experience/Education/... blocks) or a Content Library slot's English
// `label` used as an auto-title (CONTENT_SLOTS in ContentLibraryContext) —
// neither of those retranslates itself when you switch languages, so a
// German CV kept showing "Work Experience" until now.
//
// Every entry below is also editable per language (Content Library page,
// "Section titles" — see ContentLibraryContext.jsx's `titles` store): the
// `en`/`de` fields here are only the *default* wording used until you
// customize it. `match` lists every literal English variant already
// baked into a block/template (casing, "Select Clients" vs "Selected
// Clients", ...) that should resolve to this same entry.
export const SECTION_TITLE_DEFS = [
  { key: 'profileSummary', match: ['professional profile'], en: 'Professional Profile', de: 'Beruflicher Werdegang' },
  { key: 'about', match: ['about me', 'about'], en: 'About Me', de: 'Über mich' },
  { key: 'experience', match: ['work experience', 'experience'], en: 'Experience', de: 'Berufserfahrung' },
  { key: 'education', match: ['education'], en: 'Education', de: 'Ausbildung' },
  { key: 'selectedWorks', match: ['selected works'], en: 'Selected Works', de: 'Ausgewählte Arbeiten' },
  {
    key: 'selectedClients',
    match: ['selected clients', 'select clients'],
    en: 'Selected Clients',
    de: 'Ausgewählte Kunden',
  },
  { key: 'coreCompetencies', match: ['core competencies', 'capabilities'], en: 'Core Competencies', de: 'Kernkompetenzen' },
  { key: 'achievements', match: ['achievements'], en: 'Achievements', de: 'Erfolge' },
  { key: 'keywords', match: ['keywords'], en: 'Keywords', de: 'Schlagwörter' },
  { key: 'skills', match: ['technical skills', 'skills'], en: 'Technical Skills', de: 'Fachkenntnisse' },
  { key: 'languages', match: ['languages'], en: 'Languages', de: 'Sprachen' },
  { key: 'certifications', match: ['certifications'], en: 'Certifications', de: 'Zertifikate' },
  { key: 'publications', match: ['publications'], en: 'Publications', de: 'Veröffentlichungen' },
  { key: 'references', match: ['references'], en: 'References', de: 'Referenzen' },
  {
    key: 'additionalInfo',
    match: ['additional information', 'additional information (other notes worth mentioning)'],
    en: 'Additional Information',
    de: 'Weitere Informationen',
  },
  { key: 'quote', match: ['quote'], en: 'Quote', de: 'Zitat' },
  {
    key: 'quoteAuthor',
    match: ['quote author (name, position)'],
    en: 'Quote Author (name, position)',
    de: 'Autor des Zitats (Name, Position)',
  },
  { key: 'contact', match: ['contact', 'contact info'], en: 'Contact Info', de: 'Kontakt' },
  { key: 'socialLinks', match: ['social links'], en: 'Social Links', de: 'Soziale Netzwerke' },
  { key: 'hobbies', match: ['hobbies & interests', 'leisure / hobbies'], en: 'Hobbies & Interests', de: 'Hobbys & Interessen' },
  { key: 'coverLetterBody', match: ['cover letter body'], en: 'Cover Letter Body', de: 'Anschreiben' },
  // Decorative one-off headings baked into specific built-in templates'
  // own sample content, not tied to a Content Library slot.
  { key: 'yourName', match: ['your name'], en: 'Your Name', de: 'Ihr Name' },
  { key: 'lastNameFirstName', match: ['last name first name'], en: 'LAST NAME FIRST NAME', de: 'NACHNAME VORNAME' },
  { key: 'hiImA', match: ["hi, i'm a"], en: "HI, I'M A", de: 'ICH BIN' },
]

const MATCH_INDEX = new Map()
SECTION_TITLE_DEFS.forEach((def) => {
  ;[def.en, ...def.match].forEach((variant) => MATCH_INDEX.set(variant.toLowerCase(), def))
})

function normalize(title) {
  const trimmed = title.trim()
  const hadTrailingDot = trimmed.endsWith('.')
  return { bare: (hadTrailingDot ? trimmed.slice(0, -1) : trimmed).toLowerCase(), hadTrailingDot }
}

// `overridesForLang` is that one language's slice of the Content
// Library's `titles` store (see ContentLibraryContext.jsx's
// getTitleOverrides/updateTitle), i.e. `{ [key]: text }` — an empty
// string means "not customized", so the built-in default for that
// language is used instead. A title that isn't a known default (i.e.
// anything typed by hand that never matched one) passes through
// unchanged, so custom titles are never overwritten.
export function translateSectionTitle(title, lang, overridesForLang) {
  if (!title) return title
  const { bare, hadTrailingDot } = normalize(title)
  const def = MATCH_INDEX.get(bare)
  if (!def) return title
  const custom = overridesForLang?.[def.key]
  // English keeps the original wording unless explicitly customized —
  // only a language with its own default translation (German) below
  // substitutes on its own.
  const builtIn = lang === 'de' ? def.de : null
  const resolved = custom?.trim() || builtIn
  if (!resolved) return title
  return hadTrailingDot && !resolved.endsWith('.') ? `${resolved}.` : resolved
}
