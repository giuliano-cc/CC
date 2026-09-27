import { useEffect } from 'react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Underline,
  Undo2,
} from 'lucide-react'
import { useBuilder } from '../../context/BuilderContext'
import { BLOCK_TYPES, FONT_FAMILY_OPTIONS } from '../../utils/blockTypes'

function ToolbarButton({ active, onClick, disabled, children, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition disabled:cursor-not-allowed disabled:opacity-30 ${
        active ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  )
}

const TEXTUAL_TYPES = [
  BLOCK_TYPES.HEADING,
  BLOCK_TYPES.TEXT,
  BLOCK_TYPES.QUOTE,
  BLOCK_TYPES.HEADER,
  BLOCK_TYPES.FOOTER,
]

export default function Toolbar() {
  const { selectedBlock, updateBlock, undo, redo, canUndo, canRedo } = useBuilder()

  // Cmd/Ctrl+Z to undo, Cmd/Ctrl+Shift+Z (or Ctrl+Y) to redo — ignored while
  // typing in an input/textarea so it doesn't fight the browser's own
  // native undo inside that field.
  useEffect(() => {
    function handleKeyDown(event) {
      const isMod = event.metaKey || event.ctrlKey
      if (!isMod) return
      const target = event.target
      if (target?.closest?.('input, textarea, [contenteditable="true"]')) return

      if (event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
      } else if (event.key.toLowerCase() === 'y') {
        event.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  const isTextual = !!selectedBlock && TEXTUAL_TYPES.includes(selectedBlock.type)
  const disabled = !isTextual
  const isHeading = selectedBlock?.type === BLOCK_TYPES.HEADING
  const isText = selectedBlock?.type === BLOCK_TYPES.TEXT
  const hasTypography = [BLOCK_TYPES.HEADING, BLOCK_TYPES.TEXT, BLOCK_TYPES.QUOTE].includes(
    selectedBlock?.type,
  )

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

  function toggleList(ordered) {
    if (!selectedBlock) return
    const alreadyThisMode = selectedBlock.list && selectedBlock.ordered === ordered
    updateBlock(selectedBlock.id, { list: !alreadyThisMode, ordered })
  }

  return (
    <div className="flex h-12 shrink-0 items-center gap-1 overflow-x-auto border-b border-slate-200 bg-white px-4">
      <ToolbarButton label="Undo (Ctrl/Cmd+Z)" disabled={!canUndo} onClick={undo}>
        <Undo2 size={16} />
      </ToolbarButton>
      <ToolbarButton label="Redo (Ctrl/Cmd+Shift+Z)" disabled={!canRedo} onClick={redo}>
        <Redo2 size={16} />
      </ToolbarButton>

      <div className="mx-2 h-5 w-px shrink-0 bg-slate-200" />

      {hasTypography && (
        <>
          <select
            value={selectedBlock.fontFamily || ''}
            onChange={(e) => updateBlock(selectedBlock.id, { fontFamily: e.target.value || null })}
            className="h-8 shrink-0 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600 outline-none focus:border-primary"
          >
            {FONT_FAMILY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <input
            type="number"
            min={8}
            max={120}
            placeholder="px"
            value={selectedBlock.fontSize || ''}
            onChange={(e) =>
              updateBlock(selectedBlock.id, {
                fontSize: e.target.value ? Number(e.target.value) : null,
              })
            }
            title="Font size (px)"
            className="h-8 w-14 shrink-0 rounded-md border border-slate-200 px-2 text-xs text-slate-600 outline-none focus:border-primary"
          />

          <input
            type="color"
            value={selectedBlock.color || '#1e293b'}
            onChange={(e) => updateBlock(selectedBlock.id, { color: e.target.value })}
            title="Text color"
            className="h-8 w-8 shrink-0 cursor-pointer rounded-md border border-slate-200"
          />

          <div className="mx-2 h-5 w-px shrink-0 bg-slate-200" />
        </>
      )}

      <ToolbarButton
        label="Bold"
        active={!!selectedBlock?.bold}
        disabled={disabled}
        onClick={() => toggle('bold')}
      >
        <Bold size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={!!selectedBlock?.italic}
        disabled={disabled}
        onClick={() => toggle('italic')}
      >
        <Italic size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        active={!!selectedBlock?.underline}
        disabled={disabled}
        onClick={() => toggle('underline')}
      >
        <Underline size={16} />
      </ToolbarButton>

      <select
        value={selectedBlock?.textTransform || ''}
        onChange={(e) =>
          selectedBlock && updateBlock(selectedBlock.id, { textTransform: e.target.value || null })
        }
        disabled={disabled}
        title="Text case"
        className="h-8 shrink-0 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600 outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-30"
      >
        <option value="">Aa (default)</option>
        <option value="uppercase">ALL CAPS</option>
        <option value="capitalize">Capitalize Each Word</option>
        <option value="lowercase">lowercase</option>
      </select>

      <div className="mx-2 h-5 w-px shrink-0 bg-slate-200" />

      <ToolbarButton
        label="Heading 1"
        active={isHeading && selectedBlock?.level === 'h1'}
        disabled={!isHeading}
        onClick={() => setLevel('h1')}
      >
        <Heading1 size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 2"
        active={isHeading && selectedBlock?.level === 'h2'}
        disabled={!isHeading}
        onClick={() => setLevel('h2')}
      >
        <Heading2 size={16} />
      </ToolbarButton>

      <div className="mx-2 h-5 w-px shrink-0 bg-slate-200" />

      <ToolbarButton
        label="Align left"
        active={selectedBlock?.align === 'left'}
        disabled={disabled}
        onClick={() => setAlign('left')}
      >
        <AlignLeft size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="Align center"
        active={selectedBlock?.align === 'center'}
        disabled={disabled}
        onClick={() => setAlign('center')}
      >
        <AlignCenter size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="Align right"
        active={selectedBlock?.align === 'right'}
        disabled={disabled}
        onClick={() => setAlign('right')}
      >
        <AlignRight size={16} />
      </ToolbarButton>

      <div className="mx-2 h-5 w-px shrink-0 bg-slate-200" />

      <ToolbarButton
        label="Bulleted list"
        active={isText && !!selectedBlock?.list && !selectedBlock?.ordered}
        disabled={!isText}
        onClick={() => toggleList(false)}
      >
        <List size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={isText && !!selectedBlock?.list && !!selectedBlock?.ordered}
        disabled={!isText}
        onClick={() => toggleList(true)}
      >
        <ListOrdered size={16} />
      </ToolbarButton>
    </div>
  )
}
