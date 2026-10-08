import {
  BarChart3,
  Briefcase,
  Calendar,
  Columns3,
  Contact,
  GraduationCap,
  Heading1,
  IdCard,
  Image as ImageIcon,
  Languages as LanguagesIcon,
  ListChecks,
  MapPinned,
  Minus,
  QrCode,
  Quote as QuoteIcon,
  RectangleHorizontal,
  Share2,
  Sparkles,
  Square,
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
  SHAPE: 'shape',
  DATE: 'date',
  MAP: 'map',
}

// Block types meant to fill their own box completely (a color fill, a
// photo, a rule) rather than hold text against a border — for these, the
// usual 8px padding every other block gets (so text never touches its own
// selection border) instead shows up as an unwanted white gap between the
// block's edges and its actual content. FreeBlock.jsx/PrintDocument.jsx
// both read this to skip that padding only for these types, in both the
// editor and the print output, so a Shape/Image/Divider can be sized to
// butt flush against a page edge or another block with no visible border
// around it.
export const EDGE_TO_EDGE_TYPES = [BLOCK_TYPES.SHAPE, BLOCK_TYPES.IMAGE, BLOCK_TYPES.DIVIDER]

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

// `category` is the font's broad shape (serif/sans-serif/monospace) — shown
// next to its name wherever it's picked, so "which one is serif vs sans vs
// mono" doesn't require recognizing every name by heart.
export const FONT_FAMILY_OPTIONS = [
  { value: '', label: 'Inherit from global style', category: null },
  { value: 'Inter, system-ui, sans-serif', label: 'Inter', category: 'sans-serif' },
  // Arimo/Tinos/Cousine/Gelasio are Google's own metric-compatible clones
  // of Arial/Times New Roman/Courier New/Georgia — leading the stack with
  // one of them (loaded as a real webfont, see index.html) makes an
  // "Arial"/"Georgia"/... pick actually render as that shape on screen
  // instead of silently falling back to whatever the browser's own system
  // default happens to be. The named system font stays right after as the
  // fallback if the webfont somehow fails to load.
  { value: "Arimo, 'Segoe UI', Arial, sans-serif", label: 'Segoe UI', category: 'sans-serif' },
  { value: 'Arimo, Arial, Helvetica, sans-serif', label: 'Arial', category: 'sans-serif' },
  { value: 'Gelasio, Georgia, serif', label: 'Georgia', category: 'serif' },
  { value: "Gelasio, Georgia, 'Times New Roman', serif", label: 'Georgia (serif)', category: 'serif' },
  { value: "Tinos, 'Times New Roman', Times, serif", label: 'Times New Roman', category: 'serif' },
  { value: "Cousine, 'Courier New', monospace", label: 'Courier New', category: 'monospace' },
  { value: "'EB Garamond', Georgia, serif", label: 'EB Garamond', category: 'serif' },
  { value: "Figtree, -apple-system, sans-serif", label: 'Figtree', category: 'sans-serif' },
  { value: "'IBM Plex Sans', -apple-system, sans-serif", label: 'IBM Plex Sans', category: 'sans-serif' },
  { value: "'IBM Plex Mono', ui-monospace, monospace", label: 'IBM Plex Mono', category: 'monospace' },
  { value: "Lora, Georgia, serif", label: 'Lora', category: 'serif' },
  { value: "Merriweather, Georgia, serif", label: 'Merriweather', category: 'serif' },
  { value: "'Playfair Display', Georgia, serif", label: 'Playfair Display', category: 'serif' },
  { value: "'Source Sans 3', -apple-system, sans-serif", label: 'Source Sans 3', category: 'sans-serif' },
  { value: "Poppins, -apple-system, sans-serif", label: 'Poppins', category: 'sans-serif' },
  { value: "Roboto, -apple-system, sans-serif", label: 'Roboto', category: 'sans-serif' },
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
  [BLOCK_TYPES.SHAPE]: { width: 220, height: 140 },
  [BLOCK_TYPES.DATE]: { width: 220, height: 50 },
  [BLOCK_TYPES.MAP]: { width: 698, height: 480 },
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
      titleRule: true,
      titleSize: 'md',
      titleColor: null,
      // A separate override from the body's own `fontSize` above, so
      // resizing the title (e.g. from the Global Style panel's typography
      // list) never also resizes the paragraph.
      titleFontSize: null,
      // Overrides the bound Content Library field's own label (e.g.
      // "Work Experience" for the `experience` slot) — null keeps
      // showing that label, same as before this existed.
      titleText: null,
      // Only takes effect when bound to an 'entries' slot (e.g. Selected
      // Works): puts each entry's title and its City/Country (or
      // Company) on the same line instead of stacked — see the matching
      // field on Experience/Education below.
      titleLocationInline: false,
      // Also 'entries'-only: shows the combined location/date line before
      // the entry's own title, instead of after — the title's own line
      // always stays bold either way, only which line comes first moves
      // (see BlockRenderer.jsx's EXPERIENCE/EDUCATION/TEXT-entries case).
      locationFirst: false,
      // Also 'entries'-only: within the combined location/date line,
      // shows the date before the location instead of after.
      dateFirst: false,
      // Also 'entries'-only: joins the location and date when they share
      // a line — a plain text field so it can be any separator.
      subtitleSeparator: ' / ',
      // Also 'entries'-only: the per-entry title's own font/size/color,
      // separate from `fontFamily`/`fontSize`/`color` above (which style
      // the body/description text) — shares the same fields, and the same
      // "Entry title" row in Global Style's typography list, as the
      // dedicated Experience/Education blocks (see getTemplateTypographyStyles),
      // so a Selected Works block styled this way looks like a sibling of
      // Experience instead of drifting to whatever the generic "Body
      // text" row says.
      entryTitleFontFamily: null,
      entryTitleFontSize: null,
      entryTitleColor: null,
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
      showQuoteMarks: false,
      quoteMarkSize: 1.6,
      showBorder: true,
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
      showTitle: true,
      titleRule: true,
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
      dotCount: 5,
    },
  },
  {
    type: BLOCK_TYPES.LANGUAGES_CHART,
    label: 'Languages',
    icon: LanguagesIcon,
    defaultProps: {
      title: 'Languages',
      showTitle: true,
      titleRule: true,
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
      dotCount: 5,
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
      captionPosition: 'bottom',
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
      showTitle: true,
      titleRule: true,
      titleSize: 'md',
      titleColor: null,
      fontFamily: null,
      fontSize: null,
      addressStreet: 'Street & number',
      addressZip: 'ZIP',
      addressCity: 'City',
      phone: '+00 000 000 0000',
      email: 'you@example.com',
      website: 'yourwebsite.com',
      useLibraryContact: false,
      showIcons: true,
      align: 'left',
      layout: 'stacked',
      bodyFontSize: null,
      lineSpacing: null,
    },
  },
  {
    type: BLOCK_TYPES.EXPERIENCE,
    label: 'Experience',
    icon: Briefcase,
    defaultProps: {
      title: 'Experience',
      showTitle: true,
      titleRule: true,
      titleSize: 'md',
      titleColor: null,
      fontFamily: null,
      fontSize: null,
      // The per-entry title ("Job Role") — separate from the block's own
      // section title above, and from `bodyFontSize` below (the
      // subtitle/date line and description), so each of the three can be
      // sized/colored independently.
      entryTitleFontSize: null,
      entryTitleColor: null,
      entryTitleFontFamily: null,
      sortByDate: true,
      // Puts each entry's title and its Company/Location on the same
      // line instead of stacked — the date range still gets its own line
      // either way.
      titleLocationInline: false,
      // Shows the combined Company/Location + date line before the job
      // title line instead of after — the title's own line always stays
      // bold either way, only which line comes first moves.
      locationFirst: false,
      // Within that combined line, shows the date before the Company/
      // Location instead of after.
      dateFirst: false,
      // Joins the Company/Location line with the date range when they
      // share a line (i.e. titleLocationInline is off) — a plain text
      // field so it can be any separator, not just " / ".
      subtitleSeparator: ' / ',
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
      bodyFontSize: null,
      lineSpacing: null,
    },
  },
  {
    type: BLOCK_TYPES.EDUCATION,
    label: 'Education',
    icon: GraduationCap,
    defaultProps: {
      title: 'Education',
      showTitle: true,
      titleRule: true,
      titleSize: 'md',
      titleColor: null,
      fontFamily: null,
      fontSize: null,
      entryTitleFontSize: null,
      entryTitleColor: null,
      entryTitleFontFamily: null,
      sortByDate: true,
      titleLocationInline: false,
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
      bodyFontSize: null,
      lineSpacing: null,
    },
  },
  {
    type: BLOCK_TYPES.LEISURE,
    label: 'Leisure',
    icon: Sparkles,
    defaultProps: {
      title: 'Hobbies & Interests',
      showTitle: true,
      titleRule: true,
      titleSize: 'md',
      titleColor: null,
      fontFamily: null,
      fontSize: null,
      items: ['Photography', 'Hiking', 'Reading'],
      list: true,
      useLibraryHobbies: false,
      align: 'left',
    },
  },
  {
    type: BLOCK_TYPES.SHAPE,
    label: 'Shape',
    icon: Square,
    defaultProps: {
      shape: 'rectangle',
      color: '#e2e8f0',
      borderColor: null,
      borderWidth: 0,
      borderRadius: 0,
      opacity: 1,
    },
  },
  {
    type: BLOCK_TYPES.DATE,
    label: 'Date',
    icon: Calendar,
    defaultProps: {
      // null renders as today's date, re-evaluated on every render —
      // the "Update to today" button in PropertiesPanel just resets it
      // back to null (see DateProperties), rather than writing a value
      // that's only correct until the next day.
      date: null,
      format: 'long',
      align: 'left',
      bold: false,
      italic: false,
      color: null,
      fontFamily: null,
      fontSize: null,
    },
  },
  {
    type: BLOCK_TYPES.MAP,
    label: 'Locations Map',
    icon: MapPinned,
    defaultProps: {
      title: 'Selected Works',
      showTitle: true,
      titleRule: true,
      titleSize: 'md',
      titleColor: null,
      fontFamily: null,
      fontSize: null,
      // Which 'entries'-type Content Library slot to plot — any list
      // with a location on each item works (Selected Works, Work
      // Experience, Education, Achievements), not just Selected Works;
      // picked the same way a Technical Skills chart picks which
      // checklist to plot (see SkillsChartProperties/block.librarySource).
      librarySource: 'selectedWorks',
      // 'numbered': a dot + number on the map, titles listed in a
      // numbered two-column legend below it.
      // 'leader': each location's title/location labeled directly,
      // connected to its dot by a line, no separate legend needed.
      legendStyle: 'numbered',
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
  if (SECTION_TITLE_TYPES.includes(block.type)) return !!block.title && block.showTitle !== false
  // A Text block's title used to require a bound Content Library field
  // (contentSlot) — but BlockRenderer's own title logic (autoTitle =
  // block.titleText || translateSectionTitle(boundSlot?.label, ...)) has
  // always let `titleText` stand on its own for a free-text block too.
  // Matching that here is what lets a free-text block's title share the
  // same H2 row/typography-matching identity as a library-bound one's.
  if (block.type === BLOCK_TYPES.TEXT) return block.showTitle === true && !!(block.contentSlot || block.titleText)
  return false
}

// A Text block bound to an "entries" Content Library slot (Selected Works,
// or any future one) renders per-item titles just like the dedicated
// Experience/Education blocks do (see BlockRenderer.jsx) — so it should
// share their "Entry title" styling identity rather than being lumped in
// with plain paragraph Text blocks.
export function isEntriesBoundText(block) {
  return block.type === BLOCK_TYPES.TEXT && CONTENT_SLOTS.find((s) => s.key === block.contentSlot)?.type === 'entries'
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

// First block of `type` found in `blocks`, recursing into Columns — used
// below to prefer a plain Text/Quote block's *nearest* sibling over the
// Global Style bulk editor's single merged "Body text"/"Quote" row. Several
// of the built-in templates already mix genuinely different paragraph
// styles on one page (e.g. a header's tagline vs. an entry's description),
// so "the first Text block anywhere in the template" is frequently a
// different, unrelated block from the one actually customized right next
// to where a new block is being dropped.
function findSiblingOfType(blocks, type, recurseIntoColumns = true) {
  // Pass 1: direct entries only. A block dropped straight onto the page
  // should match another direct sibling first — recursing into a Columns
  // block's nested items before finishing this pass meant an unrelated
  // Text block buried inside, say, the Education column (which usually
  // sits earlier in the array) got matched instead of one just customized
  // at the top level, purely because of array order.
  for (const block of blocks || []) {
    if (block.type === type) return block
  }
  if (!recurseIntoColumns) return null
  // Pass 2: only reached when nothing at this level matched — now it's
  // worth digging into nested Columns items instead of matching nothing.
  for (const block of blocks || []) {
    if (block.type === BLOCK_TYPES.COLUMNS) {
      for (const column of block.columns || []) {
        const found = findSiblingOfType(column.items, type)
        if (found) return found
      }
    }
  }
  return null
}

// Every per-instance typography field a plain Text/Quote block carries
// (see BodyTextStyleFields in PropertiesPanel.jsx) — copied wholesale from
// a matched sibling rather than going through the row/matchType
// translation applyMatchedTypography below uses, since there's no
// title/entryTitle field-name remapping to do for these two types.
function extractTypographyFields(block) {
  return {
    bold: !!block.bold,
    italic: !!block.italic,
    textTransform: block.textTransform,
    color: block.color,
    fontFamily: block.fontFamily,
    fontSize: block.fontSize,
    lineHeight: block.lineHeight,
    letterSpacing: block.letterSpacing,
  }
}

// Copies a typography row's weight/style/color/font onto a freshly created
// block, using the same row identities and field-name translation as the
// Global Style bulk editor (PropertiesPanel's applyTypographyChange) — so a
// block added after a bulk edit matches it immediately instead of coming in
// with the type's hardcoded defaults and needing the same edit redone by
// hand. `allBlocks` is the template's full block list (every page, pre-
// recursion into Columns — getTemplateTypographyStyles walks those itself)
// so this applies even to rows (Body text, Quote, Entry title) whose
// identity is template-wide rather than tied to one page's siblings.
function applyMatchedTypography(item, allBlocks) {
  if (!allBlocks?.length) return item
  const rows = getTemplateTypographyStyles({ blocks: allBlocks })
  const findRow = (key) => rows.find((row) => row.key === key)
  let result = item

  if (result.type === BLOCK_TYPES.HEADING) {
    const row = findRow(`heading-${result.level || 'h1'}-${result.size || 'md'}`)
    if (row) {
      result = {
        ...result,
        bold: row.bold,
        italic: row.italic,
        textTransform: row.textTransform,
        color: row.color,
        fontFamily: row.fontFamily,
        lineHeight: row.lineHeight,
        letterSpacing: row.letterSpacing,
      }
    }
  } else if (result.type === BLOCK_TYPES.TEXT && !hasSectionTitle(result)) {
    const row = findRow('text')
    if (row) {
      result = {
        ...result,
        bold: row.bold,
        italic: row.italic,
        textTransform: row.textTransform,
        color: row.color,
        fontFamily: row.fontFamily,
        fontSize: row.sizePx,
        lineHeight: row.lineHeight,
        letterSpacing: row.letterSpacing,
      }
    }
  } else if (result.type === BLOCK_TYPES.QUOTE) {
    const row = findRow('quote')
    if (row) {
      result = {
        ...result,
        bold: row.bold,
        italic: row.italic,
        textTransform: row.textTransform,
        color: row.color,
        fontFamily: row.fontFamily,
        fontSize: row.sizePx,
        lineHeight: row.lineHeight,
        letterSpacing: row.letterSpacing,
      }
    }
  }

  if (
    result.type === BLOCK_TYPES.EXPERIENCE ||
    result.type === BLOCK_TYPES.EDUCATION ||
    isEntriesBoundText(result)
  ) {
    const row = findRow('entryTitle')
    if (row) {
      result = {
        ...result,
        entryTitleBold: row.bold,
        entryTitleItalic: row.italic,
        entryTitleTextTransform: row.textTransform,
        entryTitleColor: row.color,
        entryTitleFontFamily: row.fontFamily,
        entryTitleFontSize: row.sizePx,
      }
    }
  }

  if (hasSectionTitle(result)) {
    const row = findRow(`heading-h2-${result.titleSize || 'md'}`)
    if (row) {
      result = {
        ...result,
        titleBold: row.bold,
        titleItalic: row.italic,
        titleTextTransform: row.textTransform,
        titleColor: row.color,
        fontFamily: row.fontFamily,
      }
    }
  }

  return result
}

// Applies that inferred sibling style to a newly created block, before
// it's added — a HEADING gets a matching level/size, a section-title
// block (Contact Info, Leisure, Experience, Education, Technical Skills,
// Languages) gets a matching titleSize. Anything else is left untouched.
// `allBlocks` (the template's full, ungrouped block list) then layers on
// the matching row's weight/style/color/font — see applyMatchedTypography.
export function matchNewBlockToSiblings(newItem, siblingBlocks, allBlocks) {
  const style = inferSiblingTitleStyle(siblingBlocks) || inferSiblingTitleStyle(siblingBlocks, true)
  let result = newItem
  if (style) {
    if (result.type === BLOCK_TYPES.HEADING) {
      result = { ...result, size: style.size, level: style.level || result.level }
    } else if (SECTION_TITLE_TYPES.includes(result.type) || (result.type === BLOCK_TYPES.TEXT && result.showTitle)) {
      result = { ...result, titleSize: style.size }
    }
  }

  // A plain Text or Quote block: prefer whatever's right next to it on this
  // page/column over the template-wide merged style (see
  // findSiblingOfType/extractTypographyFields above) — falls through to
  // the merged row below only when the page/column has no sibling of that
  // type yet to copy from.
  if (result.type === BLOCK_TYPES.TEXT && !hasSectionTitle(result)) {
    const sibling = findSiblingOfType(siblingBlocks, BLOCK_TYPES.TEXT)
    if (sibling) return { ...result, ...extractTypographyFields(sibling) }
  } else if (result.type === BLOCK_TYPES.QUOTE) {
    const sibling = findSiblingOfType(siblingBlocks, BLOCK_TYPES.QUOTE)
    if (sibling) return { ...result, ...extractTypographyFields(sibling) }
  }

  return applyMatchedTypography(result, allBlocks || siblingBlocks)
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
// to add them, and is still offered above. An 'entries' slot with its
// own dedicated block (experience/education) is skipped the same way;
// `selectedWorks` is also type 'entries' but has no dedicated block of
// its own, so it stays — the only way to add it is a Text block bound
// to it (see the TEXT case in BlockRenderer.jsx, which renders an
// 'entries'-bound Text block structurally), so it needs to be reachable
// from this palette directly.
const CONTENT_LIBRARY_PALETTE_SKIP_TYPES = new Set(['image', 'social', 'contactGroup', 'languages'])
// 'quote': the Content Library's "Quote" field already has a dedicated
// way in — drag in the Quote block itself, then bind its own "Content
// from library" picker to this slot, which renders it properly (as a
// blockquote with its author line and optional oversized marks) instead
// of as a plain Text block. Without this, the palette showed "Quote"
// twice: the real Quote block, and this field's own generic Text-block
// entry right next to it.
const CONTENT_LIBRARY_PALETTE_SKIP_KEYS = new Set(['skills', 'hobbies', 'qrValue', 'experience', 'education', 'quote'])
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
  function addRow(key, label, sizePx, bold, color, fontFamily, matchType, level, size, italic, textTransform, lineHeight, letterSpacing) {
    if (rows.has(key)) return
    rows.set(key, {
      key,
      label,
      sizePx,
      bold,
      color: color || null,
      fontFamily: fontFamily || null,
      matchType,
      level,
      size,
      italic: !!italic,
      textTransform: textTransform || '',
      // Not shown in the bulk "Text styles used in this template" editor
      // (Global Style has no per-row UI for these two, unlike size/bold/
      // italic/color/font) — carried on the row purely so a freshly added
      // block can still match an existing one's line height/letter spacing
      // (see applyMatchedTypography below), the same way it already
      // matches everything else this row tracks.
      lineHeight: lineHeight ?? null,
      letterSpacing: letterSpacing ?? null,
    })
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
          block.italic,
          block.textTransform,
          block.lineHeight,
          block.letterSpacing,
        )
      } else if (block.type === BLOCK_TYPES.TEXT) {
        addRow(
          'text',
          'Body text (P)',
          block.fontSize || 14,
          !!block.bold,
          block.color,
          block.fontFamily,
          BLOCK_TYPES.TEXT,
          undefined,
          undefined,
          block.italic,
          block.textTransform,
          block.lineHeight,
          block.letterSpacing,
        )
      } else if (block.type === BLOCK_TYPES.QUOTE) {
        addRow(
          'quote',
          'Quote',
          block.fontSize || 14,
          !!block.bold,
          block.color,
          block.fontFamily,
          BLOCK_TYPES.QUOTE,
          undefined,
          undefined,
          block.italic,
          block.textTransform,
          block.lineHeight,
          block.letterSpacing,
        )
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
          block.titleBold !== false,
          block.titleColor,
          block.fontFamily,
          BLOCK_TYPES.HEADING,
          'h2',
          size,
          block.titleItalic,
          block.titleTextTransform,
        )
      }
      // An Experience/Education block's per-entry title ("Job Role",
      // "Associate Director", ...) is neither the block's own section
      // title (handled above via hasSectionTitle/titleColor) nor its body
      // text — it's rendered per array item, so it can't be walked as its
      // own block. Both block types share one merged row (like Body text
      // does for every Text block) so styling entry titles stays a single
      // global control instead of two near-identical ones.
      if (block.type === BLOCK_TYPES.EXPERIENCE || block.type === BLOCK_TYPES.EDUCATION || isEntriesBoundText(block)) {
        addRow(
          'entryTitle',
          'Entry title (Experience / Education / Selected Works)',
          block.entryTitleFontSize || 16,
          block.entryTitleBold !== false,
          block.entryTitleColor,
          block.entryTitleFontFamily,
          'entryTitle',
          undefined,
          undefined,
          block.entryTitleItalic,
          block.entryTitleTextTransform,
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
  if (row.matchType === 'entryTitle') {
    return block.type === BLOCK_TYPES.EXPERIENCE || block.type === BLOCK_TYPES.EDUCATION || isEntriesBoundText(block)
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
