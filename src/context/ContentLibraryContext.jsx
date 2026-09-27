import { createContext, useContext, useEffect, useState } from 'react'

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
  { key: 'photo', label: 'Profile Photo', type: 'image' },
  { key: 'profileSummary', label: 'Professional Profile', multiline: true },
  // 'checklist' slots: each line has its own visibility checkbox, so an
  // item can be kept in the library without showing on the CV (see
  // utils/contentLists.js — library[key] stays the plain-text, checked-
  // only version every existing binding already expects).
  { key: 'coreCompetencies', label: 'Core Competencies', type: 'checklist' },
  { key: 'achievements', label: 'Achievements', type: 'checklist' },
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
  { key: 'contactAddress', label: 'Address', multiline: false, group: 'contact' },
  { key: 'contactPhone', label: 'Phone', multiline: false, group: 'contact' },
  { key: 'contactEmail', label: 'Email', multiline: false, group: 'contact' },
  { key: 'contactWebsite', label: 'Website', multiline: false, group: 'contact' },
  { key: 'socialLinks', label: 'Social Links', type: 'social' },
  { key: 'qrValue', label: 'QR Code Link', multiline: false },
  { key: 'hobbies', label: 'Leisure / Hobbies', type: 'checklist' },
  { key: 'coverLetterBody', label: 'Cover Letter Body', multiline: true },
  { key: 'signature', label: 'Signature', type: 'image' },
]

// Checklist/languages slots also keep a JSON-encoded "*Items" key (the
// full editable row list, including unchecked/hidden items) alongside
// the plain-text one already covered by CONTENT_SLOTS above.
const STRUCTURED_LIST_KEYS = CONTENT_SLOTS.filter((s) =>
  ['checklist', 'languages', 'entries'].includes(s.type),
).map((s) => s.key)

// 'image' slots (Profile Photo, Signature) are a scan/photo of the same
// person, never wording — there's nothing to translate, so they're kept
// once, shared across every language, instead of duplicated per language
// like the rest of the library. `getLibrary(lang)` below merges them into
// whichever language map is requested, so every existing consumer keeps
// reading `library.photo`/`library.signature` unchanged.
const IMAGE_SLOT_KEYS = CONTENT_SLOTS.filter((s) => s.type === 'image').map((s) => s.key)

const DEFAULT_SHARED = Object.fromEntries(IMAGE_SLOT_KEYS.map((key) => [key, '']))

const DEFAULT_LANGUAGE_LIBRARY = {
  ...Object.fromEntries(CONTENT_SLOTS.filter((slot) => slot.type !== 'image').map((slot) => [slot.key, ''])),
  ...Object.fromEntries(STRUCTURED_LIST_KEYS.map((key) => [`${key}Items`, ''])),
}

export const CONTENT_LANGUAGES = [
  { key: 'en', label: 'English' },
  { key: 'de', label: 'Deutsch' },
]

function isValidLanguage(lang) {
  return CONTENT_LANGUAGES.some((l) => l.key === lang)
}

// Picks whichever of the given per-language maps has something in each
// image slot (English first, then German) — used both to migrate a
// library saved before photo/signature were shared, and to fold a
// bilingual import's own images into the shared store.
function extractShared(...maps) {
  return Object.fromEntries(
    IMAGE_SLOT_KEYS.map((key) => [key, maps.map((m) => m?.[key]).find((v) => v?.trim()) || '']),
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
// PropertiesPanel.jsx, pdfVectorExport.js, ...) already expects — none of
// them need to know this exists.
function blankState() {
  return { shared: DEFAULT_SHARED, content: { en: DEFAULT_LANGUAGE_LIBRARY, de: DEFAULT_LANGUAGE_LIBRARY } }
}

// Builds a full state from whatever en/de/shared maps were found (each
// optional) — shared usage between loadInitialState (localStorage) and
// importLibrary (a backup file), which hit the same three legacy shapes
// but nested differently (see the comments at each call site below).
// `sharedMap` missing (not just empty) means it pre-dates the shared
// image store entirely, so it's derived from whichever language already
// had that image.
function buildState(enMap, deMap, sharedMap) {
  return {
    shared: sharedMap ? { ...DEFAULT_SHARED, ...sharedMap } : { ...DEFAULT_SHARED, ...extractShared(enMap, deMap) },
    content: {
      en: { ...DEFAULT_LANGUAGE_LIBRARY, ...enMap },
      de: { ...DEFAULT_LANGUAGE_LIBRARY, ...deMap },
    },
  }
}

function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return blankState()
    const parsed = JSON.parse(raw)
    // Every shape this key has ever been saved in nests the two languages
    // under `content` (the current `{ shared, content: { en, de } }`, and
    // the old bilingual `{ language, content: { en, de } }` saved before
    // photo/signature had a shared store of their own) — `parsed.shared`
    // simply won't exist yet for the older one.
    if (parsed.content && (parsed.content.en || parsed.content.de)) {
      return buildState(parsed.content.en, parsed.content.de, parsed.shared)
    }
    // Pre-dates the bilingual content model entirely: a flat single-
    // language map (no `content` wrapper at all). Becomes the English
    // copy so nothing already written is lost; German starts blank rather
    // than duplicating it, since it was never actually written in German.
    return buildState(parsed, null, null)
  } catch {
    return blankState()
  }
}

