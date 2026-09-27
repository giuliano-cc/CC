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

function loadInitialLibrary() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_LIBRARY
    return { ...DEFAULT_LIBRARY, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_LIBRARY
  }
}

const ContentLibraryContext = createContext(null)

export function ContentLibraryProvider({ children }) {
  const [library, setLibrary] = useState(loadInitialLibrary)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(library))
    } catch {
      // localStorage unavailable, or quota exceeded (e.g. a large photo):
      // content still works for the current session, it just won't persist.
    }
  }, [library])

  function updateSlot(key, value) {
    setLibrary((prev) => ({ ...prev, [key]: value }))
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

  // Backup: the whole library as a downloadable JSON file, and the
  // reverse (replacing the library with a previously exported file).
  // Independent of localStorage, so content survives a browser change,
  // a different port, or a cleared cache.
  function exportLibrary() {
    return JSON.stringify(library, null, 2)
  }

  function importLibrary(json) {
    const parsed = JSON.parse(json)
    setLibrary({ ...DEFAULT_LIBRARY, ...parsed })
  }

  const value = { library, updateSlot, exportLibrary, importLibrary }

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
