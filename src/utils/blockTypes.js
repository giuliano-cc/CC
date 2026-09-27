import {
  BarChart3,
  Briefcase,
  Columns3,
  Contact,
  GraduationCap,
  Heading1,
  IdCard,
  Image as ImageIcon,
  Languages as LanguagesIcon,
  ListChecks,
  Minus,
  QrCode,
  Quote as QuoteIcon,
  RectangleHorizontal,
  Share2,
  Sparkles,
  Text as TextIcon,
  PanelBottom,
} from 'lucide-react'
import { CONTENT_SLOTS } from '../context/ContentLibraryContext'

export const BLOCK_TYPES = {
  HEADER: 'header',
  HEADING: 'heading',
  TEXT: 'text',
  IMAGE: 'image',
  DIVIDER: 'divider',
  QUOTE: 'quote',
  FOOTER: 'footer',
  CV_HEADER: 'cv_header',
  COLUMNS: 'columns',
  SKILLS_CHART: 'skills_chart',
  QR_CODE: 'qr_code',
  SOCIAL_ICONS: 'social_icons',
  CONTACT_INFO: 'contact_info',
  LEISURE: 'leisure',
  LANGUAGES_CHART: 'languages_chart',
  EXPERIENCE: 'experience_entries',
  EDUCATION: 'education_entries',
}

// Fonts available in the font-family selectors (toolbar and properties panel).
// Pixel sizes behind each heading "size" preset (sm/md/lg/xl — see
// HEADING_SIZE_CLASSES in BlockRenderer.jsx for the matching Tailwind
// classes). Exported so anything that needs the same scale outside a
// Tailwind class context (auto-generated titles, the typography
// reference below) uses the identical values instead of guessing.
export const HEADING_SIZE_PX = { sm: 16, md: 24, lg: 30, xl: 48 }

// See textStyleClasses/textTransformStyle/displayText in BlockRenderer.jsx
// for how each of these is actually applied — 'uppercase' and 'startCase'
// are plain CSS text-transform, 'smallCaps' is a font-variant, and
// 'titleCase' transforms the displayed string itself (skipping minor
// words like "of"/"the"), since CSS has no way to express that.
export const TEXT_TRANSFORM_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'uppercase', label: 'All Caps' },
  { value: 'smallCaps', label: 'Small Caps' },
  { value: 'titleCase', label: 'Title Case' },
  { value: 'startCase', label: 'Start Case' },
]

export const FONT_FAMILY_OPTIONS = [
  { value: '', label: 'Inherit from global style' },
  { value: 'Inter, system-ui, sans-serif', label: 'Inter' },
  { value: "'Segoe UI', Arial, sans-serif", label: 'Segoe UI' },
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: "Georgia, 'Times New Roman', serif", label: 'Georgia (serif)' },
  { value: "'Times New Roman', Times, serif", label: 'Times New Roman' },
  { value: "'Courier New', monospace", label: 'Courier New' },
  { value: "'EB Garamond', Georgia, serif", label: 'EB Garamond' },
  { value: "Figtree, -apple-system, sans-serif", label: 'Figtree' },
  { value: "'IBM Plex Sans', -apple-system, sans-serif", label: 'IBM Plex Sans' },
  { value: "'IBM Plex Mono', ui-monospace, monospace", label: 'IBM Plex Mono' },
  { value: "Lora, Georgia, serif", label: 'Lora' },
  { value: "Merriweather, Georgia, serif", label: 'Merriweather' },
  { value: "'Playfair Display', Georgia, serif", label: 'Playfair Display' },
  { value: "'Source Sans 3', -apple-system, sans-serif", label: 'Source Sans 3' },
  { value: "Poppins, -apple-system, sans-serif", label: 'Poppins' },
  { value: "Roboto, -apple-system, sans-serif", label: 'Roboto' },
]