const ContentLibraryContext = createContext(null)

export function ContentLibraryProvider({ children }) {
  const [state, setState] = useState(loadInitialState)
  const { shared, content } = state

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // localStorage unavailable, or quota exceeded (e.g. a large photo):
      // content still works for the current session, it just won't persist.
    }
  }, [state])

  // The merged map every existing consumer expects: a language's own
  // wording plus the shared image slots. Falls back to English for an
  // unrecognized/missing language (e.g. a template saved before this
  // field existed, or a corrupted value).
  function getLibrary(lang) {
    const safeLang = isValidLanguage(lang) ? lang : 'en'
    return { ...content[safeLang], ...shared }
  }

  // `lang` only matters for a non-image slot — an image slot always
  // writes to the shared store regardless of which language is passed,
  // so every existing imageSlot caller (which never passed one) keeps
  // working unchanged.
  function updateSlot(key, value, lang) {
    if (IMAGE_SLOT_KEYS.includes(key)) {
      setState((prev) => ({ ...prev, shared: { ...prev.shared, [key]: value } }))
      return
    }
    const safeLang = isValidLanguage(lang) ? lang : 'en'
    setState((prev) => ({
      ...prev,
      content: { ...prev.content, [safeLang]: { ...prev.content[safeLang], [key]: value } },
    }))
  }

  // Keeps each language's composed 'contact' text in sync with its own
  // four structured fields, so existing contactsSlot/contentSlot bindings
  // (which read 'contact' as one newline-joined string) keep working
  // unchanged. Only touches a language once at least one of its
  // structured fields has something in it, so a legacy freeform 'contact'
  // value typed before this feature isn't wiped. Runs on every content
  // change but bails out (same object reference, no re-render) once
  // nothing is actually out of sync, so it can't loop on itself.
  useEffect(() => {
    setState((prev) => {
      let changed = false
      const nextContent = { ...prev.content }
      CONTENT_LANGUAGES.forEach(({ key: lang }) => {
        const lib = prev.content[lang]
        const parts = [lib.contactAddress, lib.contactPhone, lib.contactEmail, lib.contactWebsite].filter((v) =>
          v?.trim(),
        )
        if (parts.length === 0) return
        const composed = parts.join('\n')
        if (composed !== lib.contact) {
          nextContent[lang] = { ...lib, contact: composed }
          changed = true
        }
      })
      return changed ? { ...prev, content: nextContent } : prev
    })
  }, [content])

  // Backup: both languages' content plus the shared images, as a
  // downloadable JSON file (not just one language — a backup that
  // silently dropped the other language, or the photo, would be a bad
  // surprise on restore), and the reverse. Independent of localStorage,
  // so content survives a browser change, a different port, or a cleared
  // cache.
  function exportLibrary() {
    return JSON.stringify({ ...content, shared }, null, 2)
  }

  function importLibrary(json) {
    const parsed = JSON.parse(json)
    // A bilingual export is flat — `{ en, de, shared }` at the top level,
    // exactly what exportLibrary above produces (no `content` wrapper,
    // unlike the localStorage shape — see loadInitialState). A pre-
    // bilingual export (a flat single-language map, no 'en'/'de' keys of
    // its own) becomes the English copy, same as the localStorage
    // migration; German (and any image already saved) is kept rather than
    // wiped, since the import has nothing to say about them.
    if (parsed && (parsed.en || parsed.de)) {
      setState(buildState(parsed.en, parsed.de, parsed.shared))
    } else {
      setState((prev) => ({
        shared: { ...prev.shared, ...extractShared(parsed) },
        content: { en: { ...DEFAULT_LANGUAGE_LIBRARY, ...parsed }, de: prev.content.de },
      }))
    }
  }

  const value = { getLibrary, languages: CONTENT_LANGUAGES, updateSlot, exportLibrary, importLibrary }

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
