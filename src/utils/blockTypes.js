import {
  BarChart3,
  Columns3,
  Contact,
  Heading1,
  IdCard,
  Image as ImageIcon,
  Languages as LanguagesIcon,
  Minus,
  QrCode,
  Quote as QuoteIcon,
  RectangleHorizontal,
  Share2,
  Sparkles,
  Text as TextIcon,
  PanelBottom,
} from 'lucide-react'

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
}

// Fonts available in the font-family selectors (toolbar and properties panel).
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
      contentSlot: null,
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
    defaultProps: {},
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
    },
  },
  {
    type: BLOCK_TYPES.CONTACT_INFO,
    label: 'Contact Info',
    icon: Contact,
    defaultProps: {
      title: 'Contact Info',
      titleColor: null,
      address: 'City, Country',
      phone: '+00 000 000 0000',
      email: 'you@example.com',
      website: 'yourwebsite.com',
      useLibraryContact: false,
      showIcons: true,
      align: 'left',
    },
  },
  {
    type: BLOCK_TYPES.LEISURE,
    label: 'Leisure',
    icon: Sparkles,
    defaultProps: {
      title: 'Hobbies & Interests',
      items: ['Photography', 'Hiking', 'Reading'],
      useLibraryHobbies: false,
      align: 'left',
    },
  },
]

export function getBlockDefinition(type) {
  return BLOCK_DEFINITIONS.find((def) => def.type === type)
}

function generateId() {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
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
