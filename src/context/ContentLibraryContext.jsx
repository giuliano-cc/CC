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
  { key: 'photo', label: 'Profile Photo', type: 'image' },
  { key: 'profileSummary', label: 'Professional Profile', multiline: true },
  { key: 'coreCompetencies', label: 'Core Competencies', multiline: true, isList: true },
  { key: 'keywords', label: 'Keywords', multiline: true, isList: true },
  { key: 'experience', label: 'Work Experience', multiline: true },
  { key: 'education', label: 'Education', multiline: true },
  { key: 'skills', label: 'Technical Skills', multiline: true, isList: true },
  { key: 'languages', label: 'Languages', multiline: true, isList: true },
  { key: 'quote', label: 'Quote', multiline: false },
  { key: 'contact', label: 'Contact', multiline: true },
  { key: 'socialLinks', label: 'Social Links', type: 'social' },
  { key: 'qrValue', label: 'QR Code Link', multiline: false },
]

const DEFAULT_LIBRARY = Object.fromEntries(CONTENT_SLOTS.map((slot) => [slot.key, '']))

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

  const value = { library, updateSlot }

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
