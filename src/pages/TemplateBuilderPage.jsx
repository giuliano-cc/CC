import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { ArrowLeft, FileText, Loader2, Save, Wand2 } from 'lucide-react'
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
import { TEMPLATE_CONTENT_MAPS } from '../utils/cvTemplates'
import { parseSocialLinks } from '../utils/socialIcons'
import { generatePdfBlob } from '../utils/pdfExport'
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
  const { blocks, addBlock, updateBlock, pageCount, globalStyle, selectBlock } = useBuilder()
  const { library } = useContentLibrary()

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

      const blockType = active.data.current.blockType
      const draggedRect = active.rect.current.translated
      const canvasRect = over.rect

      const position = draggedRect
        ? {
            x: Math.max(0, draggedRect.left - canvasRect.left),
            y: Math.max(0, draggedRect.top - canvasRect.top),
          }
        : undefined

      addBlock(blockType, position, pageIndex)
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

    toast.success('Content applied from your library')
  }

  // Renders every page to an image and assembles a PDF, entirely
  // client-side. Deselecting first removes selection outlines/resize
  // handles from the capture; a tick lets that re-render before we snapshot.
  async function handlePreviewPdf() {
    selectBlock(null)
    setPdfState({ blobUrl: null, isGenerating: true })
    await new Promise((resolve) => setTimeout(resolve, 50))
    try {
      const blob = await generatePdfBlob(pageCount)
      const blobUrl = URL.createObjectURL(blob)
      setPdfState({ blobUrl, isGenerating: false })
    } catch {
      toast.error('Unable to generate the PDF preview.')
      setPdfState(null)
    }
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
