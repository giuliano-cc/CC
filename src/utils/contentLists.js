// Shared parsing for the Content Library's "structured list" slots
// (core competencies, achievements, skills, languages): each keeps a
// human-readable plain-text version for existing bindings (library[key])
// plus a JSON-encoded array (library[`${key}Items`]) that the dedicated
// editors in ContentLibraryPage read/write, so a checkbox or a language
// level can be edited without losing the other rows' data.

// Checklist items: { text, visible }. `visible` controls whether the item
// is included in the derived plain-text value (and therefore shown on the
// CV) without having to delete it.
export function parseChecklist(itemsJson, fallbackText) {
  try {
    const parsed = JSON.parse(itemsJson)
    if (Array.isArray(parsed) && parsed.length) return parsed
  } catch {
    // not valid JSON yet (empty, or a legacy plain-text value) — fall through
  }
  return (fallbackText || '')
    .split('\n')
    .filter(Boolean)
    .map((text) => ({ text, visible: true }))
}

export function composeChecklistText(items) {
  return items
    .filter((item) => item.visible && item.text?.trim())
    .map((item) => item.text)
    .join('\n')
}

// Language items: { name, level } where level is 0-100.
export const LANGUAGE_LEVELS = [
  { label: 'Native', level: 100 },
  { label: 'Fluent', level: 90 },
  { label: 'Advanced', level: 75 },
  { label: 'Intermediate', level: 55 },
  { label: 'Basic', level: 30 },
]

export function languageLevelLabel(level) {
  const match = LANGUAGE_LEVELS.find((l) => l.level === level)
  return match ? match.label : `${level}%`
}

export function parseLanguages(itemsJson, fallbackText) {
  try {
    const parsed = JSON.parse(itemsJson)
    if (Array.isArray(parsed) && parsed.length) return parsed
  } catch {
    // not valid JSON yet — fall through
  }
  return (fallbackText || '')
    .split('\n')
    .filter(Boolean)
    .map((name) => ({ name, level: 75 }))
}

export function composeLanguagesText(items) {
  return items
    .filter((item) => item.name?.trim())
    .map((item) => `${item.name} (${languageLevelLabel(item.level)})`)
    .join('\n')
}