// Default size (in px, on the 794x1123 sheet) for each block type: used
// both when a block is dragged from the palette and to "seed" a free
// position for legacy blocks missing x/y/w/h (see utils/layout.js).
export const DEFAULT_BLOCK_SIZE = {
  [BLOCK_TYPES.HEADER]: { width: 698, height: 70 },
  [BLOCK_TYPES.CV_HEADER]: { width: 698, height: 90 },
  [BLOCK_TYPES.HEADING]: { width: 698, height: 70 },
  [BLOCK_TYPES.TEXT]: { width: 698, height: 90 },
  [BLOCK_TYPES.IMAGE]: { width: 300, height: 160 },
  [BLOCK_TYPES.DIVIDER]: { width: 698, height: 20 },
  [BLOCK_TYPES.QUOTE]: { width: 698, height: 70 },
  [BLOCK_TYPES.FOOTER]: { width: 698, height: 40 },
  [BLOCK_TYPES.COLUMNS]: { width: 698, height: 340 },
  [BLOCK_TYPES.SKILLS_CHART]: { width: 340, height: 180 },
  [BLOCK_TYPES.LANGUAGES_CHART]: { width: 340, height: 160 },
  [BLOCK_TYPES.QR_CODE]: { width: 140, height: 160 },
  [BLOCK_TYPES.SOCIAL_ICONS]: { width: 300, height: 50 },
  [BLOCK_TYPES.CONTACT_INFO]: { width: 300, height: 130 },
  [BLOCK_TYPES.LEISURE]: { width: 300, height: 150 },
  [BLOCK_TYPES.EXPERIENCE]: { width: 400, height: 320 },
  [BLOCK_TYPES.EDUCATION]: { width: 400, height: 220 },
}

// Interchangeable visual styles for the Skills Chart block — click the
// small cycle button on the block itself, or pick one in the properties
// panel.
export const CHART_STYLES = ['bars', 'dots', 'tags']

