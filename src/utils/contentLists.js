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

// Entry items (Work Experience, Education): a repeatable row with a
// title (Job Role / Degree), a subtitle (Company / Institution), an
// optional location, a date range (free text, with a "current" flag for
// "Present"/"Ongoing"), and a description shown as bullet lines.
export function emptyEntry() {
  return {
    id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: '',
    subtitle: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
  }
}

export function parseEntries(itemsJson, fallbackText) {
  try {
    const parsed = JSON.parse(itemsJson)
    if (Array.isArray(parsed) && parsed.length) return parsed
  } catch {
    // not valid JSON yet (empty, or a legacy plain-text value) — fall through
  }
  if (!fallbackText?.trim()) return []
  // A legacy plain-text value becomes a single entry's description, so
  // nothing already written is lost — it can be split into proper rows
  // from the Content Library editor afterwards.
  return [{ ...emptyEntry(), description: fallbackText }]
}

function entryDateRange(entry) {
  const end = entry.current ? 'Present' : entry.endDate
  const range = [entry.startDate, end].filter((v) => v?.trim()).join(' – ')
  return range
}

export function composeEntriesText(items) {
  return items
    .filter((item) => item.title?.trim() || item.subtitle?.trim() || item.description?.trim())
    .map((item) => {
      const subLine = [item.subtitle, item.location].filter((v) => v?.trim()).join(', ')
      const dateRange = entryDateRange(item)
      const header = [item.title, [subLine, dateRange].filter(Boolean).join(' / ')].filter((v) => v?.trim())
      return [header.join('\n'), item.description].filter((v) => v?.trim()).join('\n')
    })
    .join('\n\n')
}
