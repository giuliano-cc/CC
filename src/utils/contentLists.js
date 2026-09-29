// Shared parsing for the Content Library's "structured list" slots
// (core competencies, achievements, skills, languages): each keeps a
// human-readable plain-text version for existing bindings (library[key])
// plus a JSON-encoded array (library[`${key}Items`]) that the dedicated
// editors in ContentLibraryPage read/write, so a checkbox or a language
// level can be edited without losing the other rows' data.

// Checklist items: { text, visible, level }. `visible` controls whether
// the item is included in the derived plain-text value (and therefore
// shown on the CV) without having to delete it. `level` (0-100, optional)
// only matters when this same list is plotted by a Skills Chart block —
// a legacy item with no level of its own falls back to a flat 75 there
// (see BlockRenderer.jsx's SKILLS_CHART case), same as before this field
// existed.
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

// Distinct label set from LANGUAGE_LEVELS below (a skill isn't "Native"/
// "Fluent") but the same idea: a friendly label for a handful of common
// percentages, with any other value shown as a plain "N%".
export const SKILL_LEVELS = [
  { label: 'Expert', level: 100 },
  { label: 'Advanced', level: 80 },
  { label: 'Intermediate', level: 60 },
  { label: 'Basic', level: 35 },
]

export function skillLevelLabel(level) {
  const match = SKILL_LEVELS.find((l) => l.level === level)
  return match ? match.label : `${level}%`
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

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
]

const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

// Start/end dates are picked from a native <input type="month"> (ISO
// "YYYY-MM"), so every entry across the whole catalog — Experience,
// Education, Selected Works, any future 'entries' slot — renders in the
// exact same shape, instead of whatever free text someone happened to
// type ("Jan 2022", "01/2022", "January 2022", ...). A value that isn't
// ISO (typed before this became a date picker) is shown as-is, so nothing
// already written looks broken.
// `format`: 'text' (default) spells the month out ("Jan 2024") — always
// in English, since the catalog has no per-language month-name table;
// 'numeric' avoids that language mismatch entirely ("01/2024"), for a
// document whose content language isn't English. Set per document in
// Global Style, same as Content language.
export function formatEntryDate(value, format = 'text') {
  if (!value) return ''
  const iso = /^(\d{4})-(\d{2})$/.exec(value)
  if (!iso) return value
  const [, year, month] = iso
  if (format === 'numeric') return `${month}/${year}`
  const monthIndex = Number(month) - 1
  return MONTH_ABBR[monthIndex] ? `${MONTH_ABBR[monthIndex]} ${year}` : value
}

function entryDateRange(entry) {
  const end = entry.current ? 'Present' : formatEntryDate(entry.endDate)
  const range = [formatEntryDate(entry.startDate), end].filter((v) => v?.trim()).join(' – ')
  return range
}

// Best-effort parse of a free-text date ("January 2024", "Jan 2024",
// "01/2024", "2024", ...) into a single sortable number (higher = more
// recent) — entry dates are typed freely, not picked from a real date
// input, so this can't assume a fixed format. Returns null when nothing
// resembling a date is found, so an entry with unparseable text can be
// told apart from a genuinely early one instead of sorting as if it were
// year zero.
function parseDateForSort(text) {
  if (!text?.trim()) return null
  const iso = /^(\d{4})-(\d{2})$/.exec(text)
  if (iso) return Number(iso[1]) * 12 + (Number(iso[2]) - 1)
  const monthYear = /([a-zA-Z]+)\.?\s+(\d{4})/.exec(text)
  if (monthYear) {
    const monthIndex = MONTH_NAMES.findIndex((m) => m.startsWith(monthYear[1].toLowerCase()))
    if (monthIndex !== -1) return Number(monthYear[2]) * 12 + monthIndex
  }
  const slash = /(\d{1,2})[/.](\d{4})/.exec(text)
  if (slash) return Number(slash[2]) * 12 + (Number(slash[1]) - 1)
  const yearOnly = /(\d{4})/.exec(text)
  if (yearOnly) return Number(yearOnly[1]) * 12
  return null
}

// Sorts entries most-recent-first: any "current"/ongoing entry leads
// (they're more recent than a finished one by definition), then by
// whichever of end/start date parses to the latest point in time.
// Entries whose dates don't parse at all keep their original relative
// order and sink below every entry that did parse, rather than being
// scattered in among them by accident.
export function sortEntriesByDate(items) {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      if (a.item.current !== b.item.current) return a.item.current ? -1 : 1
      const aKey = parseDateForSort(a.item.endDate) ?? parseDateForSort(a.item.startDate)
      const bKey = parseDateForSort(b.item.endDate) ?? parseDateForSort(b.item.startDate)
      if (aKey === null && bKey === null) return a.index - b.index
      if (aKey === null) return 1
      if (bKey === null) return -1
      return bKey - aKey
    })
    .map((entry) => entry.item)
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