export const BLOCK_DEFINITIONS = [
  {
    type: BLOCK_TYPES.HEADER,
    label: 'Header',
    icon: RectangleHorizontal,
    defaultProps: {
      content: 'Your Company',
      align: 'left',
      bold: true,
      italic: false,
      underline: false,
      textTransform: null,
      contentSlot: null,
    },
  },
  {
    type: BLOCK_TYPES.CV_HEADER,
    label: 'Resume Header',
    icon: IdCard,
    defaultProps: {
      name: 'Your Name',
      role: '',
      usp: '',
      contacts: ['site.com', 'email@example.com', '000-000-0000'],
      layout: 'row',
      color: null,
      showContactIcons: true,
      nameSlot: null,
      contactsSlot: null,
      uspSlot: null,
    },
  },
  {
    type: BLOCK_TYPES.HEADING,
    label: 'Heading',
    icon: Heading1,
    defaultProps: {
      content: 'Section title',
      level: 'h1',
      align: 'left',
      bold: true,
      italic: false,
      underline: false,
      size: 'md',
      color: null,
      rule: false,
      fontFamily: null,
      fontSize: null,
      letterSpacing: null,
      lineHeight: null,
      bgColor: null,
      textTransform: null,
      contentSlot: null,
    },
  },
  {
    type: BLOCK_TYPES.TEXT,
    label: 'Text',
    icon: TextIcon,
    defaultProps: {
      content: 'Enter the paragraph text here.',
      align: 'left',
      bold: false,
      italic: false,
      underline: false,
      list: false,
      ordered: false,
      color: null,
      fontFamily: null,
      fontSize: null,
      letterSpacing: null,
      lineHeight: null,
      bgColor: null,
      textTransform: null,
      contentSlot: null,
      // When bound to a Content Library field (contentSlot), shows that
      // field's name as a title above the text — visible by default, so
      // any Content Library field can be dragged in as a titled section
      // without needing its own dedicated block type. Its own size/color
      // (separate from the body text's own color/fontSize above), so it
      // can be matched to a sibling heading's size without resizing the
      // paragraph itself.
      showTitle: true,
      titleSize: 'md',
      titleColor: null,
      // A separate override from the body's own `fontSize` above, so
      // resizing the title (e.g. from the Global Style panel's typography
      // list) never also resizes the paragraph.
      titleFontSize: null,
    },
  },
  {
    type: BLOCK_TYPES.IMAGE,
    label: 'Image',
    icon: ImageIcon,
    defaultProps: {
      src: '',
      alt: 'Image',
      align: 'center',
      shape: 'rect',
      imageSlot: null,
    },
  },
  {
    type: BLOCK_TYPES.DIVIDER,
    label: 'Divider',
    icon: Minus,
    defaultProps: {
      orientation: 'horizontal',
      lineStyle: 'solid',
      thickness: 1,
      color: null,
    },
  },
  {
    type: BLOCK_TYPES.QUOTE,
    label: 'Quote',
    icon: QuoteIcon,
    defaultProps: {
      content: 'A meaningful quote.',
      align: 'left',
      italic: true,
      bold: false,
      underline: false,
      color: null,
      fontFamily: null,
      fontSize: null,
      letterSpacing: null,
      lineHeight: null,
      bgColor: null,
      textTransform: null,
      contentSlot: null,
      author: '',
      authorSlot: null,
    },
  },
  {
    type: BLOCK_TYPES.FOOTER,
    label: 'Footer',
    icon: PanelBottom,
    defaultProps: {
      content: '© 2026 Your Company. All rights reserved.',
      align: 'center',
      bold: false,
      italic: false,
      underline: false,
      textTransform: null,
      contentSlot: null,
    },
  },
  {
    type: BLOCK_TYPES.COLUMNS,
    label: 'Columns',
    icon: Columns3,
    defaultProps: {
      widths: null,
      columns: [{ items: [] }, { items: [] }],
    },
  },
  {
    type: BLOCK_TYPES.SKILLS_CHART,
    label: 'Technical Skills',
    icon: BarChart3,
    defaultProps: {
      title: 'Technical Skills',
      titleSize: 'md',
      titleColor: null,
      fontFamily: null,
      fontSize: null,
      items: [
        { label: 'Skill 1', level: 90 },
        { label: 'Skill 2', level: 75 },
        { label: 'Skill 3', level: 60 },
      ],
      useLibrarySkills: false,
      librarySource: 'skills',
      color: null,
      chartStyle: 'bars',
      dotSize: 10,
    },
  },
  {
    type: BLOCK_TYPES.LANGUAGES_CHART,
    label: 'Languages',
    icon: LanguagesIcon,
    defaultProps: {
      title: 'Languages',
      titleSize: 'md',
      titleColor: null,
      fontFamily: null,
      fontSize: null,
      items: [
        { label: 'English', level: 90 },
        { label: 'Italian', level: 100 },
      ],
      useLibraryLanguages: false,
      color: null,
      chartStyle: 'bars',
      dotSize: 10,
    },
  },
  {
    type: BLOCK_TYPES.QR_CODE,
    label: 'QR Code',
    icon: QrCode,
    defaultProps: {
      value: 'https://example.com',
      useLibraryValue: false,
      caption: '',
    },
  },
  {
    type: BLOCK_TYPES.SOCIAL_ICONS,
    label: 'Social Icons',
    icon: Share2,
    defaultProps: {
      items: [
        { platform: 'linkedin', url: 'linkedin.com/in/you' },
        { platform: 'github', url: 'github.com/you' },
      ],
      useLibraryLinks: false,
      align: 'left',
      layout: 'row',
    },
  },
  {
    type: BLOCK_TYPES.CONTACT_INFO,
    label: 'Contact Info',
    icon: Contact,
    defaultProps: {
      title: 'Contact Info',
      titleSize: 'md',
      titleColor: null,
      fontFamily: null,
      fontSize: null,
      address: 'City, Country',
      phone: '+00 000 000 0000',
      email: 'you@example.com',
      website: 'yourwebsite.com',
      useLibraryContact: false,
      showIcons: true,
      align: 'left',
      layout: 'stacked',
    },
  },
  {
    type: BLOCK_TYPES.EXPERIENCE,
    label: 'Experience',
    icon: Briefcase,
    defaultProps: {
      title: 'Experience',
      titleSize: 'md',
      titleColor: null,
      fontFamily: null,
      fontSize: null,
      items: [
        {
          id: 'exp-default-1',
          title: 'Job Role',
          subtitle: 'Company Name',
          location: '',
          startDate: 'January Year',
          endDate: '',
          current: true,
          description: 'Description of the work experience, responsibilities and results achieved.',
        },
        {
          id: 'exp-default-2',
          title: 'Job Role',
          subtitle: 'Company Name',
          location: '',
          startDate: 'January Year',
          endDate: 'January Year',
          current: false,
          description: 'Description of the work experience, responsibilities and results achieved.',
        },
      ],
      useLibraryExperience: false,
      align: 'left',
    },
  },
  {
    type: BLOCK_TYPES.EDUCATION,
    label: 'Education',
    icon: GraduationCap,
    defaultProps: {
      title: 'Education',
      titleSize: 'md',
      titleColor: null,
      fontFamily: null,
      fontSize: null,
      items: [
        {
          id: 'edu-default-1',
          title: 'Degree in Subject',
          subtitle: 'Institution Name',
          location: '',
          startDate: 'Year',
          endDate: 'Year',
          current: false,
          description: '',
        },
      ],
      useLibraryEducation: false,
      align: 'left',
    },
  },
  {
    type: BLOCK_TYPES.LEISURE,
    label: 'Leisure',
    icon: Sparkles,
    defaultProps: {
      title: 'Hobbies & Interests',
      titleSize: 'md',
      titleColor: null,
      fontFamily: null,
      fontSize: null,
      items: ['Photography', 'Hiking', 'Reading'],
      useLibraryHobbies: false,
      align: 'left',
    },
  },
]

