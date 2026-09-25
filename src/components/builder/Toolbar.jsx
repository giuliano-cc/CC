import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Italic,
  List,
  Underline,
} from 'lucide-react'
import { useBuilder } from '../../context/BuilderContext'
import { BLOCK_TYPES } from '../../utils/blockTypes'

function ToolbarButton({ active, onClick, disabled, children, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition disabled:cursor-not-allowed disabled:opacity-30 ${
        active ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  )
}

export default function Toolbar() {
  const { selectedBlock, updateBlock } = useBuilder()
  const disabled = !selectedBlock || selectedBlock.type === BLOCK_TYPES.DIVIDER
  const isHeading = selectedBlock?.type === BLOCK_TYPES.HEADING

  function toggle(prop) {
    if (!selectedBlock) return
    updateBlock(selectedBlock.id, { [prop]: !selectedBlock[prop] })
  }

  function setAlign(align) {
    if (!selectedBlock) return
    updateBlock(selectedBlock.id, { align })
  }

  function setLevel(level) {
    if (!selectedBlock) return
    updateBlock(selectedBlock.id, { level })
  }

  return (
    <div className="flex h-12 shrink-0 items-center gap-1 border-b border-slate-200 bg-white px-4">
      <ToolbarButton
        label="Grassetto"
        active={!!selectedBlock?.bold}
        disabled={disabled}
        onClick={() => toggle('bold')}
      >
        <Bold size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="Corsivo"
        active={!!selectedBlock?.italic}
        disabled={disabled}
        onClick={() => toggle('italic')}
      >
        <Italic size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="Sottolineato"
        active={!!selectedBlock?.underline}
        disabled={disabled}
        onClick={() => toggle('underline')}
      >
        <Underline size={16} />
      </ToolbarButton>

      <div className="mx-2 h-5 w-px bg-slate-200" />

      <ToolbarButton
        label="Titolo H1"
        active={isHeading && selectedBlock?.level === 'h1'}
        disabled={!isHeading}
        onClick={() => setLevel('h1')}
      >
        <Heading1 size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="Titolo H2"
        active={isHeading && selectedBlock?.level === 'h2'}
        disabled={!isHeading}
        onClick={() => setLevel('h2')}
      >
        <Heading2 size={16} />
      </ToolbarButton>

      <div className="mx-2 h-5 w-px bg-slate-200" />

      <ToolbarButton
        label="Allinea a sinistra"
        active={selectedBlock?.align === 'left'}
        disabled={disabled}
        onClick={() => setAlign('left')}
      >
        <AlignLeft size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="Allinea al centro"
        active={selectedBlock?.align === 'center'}
        disabled={disabled}
        onClick={() => setAlign('center')}
      >
        <AlignCenter size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="Allinea a destra"
        active={selectedBlock?.align === 'right'}
        disabled={disabled}
        onClick={() => setAlign('right')}
      >
        <AlignRight size={16} />
      </ToolbarButton>

      <div className="mx-2 h-5 w-px bg-slate-200" />

      <ToolbarButton label="Elenco puntato" disabled onClick={() => {}}>
        <List size={16} />
      </ToolbarButton>
    </div>
  )
}
