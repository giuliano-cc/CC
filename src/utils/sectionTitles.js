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
// Matching is normalized (case-insensitive, trailing period ignored) and
// only replaces a title that's an *exact* match for one of the known
// default English headings below — anything you typed yourself (a custom
// title, a renamed section) simply isn't in this table and passes through
// unchanged, so nothing you've already customized gets overwritten.
const TRANSLATIONS = {
  de: {
    'about me': 'Über mich',
    about: 'Über mich',
    'professional profile': 'Beruflicher Werdegang',
    profile: 'Profil',
    'work experience': 'Berufserfahrung',
    experience: 'Berufserfahrung',
    education: 'Ausbildung',
    'selected works': 'Ausgewählte Arbeiten',
    'selected clients': 'Ausgewählte Kunden',
    'select clients': 'Ausgewählte Kunden',
    'core competencies': 'Kernkompetenzen',
    capabilities: 'Fähigkeiten',
    achievements: 'Erfolge',
    keywords: 'Schlagwörter',
    'technical skills': 'Fachkenntnisse',
    skills: 'Fachkenntnisse',
    languages: 'Sprachen',
    certifications: 'Zertifikate',
    publications: 'Veröffentlichungen',
    references: 'Referenzen',
    'additional information': 'Weitere Informationen',
    'additional information (other notes worth mentioning)': 'Weitere Informationen',
    quote: 'Zitat',
    'quote author (name, position)': 'Autor des Zitats (Name, Position)',
    contact: 'Kontakt',
    'contact info': 'Kontakt',
    'social links': 'Soziale Netzwerke',
    'hobbies & interests': 'Hobbys & Interessen',
    'leisure / hobbies': 'Hobbys & Interessen',
    'cover letter body': 'Anschreiben',
  },
}

export function translateSectionTitle(title, lang) {
  const dict = TRANSLATIONS[lang]
  if (!dict || !title) return title
  const trimmed = title.trim()
  const hadTrailingDot = trimmed.endsWith('.')
  const bare = hadTrailingDot ? trimmed.slice(0, -1) : trimmed
  const translated = dict[bare.toLowerCase()]
  if (!translated) return title
  return hadTrailingDot ? `${translated}.` : translated
}