export function getBlockDefinition(type) {
  return BLOCK_DEFINITIONS.find((def) => def.type === type)
}

// Block types whose "title" (Contact Info, Leisure, Experience, Education,
// Technical Skills, Languages) is rendered as a section heading — see
// sectionTitleStyle in BlockRenderer.jsx — but isn't itself a HEADING
// block, so it needs `titleSize`/`titleColor`/`fontFamily`/`fontSize`
// fields of its own instead of the usual level/size/color/fontFamily ones.
export const SECTION_TITLE_TYPES = [
  BLOCK_TYPES.CONTACT_INFO,
  BLOCK_TYPES.LEISURE,
  BLOCK_TYPES.EXPERIENCE,
  BLOCK_TYPES.EDUCATION,
  BLOCK_TYPES.SKILLS_CHART,
  BLOCK_TYPES.LANGUAGES_CHART,
]

// Whether a block has an auto-generated section-heading title of its own
// — either a SECTION_TITLE_TYPES block with a title set, or a Text block
// bound to a Content Library field with showTitle on (see TEXT's
// defaultProps and the TEXT case in BlockRenderer.jsx). Both kinds share
// the same `titleSize`/`titleColor` fields.
function hasSectionTitle(block) {
  if (SECTION_TITLE_TYPES.includes(block.type)) return !!block.title
  if (block.type === BLOCK_TYPES.TEXT) return block.showTitle === true && !!block.contentSlot
  return false
}

// Which field holds a section-title block's own raw px size override: a
// SECTION_TITLE_TYPES block has no other use for `fontSize`, but a Text
// block's `fontSize` is already its body paragraph's size, so its title
// keeps a separate `titleFontSize` instead.
export function sectionTitleSizeField(block) {
  return block.type === BLOCK_TYPES.TEXT ? 'titleFontSize' : 'fontSize'
}

