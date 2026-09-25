import {
  Heading1,
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
]

export function getBlockDefinition(type) {
  return BLOCK_DEFINITIONS.find((def) => def.type === type)
}

export function createBlockInstance(type) {
  const definition = getBlockDefinition(type)
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    ...structuredClone(definition.defaultProps),
  }
}
