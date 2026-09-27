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

const DEFAULT_LIBRARY = {
  ...Object.fromEntries(CONTENT_SLOTS.map((slot) => [slot.key, ''])),
  ...Object.fromEntries(STRUCTURED_LIST_KEYS.map((key) => [`${key}Items`, ''])),
}

export const CONTENT_LANGUAGES = [
  { key: 'en', label: 'English' },
  { key: 'de', label: 'Deutsch' },
]

// Every slot's content is kept once per language (English/German), so the
// same profile can produce a CV in either without retyping it — a block
// bound to a slot always reads whichever language is currently active
// here. `content.en`/`content.de` each have the same shape as the old,
// single-language flat library did, so `library` (the active language's
// map, computed below) is exactly what every existing consumer
// (BlockRenderer.jsx, PropertiesPanel.jsx, pdfVectorExport.js, ...) already
// expects — none of them need to know this exists.
function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { language: 'en', content: { en: DEFAULT_LIBRARY, de: DEFAULT_LIBRARY } }
    const parsed = JSON.parse(raw)
    // Pre-dates the bilingual content model: a flat single-language map.
    // Its data becomes the English copy so nothing already written is
    // lost; German starts blank rather than duplicating it, since it was
    // never actually written in German.
    if (!parsed.content) {
      return { language: 'en', content: { en: { ...DEFAULT_LIBRARY, ...parsed }, de: DEFAULT_LIBRARY } }
    }
    return {
      language: CONTENT_LANGUAGES.some((l) => l.key === parsed.language) ? parsed.language : 'en',
      content: {
        en: { ...DEFAULT_LIBRARY, ...parsed.content.en },
        de: { ...DEFAULT_LIBRARY, ...parsed.content.de },
      },
    }
  } catch {
    return { language: 'en', content: { en: DEFAULT_LIBRARY, de: DEFAULT_LIBRARY } }
  }
}

const ContentLibraryContext = createContext(null)

export function ContentLibraryProvider({ children }) {
  const [state, setState] = useState(loadInitialState)
  const { language, content } = state
  const library = content[language]

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // localStorage unavailable, or quota exceeded (e.g. a large photo):
      // content still works for the current session, it just won't persist.
    }
  }, [state])

  function setLanguage(nextLanguage) {
    setState((prev) => ({ ...prev, language: nextLanguage }))
  }

  function updateSlot(key, value) {
    setState((prev) => ({
      ...prev,
      content: { ...prev.content, [prev.language]: { ...prev.content[prev.language], [key]: value } },
    }))
  }

  // `setLibrary`-shaped setter, kept for the effects below (which update
  // several keys through the plain "previous library" pattern the rest
  // of this file already reads naturally) — writes into the active
  // language only, same as updateSlot.
  function setLibrary(updater) {
    setState((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        [prev.language]: typeof updater === 'function' ? updater(prev.content[prev.language]) : updater,
      },
    }))
  }

  // Keeps the composed 'contact' text in sync with the four structured
  // fields, so existing contactsSlot/contentSlot bindings (which read
  // 'contact' as one newline-joined string) keep working unchanged. Only
  // kicks in once at least one structured field has something in it, so a
  // legacy freeform 'contact' value typed before this feature isn't wiped.
  const { contactAddress, contactPhone, contactEmail, contactWebsite, contact } = library
  useEffect(() => {
    const parts = [contactAddress, contactPhone, contactEmail, contactWebsite].filter((v) => v?.trim())
    if (parts.length === 0) return
    const composed = parts.join('\n')
    if (composed !== contact) {
      setLibrary((prev) => ({ ...prev, contact: composed }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactAddress, contactPhone, contactEmail, contactWebsite])

  // Backup: both languages' content as a downloadable JSON file (not
  // just whichever one is active — a backup that silently dropped the
  // other language would be a bad surprise on restore), and the reverse.
  // Independent of localStorage, so content survives a browser change, a
  // different port, or a cleared cache.
  function exportLibrary() {
    return JSON.stringify(content, null, 2)
  }

  function importLibrary(json) {
    const parsed = JSON.parse(json)
    // A pre-bilingual export (a flat single-language map, no 'en'/'de'
    // keys of its own) becomes the English copy, same as the localStorage
    // migration above.
    const isBilingual = parsed && (parsed.en || parsed.de)
    setState((prev) => ({
      ...prev,
      content: isBilingual
        ? { en: { ...DEFAULT_LIBRARY, ...parsed.en }, de: { ...DEFAULT_LIBRARY, ...parsed.de } }
        : { en: { ...DEFAULT_LIBRARY, ...parsed }, de: prev.content.de },
    }))
  }

  const value = { library, language, setLanguage, languages: CONTENT_LANGUAGES, updateSlot, exportLibrary, importLibrary }

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