// A freshly added block — nested inside a Columns column, or dropped
// straight onto the page — gets its type's own hardcoded default title
// size ('md', the page-section size) regardless of what its new siblings
// actually look like. In a sidebar-style column, or a template whose
// page-level headings all use 'sm', the new one visibly doesn't match.
// This walks a flat list of sibling blocks (recursing into any Columns
// block among them, checking every column so an empty one still matches
// the other's convention) for the first HEADING or section-title block,
// and returns its size/level so the new item can be made to match instead
// of defaulting. `siblingBlocks` is either a page's top-level blocks (for
// a block dropped from the palette) or one Columns block's own items (for
// its "+ Add block").
//
// A level-h1 heading is skipped on the first pass (`allowH1` false): it's
// almost always a one-off page/resume title, not a repeatable section
// heading, and a page commonly has exactly one of those sitting before
// the real section headings in the blocks array — matching it first would
// make every new section title as huge as the resume's own name. Only if
// nothing else at all is found does a second pass allow it, so a mostly
// empty page still gets *something* to match against.
function inferSiblingTitleStyle(siblingBlocks, allowH1 = false) {
  for (const block of siblingBlocks || []) {
    if (block.type === BLOCK_TYPES.HEADING) {
      const level = block.level || 'h1'
      if (level !== 'h1' || allowH1) {
        return { size: block.size || 'md', level }
      }
    } else if (hasSectionTitle(block)) {
      return { size: block.titleSize || 'md', level: null }
    }
    if (block.type === BLOCK_TYPES.COLUMNS) {
      for (const column of block.columns || []) {
        const found = inferSiblingTitleStyle(column.items, allowH1)
        if (found) return found
      }
    }
  }
  return null
}

// Applies that inferred sibling style to a newly created block, before
// it's added — a HEADING gets a matching level/size, a section-title
// block (Contact Info, Leisure, Experience, Education, Technical Skills,
// Languages) gets a matching titleSize. Anything else is left untouched.
export function matchNewBlockToSiblings(newItem, siblingBlocks) {
  const style = inferSiblingTitleStyle(siblingBlocks) || inferSiblingTitleStyle(siblingBlocks, true)
  if (!style) return newItem
  if (newItem.type === BLOCK_TYPES.HEADING) {
    return { ...newItem, size: style.size, level: style.level || newItem.level }
  }
  if (SECTION_TITLE_TYPES.includes(newItem.type) || (newItem.type === BLOCK_TYPES.TEXT && newItem.showTitle)) {
    return { ...newItem, titleSize: style.size }
  }
  return newItem
}

// Block types that can be added *inside* a Columns block's column (via its
// "+ Add block" control), i.e. every ordinary block except Columns itself
// (no nesting columns-in-columns) and the page-level Header/Footer/Resume
// Header, which assume they sit directly on the sheet. This is everything
// BLOCK_DEFINITIONS lists, including the Content Library-backed blocks
// (Technical Skills, Languages, Contact Info, Leisure, Experience,
// Education, Social Icons, QR Code) — the built-in templates already nest
// these (e.g. a template's Experience/Education sidebar section), so the
// data model and renderer already support it; only the "add" UI needs to
// offer them.
const NON_NESTABLE_TYPES = [BLOCK_TYPES.COLUMNS, BLOCK_TYPES.HEADER, BLOCK_TYPES.FOOTER, BLOCK_TYPES.CV_HEADER]
export const NESTABLE_BLOCK_DEFINITIONS = BLOCK_DEFINITIONS.filter(
  (def) => !NON_NESTABLE_TYPES.includes(def.type),
)

