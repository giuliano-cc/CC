import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { ArrowLeft, FileText, Loader2, RotateCcw, Save, Wand2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { BuilderProvider, useBuilder } from '../context/BuilderContext'
import { useContentLibrary } from '../context/ContentLibraryContext'
import BlockPalette from '../components/builder/BlockPalette'
import Canvas, { parsePageDroppableId } from '../components/builder/Canvas'
import PdfPreviewModal from '../components/builder/PdfPreviewModal'
import PropertiesPanel from '../components/builder/PropertiesPanel'
import Toolbar from '../components/builder/Toolbar'
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
  const { blocks, addBlock, updateBlock, pageCount, globalStyle, selectBlock, resetTo } = useBuilder()
  const builtInTemplate = CV_TEMPLATES.find((t) => t.id === id)
  const { getLibrary } = useContentLibrary()
  const library = getLibrary(globalStyle.contentLanguage)

  const [title, setTitle] = useState(initialTitle)
  const [isSaving, setIsSaving] = useState(false)
  const [isRendering, setIsRendering] = useState(false)
  const [pdfState, setPdfState] = useState(null) // null | { blobUrl, isGenerating }

  const debouncedBlocks = useDebouncedValue(blocks, 800)
  const hasRenderedOnce = useRef(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )

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

  // Draws every page as real vector PDF content straight from the block
  // data (see utils/pdfVectorExport.js) — entirely client-side, and
  // without ever touching the editor's own DOM, so there's no selection
  // outline/resize handle to worry about hiding first.
  async function handlePreviewPdf() {
    selectBlock(null)
    setPdfState({ blobUrl: null, isGenerating: true })
    try {
      // Dynamically imported: jsPDF, the embedded-font decompressor and
      // ~30 font files are only ever needed once someone actually asks
      // for a PDF, so they're kept out of the app's main bundle entirely
      // until then.
      const { generatePdfBlob } = await import('../utils/pdfVectorExport')
      const blob = await generatePdfBlob({ pageCount, blocks, globalStyle, library })
      const blobUrl = URL.createObjectURL(blob)
      setPdfState({ blobUrl, isGenerating: false })
    } catch {
      toast.error('Unable to generate the PDF preview.')
      setPdfState(null)
    }
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

  function closePdfPreview() {
    if (pdfState?.blobUrl) URL.revokeObjectURL(pdfState.blobUrl)
    setPdfState(null)
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
              onClick={handlePreviewPdf}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:border-primary hover:text-primary"
            >
              <FileText size={15} />
              Preview PDF
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

        <Toolbar />

        <div className="flex flex-1 overflow-hidden">
          <BlockPalette />
          <Canvas />
          <PropertiesPanel />
        </div>
      </div>

      {pdfState && (
        <PdfPreviewModal
          blobUrl={pdfState.blobUrl}
          isGenerating={pdfState.isGenerating}
          onClose={closePdfPreview}
        />
      )}
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
