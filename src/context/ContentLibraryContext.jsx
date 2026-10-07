import { createContext, useContext, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { idbGet, idbSet } from '../utils/idbStorage'
import { SECTION_TITLE_DEFS } from '../utils/sectionTitles'

const STORAGE_KEY = 'printflow_content_library'

// Reusable "content boxes" of a CV: filled in once in the Content Library
// and then linked to a block in any template (see the `contentSlot` /
// `nameSlot` / `imageSlot` fields in PropertiesPanel), so switching
// templates never loses what you already wrote. Most slots are plain
// text; `type` marks the ones that need a dedicated editor/renderer:
// - 'image': a data URL uploaded from the user's computer
// - 'social': a list of "platform|url" lines (see utils/socialIcons.js)
export const CONTENT_SLOTS = [
  { key: 'name', label: 'Full Name', multiline: false },
  { key: 'title', label: 'Title / Role', multiline: false },
  { key: 'usp', label: 'USP (shown in the header)', multiline: false },
  // Up to 4 alternate versions of USP/Professional Profile, so a block can
  // be bound to whichever one fits a given template/use case (a shorter
  // header USP vs. a longer one, a profile tailored to a different role),
  // without overwriting the main version.
  { key: 'usp2', label: 'USP 2', multiline: false },
  { key: 'usp3', label: 'USP 3', multiline: false },
  { key: 'usp4', label: 'USP 4', multiline: false },
  { key: 'photo', label: 'Profile Photo', type: 'image' },
  { key: 'profileSummary', label: 'Professional Profile', multiline: true },
  { key: 'profileSummary2', label: 'Professional Profile 2', multiline: true },
  { key: 'profileSummary3', label: 'Professional Profile 3', multiline: true },
  { key: 'profileSummary4', label: 'Professional Profile 4', multiline: true },
  // 'checklist' slots: each line has its own visibility checkbox, so an
  // item can be kept in the library without showing on the CV (see
  // utils/contentLists.js — library[key] stays the plain-text, checked-
  // only version every existing binding already expects).
  { key: 'coreCompetencies', label: 'Core Competencies', type: 'checklist' },
  // 'entries' rather than 'checklist': an achievement is a one-off prize/
  // award (title + description), not a skill with a proficiency level —
  // same shape as Selected Works, not Technical Skills/Core Competencies.
  { key: 'achievements', label: 'Achievements', type: 'entries' },
  { key: 'keywords', label: 'Keywords', multiline: true, isList: true },
  // 'entries' slots: a repeatable row with title/subtitle/location/dates
  // (see utils/contentLists.js parseEntries/composeEntriesText) — library[key]
  // stays the plain-text, derived version every existing binding expects.
  { key: 'experience', label: 'Work Experience', type: 'entries' },
  { key: 'selectedWorks', label: 'Selected Works', type: 'entries' },
  { key: 'selectedClients', label: 'Selected Clients', multiline: true, isList: true },
  { key: 'education', label: 'Education', type: 'entries' },
  { key: 'skills', label: 'Technical Skills', type: 'checklist' },
  { key: 'languages', label: 'Languages', type: 'languages' },
  { key: 'certifications', label: 'Certifications', type: 'checklist' },
  { key: 'publications', label: 'Publications', type: 'checklist' },
  { key: 'references', label: 'References', multiline: true },
  { key: 'additionalInfo', label: 'Additional Information (other notes worth mentioning)', multiline: true },
  { key: 'quote', label: 'Quote', multiline: false },
  { key: 'quoteAuthor', label: 'Quote Author (name, position)', multiline: false },
  // 'contact' itself holds the composed, newline-joined text (auto-derived
  // below from the four fields), so every existing contactsSlot/contentSlot
  // binding keeps working unchanged. The editor renders the four fields
  // instead of a raw textarea (see ContentLibraryPage's 'contactGroup' case).
  { key: 'contact', label: 'Contact', type: 'contactGroup' },
  // Street/ZIP/City as three separate fields (not one "Address" line) so
  // the address can be composed on its own two lines — "Street number" /
  // "ZIP City" — the same way a cover letter's recipient address already
  // reads, instead of a single comma-joined line.
  { key: 'contactStreet', label: 'Street & number', multiline: false, group: 'contact' },
  { key: 'contactZip', label: 'ZIP / Postal code', multiline: false, group: 'contact' },
  { key: 'contactCity', label: 'City', multiline: false, group: 'contact' },
  { key: 'contactPhone', label: 'Phone', multiline: false, group: 'contact' },
  { key: 'contactEmail', label: 'Email', multiline: false, group: 'contact' },
  { key: 'contactWebsite', label: 'Website', multiline: false, group: 'contact' },
  { key: 'socialLinks', label: 'Social Links', type: 'social' },
  { key: 'qrValue', label: 'QR Code Link', multiline: false },
  { key: 'hobbies', label: 'Leisure / Hobbies', type: 'checklist' },
  { key: 'coverLetterBody', label: 'Cover Letter Body', multiline: true },
  // A saved list of recipients (contact person, company, address) — see
  // utils/contentLists.js's parseRecipients/composeRecipientText — a
  // cover letter's recipient block picks one by id (PropertiesPanel.jsx's
  // "Which recipient" field) instead of the address being retyped by hand
  // every time the same template goes to a different company.
  { key: 'coverLetterRecipients', label: 'Cover Letter Recipients', type: 'recipients' },
  { key: 'signature', label: 'Signature', type: 'image' },
]

// Checklist/languages slots also keep a JSON-encoded "*Items" key (the
// full editable row list, including unchecked/hidden items) alongside
// the plain-text one already covered by CONTENT_SLOTS above.
const STRUCTURED_LIST_KEYS = CONTENT_SLOTS.filter((s) =>
  ['checklist', 'languages', 'entries', 'recipients'].includes(s.type),
).map((s) => s.key)

// 'image' slots (Profile Photo, Signature) are a scan/photo of the same
// person, never wording — there's nothing to translate, so they're kept
// once, shared across every language, instead of duplicated per language
// like the rest of the library. `getLibrary(lang)` below merges them into
// whichever language map is requested, so every existing consumer keeps
// reading `library.photo`/`library.signature` unchanged.
const IMAGE_SLOT_KEYS = CONTENT_SLOTS.filter((s) => s.type === 'image').map((s) => s.key)

// Same idea, for plain-text slots whose VALUE doesn't vary by language
// either: a person's own name, their street/ZIP/city/phone/email/website
// and the social links they list, plus 'contact' itself (the plain-text
// line composed from the structured fields below, in sync with them — see
// the effect further down). Translating "Jane Doe" or a street address
// into German makes no sense, so these are kept once instead of needing
// to be typed twice and kept in sync by hand the way a wording field does.
const TEXT_SHARED_KEYS = [
  'name',
  'contact',
  'contactStreet',
  'contactZip',
  'contactCity',
  'contactPhone',
  'contactEmail',
  'contactWebsite',
  'socialLinks',
]

// 'checklist'/'languages'/'entries' slots named here are shared the same
// way — their items are names/terms, not sentences, so they read the same
// regardless of the document's language (e.g. a Technical Skills tag like
// "React" or "AWS" isn't translated). Each one's own "*Items" JSON
// companion (see STRUCTURED_LIST_KEYS) is shared right along with it, so
// the checked/unchecked state and levels stay in sync too, not just the
// plain-text value. Cover Letter Recipients is shared for the same reason
// as the rest of TEXT_SHARED_KEYS above — a company's name and address
// don't change by document language either.
const SHARED_STRUCTURED_LIST_KEYS = ['skills', 'coverLetterRecipients']

// Exported so ContentLibraryPage.jsx can render these slots once instead
// of in an English/German pair, the same way it already does for photo/
// signature — see SlotCard's single-column branch there.
export const SHARED_SLOT_KEYS = [
  ...IMAGE_SLOT_KEYS,
  ...TEXT_SHARED_KEYS,
  ...SHARED_STRUCTURED_LIST_KEYS,
  ...SHARED_STRUCTURED_LIST_KEYS.map((key) => `${key}Items`),
]

const DEFAULT_SHARED = Object.fromEntries(SHARED_SLOT_KEYS.map((key) => [key, '']))

const DEFAULT_LANGUAGE_LIBRARY = {
  ...Object.fromEntries(
    CONTENT_SLOTS.filter((slot) => !SHARED_SLOT_KEYS.includes(slot.key)).map((slot) => [slot.key, '']),
  ),
  ...Object.fromEntries(
    STRUCTURED_LIST_KEYS.filter((key) => !SHARED_SLOT_KEYS.includes(key)).map((key) => [`${key}Items`, '']),
  ),
}

// A custom per-language override for a section heading (see
// utils/sectionTitles.js) — empty means "use the built-in default for
// that language", exactly like every other slot above.
const DEFAULT_TITLES_LANGUAGE = Object.fromEntries(SECTION_TITLE_DEFS.map((def) => [def.key, '']))

export const CONTENT_LANGUAGES = [
  { key: 'en', label: 'English' },
  { key: 'de', label: 'Deutsch' },
]

function isValidLanguage(lang) {
  return CONTENT_LANGUAGES.some((l) => l.key === lang)
}

// Picks whichever of the given per-language maps has something in each
// shared slot (English first, then German) — used both to migrate a
// library saved before a given slot (image or text) became shared, and to
// fold a bilingual import's own values into the shared store. Harmless to
// run even once a slot has long been shared: nothing writes that key into
// a per-language map any more (see updateSlot/DEFAULT_LANGUAGE_LIBRARY),
// so it simply returns '' for it from then on.
function extractShared(...maps) {
  return Object.fromEntries(
    SHARED_SLOT_KEYS.map((key) => [key, maps.map((m) => m?.[key]).find((v) => v?.trim()) || '']),
  )
}

// Every slot's *wording* is kept once per language (English/German), so
// the same profile can produce a CV in either without retyping it — a
// document picks which language it reads via its own globalStyle.
// contentLanguage (see BuilderContext.jsx/PropertiesPanel.jsx's "Content
// language" field), not a single global switch, so different documents
// can sit in different languages at once. `content.en`/`content.de` each
// have the same shape as the old, single-language flat library did, and
// `getLibrary(lang)` (the per-language map merged with the shared image
// slots) is exactly what every existing consumer (BlockRenderer.jsx,
// PropertiesPanel.jsx, ...) already expects — none of them need to know
// this exists.
function blankState() {
  return {
    shared: DEFAULT_SHARED,
    content: { en: DEFAULT_LANGUAGE_LIBRARY, de: DEFAULT_LANGUAGE_LIBRARY },
    titles: { en: DEFAULT_TITLES_LANGUAGE, de: DEFAULT_TITLES_LANGUAGE },
  }
}

// Builds a full state from whatever en/de/shared/titles maps were found
// (each optional) — shared usage between loadInitialState (localStorage)
// and importLibrary (a backup file), which hit the same legacy shapes but
// nested differently (see the comments at each call site below).
// `sharedMap` missing entirely (never been saved) means every shared slot
// is derived from whichever language already had it. A `sharedMap` that
// exists but pre-dates a *newer* shared slot (e.g. a library saved back
// when only photo/signature were shared, before name/contact/social links
// joined them) still needs that newer slot's value migrated the same way —
// so `extractShared` always runs first and `sharedMap`'s own values (for
// whichever keys it already has) are layered on top, winning where both
// exist. `titlesMap` missing means it pre-dates section title overrides
// entirely, so every heading just starts at its built-in default (see
// utils/sectionTitles.js) until customized.
function buildState(enMap, deMap, sharedMap, titlesMap) {
  return {
    shared: { ...DEFAULT_SHARED, ...extractShared(enMap, deMap), ...sharedMap },
    content: {
      en: { ...DEFAULT_LANGUAGE_LIBRARY, ...enMap },
      de: { ...DEFAULT_LANGUAGE_LIBRARY, ...deMap },
    },
    titles: {
      en: { ...DEFAULT_TITLES_LANGUAGE, ...titlesMap?.en },
      de: { ...DEFAULT_TITLES_LANGUAGE, ...titlesMap?.de },
    },
  }
}

// Every shape this key has ever been saved in nests the two languages
// under `content` (the current `{ shared, content: { en, de }, titles }`,
// and the old bilingual `{ language, content: { en, de } }` saved before
// photo/signature had a shared store of their own) — `parsed.shared`/
// `parsed.titles` simply won't exist yet for an older one.
function stateFromRaw(parsed) {
  if (!parsed) return blankState()
  if (parsed.content && (parsed.content.en || parsed.content.de)) {
    return buildState(parsed.content.en, parsed.content.de, parsed.shared, parsed.titles)
  }
  // Pre-dates the bilingual content model entirely: a flat single-
  // language map (no `content` wrapper at all). Becomes the English
  // copy so nothing already written is lost; German starts blank rather
  // than duplicating it, since it was never actually written in German.
  return buildState(parsed, null, null, null)
}

const ContentLibraryContext = createContext(null)

export function ContentLibraryProvider({ children }) {
  const [state, setState] = useState(blankState)
  // Only true once the async load below has actually run — guards the
  // persist effect so it can't fire with the blank placeholder state and
  // overwrite whatever's already saved before that load gets a chance to
  // apply it.
  const [isLoaded, setIsLoaded] = useState(false)
  const { shared, content, titles } = state
  // Was the last save attempt successful? Starts true so a save that
  // fails on the very first render still shows the error toast, and only
  // fires it once per continuous failure streak — not on every keystroke.
  const lastSaveOk = useRef(true)

  // One-time load, from IndexedDB (see utils/idbStorage.js — its quota is
  // a share of free disk space, versus localStorage's flat ~5-10MB), with
  // a fallback to any pre-existing localStorage data left over from
  // before this moved off it, so upgrading never wipes an existing
  // library.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const stored = await idbGet(STORAGE_KEY)
      if (stored) {
        if (!cancelled) setState(stateFromRaw(stored))
      } else {
        try {
          const raw = localStorage.getItem(STORAGE_KEY)
          if (raw && !cancelled) setState(stateFromRaw(JSON.parse(raw)))
        } catch {
          // Corrupted or unavailable: stays at the blank default.
        }
      }
      if (!cancelled) setIsLoaded(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    ;(async () => {
      const ok = await idbSet(STORAGE_KEY, state)
      if (ok) {
        if (!lastSaveOk.current) {
          toast.success('Content Library is saving again.')
          lastSaveOk.current = true
        }
      } else if (lastSaveOk.current) {
        // Both IndexedDB and its localStorage fallback failed — rare
        // (IndexedDB's quota is far larger than localStorage's ever was),
        // but still surfaced rather than silently dropping the save the
        // way it used to.
        toast.error("Content Library isn't saving — your browser's storage is unavailable or full.", {
          duration: 8000,
        })
        lastSaveOk.current = false
      }
    })()
  }, [state, isLoaded])

  // The merged map every existing consumer expects: a language's own
  // wording plus the shared image slots. Falls back to English for an
  // unrecognized/missing language (e.g. a template saved before this
  // field existed, or a corrupted value).
  function getLibrary(lang) {
    const safeLang = isValidLanguage(lang) ? lang : 'en'
    return { ...content[safeLang], ...shared }
  }

  // `lang` only matters for a non-shared slot — a shared slot always
  // writes to the shared store regardless of which language is passed,
  // so every existing caller for one of these keys (which never passed a
  // language, same as an imageSlot caller before) keeps working unchanged.
  function updateSlot(key, value, lang) {
    if (SHARED_SLOT_KEYS.includes(key)) {
      setState((prev) => ({ ...prev, shared: { ...prev.shared, [key]: value } }))
      return
    }
    const safeLang = isValidLanguage(lang) ? lang : 'en'
    setState((prev) => ({
      ...prev,
      content: { ...prev.content, [safeLang]: { ...prev.content[safeLang], [key]: value } },
    }))
  }

  // A section heading's per-language override (see utils/sectionTitles.js'
  // translateSectionTitle) — falls back to the built-in default for an
  // unrecognized/missing language, same as getLibrary above.
  function getTitleOverrides(lang) {
    const safeLang = isValidLanguage(lang) ? lang : 'en'
    return titles[safeLang]
  }

  function updateTitle(key, value, lang) {
    const safeLang = isValidLanguage(lang) ? lang : 'en'
    setState((prev) => ({
      ...prev,
      titles: { ...prev.titles, [safeLang]: { ...prev.titles[safeLang], [key]: value } },
    }))
  }

  // Overwrites every wording field (and section title override) of
  // `toLang` with `fromLang`'s own — a starting point for translating
  // (copy English into German, then edit the copy in place) instead of
  // retyping everything from a blank language. Shared slots (photo/
  // signature, name, contact details, social links) aren't touched —
  // there's only one copy of those to begin with.
  function copyLanguageContent(fromLang, toLang) {
    if (!isValidLanguage(fromLang) || !isValidLanguage(toLang) || fromLang === toLang) return
    setState((prev) => ({
      ...prev,
      content: { ...prev.content, [toLang]: { ...prev.content[fromLang] } },
      titles: { ...prev.titles, [toLang]: { ...prev.titles[fromLang] } },
    }))
  }

  // Keeps the shared, composed 'contact' text in sync with its own
  // structured fields (street/ZIP/city/phone/email/website — all shared
  // across languages, like the rest of this effect's inputs, since none of
  // them are wording), so existing contactsSlot/contentSlot bindings
  // (which read 'contact' as one newline-joined string) keep working
  // unchanged. The street and ZIP/City lines compose as two separate
  // lines (not comma-joined), so anything reading 'contact' line-by-line
  // (CV Header's contact row, "Fill with my content") shows the address
  // the same two-line way a cover letter's recipient address already does.
  // Only touches 'contact' once at least one structured field has
  // something in it, so a legacy freeform 'contact' value typed before
  // this feature isn't wiped. Runs on every shared-state change but bails
  // out (same object reference, no re-render) once nothing is actually out
  // of sync, so it can't loop on itself.
  useEffect(() => {
    setState((prev) => {
      const zipCity = [prev.shared.contactZip, prev.shared.contactCity].filter((v) => v?.trim()).join(' ')
      const parts = [
        prev.shared.contactStreet,
        zipCity,
        prev.shared.contactPhone,
        prev.shared.contactEmail,
        prev.shared.contactWebsite,
      ].filter((v) => v?.trim())
      if (parts.length === 0) return prev
      const composed = parts.join('\n')
      if (composed === prev.shared.contact) return prev
      return { ...prev, shared: { ...prev.shared, contact: composed } }
    })
  }, [shared])

  // Backup: both languages' content plus the shared images and section
  // title overrides, as a downloadable JSON file (not just one language —
  // a backup that silently dropped the other language, or the photo,
  // would be a bad surprise on restore), and the reverse. Independent of
  // localStorage, so content survives a browser change, a different port,
  // or a cleared cache.
  function exportLibrary() {
    return JSON.stringify({ ...content, shared, titles }, null, 2)
  }

  function importLibrary(json) {
    const parsed = JSON.parse(json)
    // A bilingual export is flat — `{ en, de, shared, titles }` at the top
    // level, exactly what exportLibrary above produces (no `content`
    // wrapper, unlike the localStorage shape — see loadInitialState). A
    // pre-bilingual export (a flat single-language map, no 'en'/'de' keys
    // of its own) becomes the English copy, same as the localStorage
    // migration; German (and any image/title override already saved) is
    // kept rather than wiped, since the import has nothing to say about
    // them.
    if (parsed && (parsed.en || parsed.de)) {
      setState(buildState(parsed.en, parsed.de, parsed.shared, parsed.titles))
    } else {
      setState((prev) => ({
        ...prev,
        shared: { ...prev.shared, ...extractShared(parsed) },
        content: { en: { ...DEFAULT_LANGUAGE_LIBRARY, ...parsed }, de: prev.content.de },
      }))
    }
  }

  const value = {
    getLibrary,
    getTitleOverrides,
    updateTitle,
    languages: CONTENT_LANGUAGES,
    updateSlot,
    copyLanguageContent,
    exportLibrary,
    importLibrary,
  }

  return (
    <ContentLibraryContext.Provider value={value}>
      {children}
    </ContentLibraryContext.Provider>
  )
}

export function useContentLibrary() {
  const context = useContext(ContentLibraryContext)
  if (!context) {
    throw new Error('useContentLibrary must be used within a ContentLibraryProvider')
  }
  return context
}