// Content Library fields shown as their own draggable palette items — a
// Text block preconfigured with that field's contentSlot (and, for a
// checklist/list-shaped one, `list: true`) and its name shown as a title,
// so e.g. "Core Competencies" can be dragged straight onto the sheet
// instead of dragging a plain Text block and then picking it from a
// dropdown. Slots that already have a dedicated, richer block type
// (Contact Info, Leisure, Experience, Education, Technical Skills,
// Languages, and the ones needing a non-text editor: photo/social/QR/
// contact group) are left out here — that block type is the better way
// to add them, and is still offered above.
const CONTENT_LIBRARY_PALETTE_SKIP_TYPES = new Set(['image', 'social', 'contactGroup', 'languages', 'entries'])
const CONTENT_LIBRARY_PALETTE_SKIP_KEYS = new Set(['skills', 'hobbies', 'qrValue'])
export const CONTENT_LIBRARY_PALETTE_ITEMS = CONTENT_SLOTS.filter(
  (slot) =>
    !slot.group &&
    !CONTENT_LIBRARY_PALETTE_SKIP_TYPES.has(slot.type) &&
    !CONTENT_LIBRARY_PALETTE_SKIP_KEYS.has(slot.key),
).map((slot) => ({
  key: `content-${slot.key}`,
  label: slot.label,
  icon: slot.type === 'checklist' || slot.isList ? ListChecks : TextIcon,
  blockType: BLOCK_TYPES.TEXT,
  extraProps: {
    contentSlot: slot.key,
    showTitle: true,
    list: slot.type === 'checklist' || !!slot.isList,
  },
}))

