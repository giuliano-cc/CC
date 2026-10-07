import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import {
  ArrowLeft,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Printer,
  Redo2,
  RotateCcw,
  Save,
  Undo2,
  Wand2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { BuilderProvider, useBuilder } from '../context/BuilderContext'
import { useContentLibrary } from '../context/ContentLibraryContext'
import BlockPalette from '../components/builder/BlockPalette'
import Canvas, { parsePageDroppableId } from '../components/builder/Canvas'
import PrintDocument from '../components/builder/PrintDocument'
import PropertiesPanel from '../components/builder/PropertiesPanel'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { BLOCK_TYPES } from '../utils/blockTypes'
import { SHEET_HEIGHT, SHEET_WIDTH } from '../utils/layout'
import { CV_TEMPLATES, TEMPLATE_CONTENT_MAPS } from '../utils/cvTemplates'
import { parseSocialLinks } from '../utils/socialIcons'
import {
  createTemplate,
  getTemplateById,
  renderTemplate,
  updateTemplate,
} from '../services/templatesService'

function BuilderContent({ initialTitle }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const {
    blocks,
    addBlock,
    updateBlock,
    pageCount,
    globalStyle,
    selectBlock,
    resetTo,
    selectedIds,
    undo,
    redo,
    canUndo,
    canRedo,
    nudgeSelection,
    copySelection,
    pasteSelection,
  } = useBuilder()
  const builtInTemplate = CV_TEMPLATES.find((t) => t.id === id)
  const { getLibrary } = useContentLibrary()
  const library = getLibrary(globalStyle.contentLanguage)

  const [title, setTitle] = useState(initialTitle)
  const [isSaving, setIsSaving] = useState(false)
  const [isRendering, setIsRendering] = useState(false)
  // Hides the Blocks palette and Properties panel together, for a quick
  // look at just the pages without either side panel in the way — not
  // persisted, since it's a momentary view toggle, not a layout preference.
  const [showSidePanels, setShowSidePanels] = useState(true)

  const debouncedBlocks = useDebouncedValue(blocks, 800)
  const hasRenderedOnce = useRef(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )

  // Cmd/Ctrl+Z to undo, Cmd/Ctrl+Shift+Z (or Ctrl+Y) to redo, Cmd/Ctrl+C /
  // Cmd/Ctrl+V to copy/paste the selected block(s), and the arrow keys to
  // nudge them by 1px (10px with Shift held) — all ignored while typing in
  // an input/textarea so they don't fight the browser's own native
  // shortcuts inside that field.
  useEffect(() => {
    function handleKeyDown(event) {
      const target = event.target
      if (target?.closest?.('input, textarea, select, [contenteditable="true"]')) return

      const isMod = event.metaKey || event.ctrlKey
      if (isMod) {
        const key = event.key.toLowerCase()
        if (key === 'z') {
          event.preventDefault()
          if (event.shiftKey) redo()
          else undo()
          return
        }
        if (key === 'y') {
          event.preventDefault()
          redo()
          return
        }
        if (key === 'c') {
          if (selectedIds.length === 0) return
          event.preventDefault()
          copySelection()
          return
        }
        if (key === 'v') {
          event.preventDefault()
          pasteSelection()
          return
        }
        return
      }

      const ARROW_DELTAS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }
      const delta = ARROW_DELTAS[event.key]
      if (delta && selectedIds.length > 0) {
        event.preventDefault()
        const step = event.shiftKey ? 10 : 1
        nudgeSelection(delta[0] * step, delta[1] * step)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, selectedIds, nudgeSelection, copySelection, pasteSelection])

  // Preview: sends the blocks to the backend 800ms after the last change.
  useEffect(() => {
    if (!hasRenderedOnce.current) {
      hasRenderedOnce.current = true
      return
    }
    if (debouncedBlocks.length === 0) return

    let cancelled = false
    async function generatePreview() {
      setIsRendering(true)
      try {
        await renderTemplate(id ?? 'draft', debouncedBlocks)
      } catch {
        if (!cancelled) toast.error("Unable to generate the preview")
      } finally {
        if (!cancelled) setIsRendering(false)
      }
    }
    generatePreview()

    return () => {
      cancelled = true
    }
  }, [debouncedBlocks, id])

  // Dragging a block from the palette places it on the sheet at the exact
  // point where it was dropped (relative to the sheet's own corner).
  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event
      if (!over) return
      const pageIndex = parsePageDroppableId(over.id)
      if (pageIndex === null) return
      if (active.data.current?.source !== 'palette') return

      const { blockType, extraProps } = active.data.current
      const draggedRect = active.rect.current.translated
      const canvasRect = over.rect

      const position = draggedRect
        ? {
            x: Math.max(0, draggedRect.left - canvasRect.left),
            y: Math.max(0, draggedRect.top - canvasRect.top),
          }
        : undefined

      addBlock(blockType, position, pageIndex, extraProps)
    },
    [addBlock],
  )

  // Binds this template's known blocks to the matching Content Library
  // slots (see TEMPLATE_CONTENT_MAPS), and adds a QR code / social icons
  // block reading from the library if one isn't already present. One
  // click fills the whole template with whatever you wrote in the library.
  function handleFillWithContent() {
    const map = TEMPLATE_CONTENT_MAPS[id] || []
    map.forEach(({ blockId, field, slot }) => {
      updateBlock(blockId, { [field]: slot })
    })

    if (library.qrValue?.trim() && !blocks.some((b) => b.type === BLOCK_TYPES.QR_CODE)) {
      const qr = addBlock(BLOCK_TYPES.QR_CODE, { x: SHEET_WIDTH - 188, y: SHEET_HEIGHT - 208 })
      updateBlock(qr.id, { useLibraryValue: true })
    }

    const hasSocialLinks = parseSocialLinks(library.socialLinks).some((i) => i.url)
    if (hasSocialLinks && !blocks.some((b) => b.type === BLOCK_TYPES.SOCIAL_ICONS)) {
      const social = addBlock(BLOCK_TYPES.SOCIAL_ICONS, { x: 48, y: SHEET_HEIGHT - 90 })
      updateBlock(social.id, { useLibraryLinks: true })
    }

    // Any Contact Info / Technical Skills / Languages / Leisure / Experience
    // / Education block already on the sheet (dragged in manually, not just
    // the ones baked into the built-in templates — including nested inside
    // a Columns block, e.g. the built-in templates' own Experience/Education
    // sections) gets switched to read from the library too, instead of only
    // wiring the blocks TEMPLATE_CONTENT_MAPS knows about.
    const LIBRARY_TOGGLE_BY_TYPE = {
      [BLOCK_TYPES.CONTACT_INFO]: 'useLibraryContact',
      [BLOCK_TYPES.SKILLS_CHART]: 'useLibrarySkills',
      [BLOCK_TYPES.LANGUAGES_CHART]: 'useLibraryLanguages',
      [BLOCK_TYPES.LEISURE]: 'useLibraryHobbies',
      [BLOCK_TYPES.EXPERIENCE]: 'useLibraryExperience',
      [BLOCK_TYPES.EDUCATION]: 'useLibraryEducation',
    }
    function walk(list) {
      list.forEach((b) => {
        const toggleKey = LIBRARY_TOGGLE_BY_TYPE[b.type]
        if (toggleKey) updateBlock(b.id, { [toggleKey]: true })
        if (b.type === BLOCK_TYPES.COLUMNS) {
          b.columns?.forEach((column) => walk(column.items))
        }
      })
    }
    walk(blocks)

    toast.success('Content applied from your library')
  }

  // Prints the template — or, from the browser's own print dialog, saves
  // it as a PDF — via #print-root (see components/builder/PrintDocument.jsx
  // and index.css's `@media print` rules), which renders every block with
  // the exact same BlockRenderer + CSS already on screen. That's what
  // guarantees the output matches the canvas: it's the browser laying out
  // the real DOM, not a second, hand-written renderer trying to reproduce
  // its text-wrapping/spacing/fonts independently. Deselecting first means
  // there's no selection outline/resize handle in the DOM to worry about
  // (PrintDocument's own copy never has one, but this leaves the editor's
  // own canvas in a clean state once printing is done, too).
  function handlePrint() {
    selectBlock(null)
    window.print()
  }

  // Restores one of the 5 built-in templates to its shipped defaults,
  // discarding any accumulated blocks/edits — the escape hatch for a
  // template that's picked up stray or overlapping blocks over many
  // editing sessions (templates persist across reloads, so anything odd
  // stays until explicitly reset or fixed by hand).
  function handleResetToDefault() {
    if (!builtInTemplate) return
    if (!window.confirm(`Reset "${builtInTemplate.title}" to its default content? This discards all edits made to it.`)) {
      return
    }
    resetTo(builtInTemplate.blocks, builtInTemplate.globalStyle, builtInTemplate.pageCount)
    toast.success('Template reset to default')
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const payload = { title, blocks, pageCount, globalStyle }
      if (isNew) {
        const created = await createTemplate({ ...payload, category: 'Custom' })
        toast.success('Template saved')
        navigate(`/templates/${created.id}`, { replace: true })
      } else {
        await updateTemplate(id, payload)
        toast.success('Template saved')
      }
    } catch (err) {
      const status = err.response?.status
      if (status === 401 || status === 403) {
        toast.error("You're not authorized to save this template.")
      } else {
        toast.error('Unable to save the template.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Otherwise the only way to persist edits is the explicit Save button —
  // clicking "Edit in the library" (or any other in-app link away from the
  // builder) discarded every unsaved block/style change with no warning.
  // Kept in a ref (rather than a useEffect dependency) so the unmount
  // cleanup below always fires with the LATEST title/blocks/pageCount/
  // globalStyle, not whatever they were when the component first mounted —
  // an effect's cleanup closes over the render it belonged to, not the
  // most recent one. Silent (no toast) since it fires on every navigation
  // away, not just an explicit click; failures still show a toast because
  // those are the one case the user actually needs to know about.
  const latestSaveRef = useRef(null)
  latestSaveRef.current = async () => {
    try {
      const payload = { title, blocks, pageCount, globalStyle }
      if (isNew) {
        if (blocks.length === 0) return
        await createTemplate({ ...payload, category: 'Custom' })
      } else {
        await updateTemplate(id, payload)
      }
    } catch {
      toast.error('Unable to save your latest changes to this template.')
    }
  }
  useEffect(() => {
    return () => {
      latestSaveRef.current?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex h-screen flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/templates')}
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
              aria-label="Back to templates"
            >
              <ArrowLeft size={18} />
            </button>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-md px-2 py-1 text-sm font-medium text-slate-800 outline-none transition hover:bg-slate-50 focus:bg-slate-50"
            />
            <div className="ml-1 flex items-center gap-0.5 border-l border-slate-200 pl-3">
              <button
                type="button"
                onClick={undo}
                disabled={!canUndo}
                aria-label="Undo (Ctrl/Cmd+Z)"
                title="Undo (Ctrl/Cmd+Z)"
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Undo2 size={16} />
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={!canRedo}
                aria-label="Redo (Ctrl/Cmd+Shift+Z)"
                title="Redo (Ctrl/Cmd+Shift+Z)"
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Redo2 size={16} />
              </button>
              <button
                type="button"
                onClick={() => setShowSidePanels((v) => !v)}
                aria-label={showSidePanels ? 'Hide side panels' : 'Show side panels'}
                title={showSidePanels ? 'Hide blocks/properties panels — see just the pages' : 'Show blocks/properties panels'}
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100"
              >
                {showSidePanels ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isRendering && (
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Loader2 size={14} className="animate-spin" />
                Updating preview...
              </span>
            )}
            {builtInTemplate && (
              <button
                type="button"
                onClick={handleResetToDefault}
                title="Discard all edits and restore this template's shipped defaults"
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:border-red-300 hover:text-red-600"
              >
                <RotateCcw size={15} />
                Reset to default
              </button>
            )}
            <button
              type="button"
              onClick={handleFillWithContent}
              className="flex items-center gap-1.5 rounded-lg border border-primary/30 px-3.5 py-2 text-sm font-medium text-primary transition hover:bg-primary/5"
            >
              <Wand2 size={15} />
              Fill with my content
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:border-primary hover:text-primary"
            >
              <Printer size={15} />
              Print / Save as PDF
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:opacity-70"
            >
              {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Save
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {showSidePanels && <BlockPalette />}
          <Canvas />
          {showSidePanels && <PropertiesPanel />}
        </div>
      </div>

      <PrintDocument blocks={blocks} globalStyle={globalStyle} pageCount={pageCount} />
    </DndContext>
  )
}

export default function TemplateBuilderPage() {
  const { id } = useParams()
  const isNew = !id || id === 'new'

  const [template, setTemplate] = useState(isNew ? { title: 'New Template' } : null)
  const [isLoading, setIsLoading] = useState(!isNew)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isNew) return

    let cancelled = false
    setIsLoading(true)
    setError(null)

    getTemplateById(id)
      .then((data) => {
        if (cancelled) return
        if (!data) {
          setError(new Error('Template not found'))
        } else {
          setTemplate(data)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id, isNew])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-6">
        <ErrorMessage message="Unable to load this template." />
      </div>
    )
  }

  return (
    <BuilderProvider
      initialBlocks={template.blocks}
      initialGlobalStyle={template.globalStyle}
      initialPageCount={template.pageCount}
    >
      <BuilderContent initialTitle={template.title} />
    </BuilderProvider>
  )
}
