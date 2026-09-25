import {
  Columns3,
  Heading1,
  IdCard,
  Image as ImageIcon,
  Minus,
  Quote as QuoteIcon,
  RectangleHorizontal,
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
}

export const BLOCK_DEFINITIONS = [
  {
    type: BLOCK_TYPES.HEADER,
    label: 'Header',
    icon: RectangleHorizontal,
    defaultProps: {
      content: 'La tua azienda',
      align: 'left',
      bold: true,
      italic: false,
      underline: false,
    },
  },
  {
    type: BLOCK_TYPES.CV_HEADER,
    label: 'Intestazione CV',
    icon: IdCard,
    defaultProps: {
      name: 'Nome Cognome',
      role: '',
      contacts: ['sito.com', 'email@esempio.com', '000-000-0000'],
      layout: 'row',
      color: null,
    },
  },
  {
    type: BLOCK_TYPES.HEADING,
    label: 'Heading',
    icon: Heading1,
    defaultProps: {
      content: 'Titolo sezione',
      level: 'h1',
      align: 'left',
      bold: true,
      italic: false,
      underline: false,
      size: 'md',
      color: null,
      rule: false,
    },
  },
  {
    type: BLOCK_TYPES.TEXT,
    label: 'Text',
    icon: TextIcon,
    defaultProps: {
      content: 'Inserisci qui il testo del paragrafo.',
      align: 'left',
      bold: false,
      italic: false,
      underline: false,
      list: false,
      color: null,
    },
  },
  {
    type: BLOCK_TYPES.IMAGE,
    label: 'Image',
    icon: ImageIcon,
    defaultProps: {
      src: '',
      alt: 'Immagine',
      align: 'center',
      shape: 'rect',
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
      content: 'Una citazione significativa.',
      align: 'left',
      italic: true,
      bold: false,
      underline: false,
      color: null,
    },
  },
  {
    type: BLOCK_TYPES.FOOTER,
    label: 'Footer',
    icon: PanelBottom,
    defaultProps: {
      content: '© 2026 La tua azienda. Tutti i diritti riservati.',
      align: 'center',
      bold: false,
      italic: false,
      underline: false,
    },
  },
  {
    type: BLOCK_TYPES.COLUMNS,
    label: 'Colonne',
    icon: Columns3,
    defaultProps: {
      widths: null,
      columns: [{ items: [] }, { items: [] }],
    },
  },
]

export function getBlockDefinition(type) {
  return BLOCK_DEFINITIONS.find((def) => def.type === type)
}

function generateId() {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createBlockInstance(type) {
  const definition = getBlockDefinition(type)
  return {
    id: generateId(),
    type,
    ...structuredClone(definition.defaultProps),
  }
}