export function generateId() {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// Deep-clones a block (or nested item) for copy/paste/duplicate, giving it
// (and, for a Columns block, every item nested inside its columns) a fresh
// id — pasting the same block twice must never leave two blocks sharing an
// id, which would make selecting/editing one silently affect both.
export function cloneBlockWithNewIds(block) {
  const clone = { ...structuredClone(block), id: generateId() }
  if (clone.type === BLOCK_TYPES.COLUMNS) {
    clone.columns = clone.columns.map((column) => ({
      ...column,
      items: column.items.map((item) => cloneBlockWithNewIds(item)),
    }))
  }
  return clone
}

// Creates a top-level block, free to move on the sheet: it gets a default
// position/size right away (overridden by the caller, typically at drop
// time, with the cursor position).
export function createBlockInstance(type) {
  const definition = getBlockDefinition(type)
  const size = DEFAULT_BLOCK_SIZE[type] || { width: 698, height: 80 }
  return {
    id: generateId(),
    type,
    x: 48,
    y: 48,
    width: size.width,
    height: size.height,
    zIndex: 1,
    page: 0,
    ...structuredClone(definition.defaultProps),
  }
}

// Creates a "nested" block (inside a column): these stay in vertical flow
// within their column, so they don't need their own x/y/width/height.
export function createNestedBlockInstance(type) {
  const definition = getBlockDefinition(type)
  return {
    id: generateId(),
    type,
    ...structuredClone(definition.defaultProps),
  }
}

// A reference list of the distinct text styles actually in use across a
// template — one row per (block type, heading level/size, or paragraph)
// combination actually found, with its real pixel size/weight/color/font
// — so changing "the H2 style" or "the body text style" means knowing
// exactly which blocks that touches, instead of guessing from one
// example. A SECTION_TITLE_TYPES block's title counts as a level-h2
// heading of its own titleSize, merging into the same row as any literal
// H2 heading of that size (e.g. a template's "Skills" heading and its
// "Experience"/"Education" block titles are meant to look like siblings),
// so editing one row keeps them all in sync instead of drifting apart.
export function getTemplateTypographyStyles(template) {
  const rows = new Map()

  // `matchType`/`level`/`size` identify every block this row stands for
  // (see matchesTypographyRow below), so the row can be edited in place —
  // changing its size/weight/color/font re-applies to every block sharing
  // that identity, not just the one instance that happened to be walked
  // first.
  function addRow(key, label, sizePx, bold, color, fontFamily, matchType, level, size) {
    if (rows.has(key)) return
    rows.set(key, { key, label, sizePx, bold, color: color || null, fontFamily: fontFamily || null, matchType, level, size })
  }

  function walk(blocks) {
    ;(blocks || []).forEach((block) => {
      if (block.type === BLOCK_TYPES.HEADING) {
        const level = block.level || 'h1'
        const size = block.size || 'md'
        const sizePx = block.fontSize || HEADING_SIZE_PX[size] || HEADING_SIZE_PX.md
        addRow(
          `heading-${level}-${size}`,
          `${level.toUpperCase()} (${size})`,
          sizePx,
          !!block.bold,
          block.color,
          block.fontFamily,
          BLOCK_TYPES.HEADING,
          level,
          size,
        )
      } else if (block.type === BLOCK_TYPES.TEXT) {
        addRow('text', 'Body text (P)', block.fontSize || 14, !!block.bold, block.color, block.fontFamily, BLOCK_TYPES.TEXT)
      } else if (block.type === BLOCK_TYPES.QUOTE) {
        addRow('quote', 'Quote', block.fontSize || 14, !!block.bold, block.color, block.fontFamily, BLOCK_TYPES.QUOTE)
      }
      // Independent of the branches above: a block can be BOTH a body
      // paragraph (Text) AND carry its own auto-title (a section-title
      // block, or a Text block with showTitle) — the title contributes its
      // own H2 row, using `titleFontSize`/`titleColor` (never the body's
      // own `fontSize`/`color`) so the two don't get resized/recolored
      // together by mistake.
      if (hasSectionTitle(block)) {
        const size = block.titleSize || 'md'
        const sizePx = block[sectionTitleSizeField(block)] || HEADING_SIZE_PX[size] || HEADING_SIZE_PX.md
        addRow(
          `heading-h2-${size}`,
          `H2 (${size})`,
          sizePx,
          true,
          block.titleColor,
          block.fontFamily,
          BLOCK_TYPES.HEADING,
          'h2',
          size,
        )
      }
      if (block.type === BLOCK_TYPES.COLUMNS) {
        block.columns?.forEach((column) => walk(column.items))
      }
    })
  }
  walk(template.blocks)

  return [...rows.values()].sort((a, b) => b.sizePx - a.sizePx)
}

// Whether `block` is one of the instances a typography row (from
// getTemplateTypographyStyles) stands for — used to re-apply an edit made
// on the row to every matching block across the template.
export function matchesTypographyRow(block, row) {
  if (row.matchType === BLOCK_TYPES.HEADING) {
    if (block.type === BLOCK_TYPES.HEADING) {
      return (block.level || 'h1') === row.level && (block.size || 'md') === row.size
    }
    if (row.level === 'h2' && hasSectionTitle(block)) {
      return (block.titleSize || 'md') === row.size
    }
    return false
  }
  return block.type === row.matchType
}

// The distinct fonts actually used by a template: its global font plus any
// per-block overrides (including inside COLUMNS' nested items), shown as
// short display names — e.g. so the templates gallery can tell you at a
// glance what a template will look like typographically.
export function getTemplateFontLabels(template) {
  const values = new Set()
  if (template.globalStyle?.fontFamily) values.add(template.globalStyle.fontFamily)

  function walk(blocks) {
    ;(blocks || []).forEach((block) => {
      if (block.fontFamily) values.add(block.fontFamily)
      if (block.type === BLOCK_TYPES.COLUMNS) {
        block.columns?.forEach((column) => walk(column.items))
      }
    })
  }
  walk(template.blocks)

  return [...values].map((value) => {
    const known = FONT_FAMILY_OPTIONS.find((opt) => opt.value === value)
    if (known) return known.label
    // A raw font stack (e.g. "Georgia, 'Times New Roman', serif"): show
    // just the first, most specific family name.
    return value.split(',')[0].replace(/['"]/g, '').trim()
  })
}
