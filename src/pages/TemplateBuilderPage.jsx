import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { BuilderProvider, useBuilder } from '../context/BuilderContext'
import BlockPalette from '../components/builder/BlockPalette'
import Canvas, { CANVAS_DROPPABLE_ID } from '../components/builder/Canvas'
import PropertiesPanel from '../components/builder/PropertiesPanel'
import Toolbar from '../components/builder/Toolbar'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { createTemplate, renderTemplate, updateTemplate } from '../services/templatesService'

function BuilderContent() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const { blocks, addBlock, reorderBlocks } = useBuilder()

  const [title, setTitle] = useState('Nuovo Template')
  const [isSaving, setIsSaving] = useState(false)
  const [isRendering, setIsRendering] = useState(false)

  const debouncedBlocks = useDebouncedValue(blocks, 800)
  const hasRenderedOnce = useRef(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )

  // Anteprima: invia i blocchi al backend 800ms dopo l'ultima modifica.
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
        if (!cancelled) toast.error("Impossibile generare l'anteprima")
      } finally {
        if (!cancelled) setIsRendering(false)
      }
    }
    generatePreview()

    return () => {
      cancelled = true
    }
  }, [debouncedBlocks, id])

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event
      if (!over) return

      const isFromPalette = active.data.current?.source === 'palette'

      if (isFromPalette) {
        const blockType = active.data.current.blockType
        const overIndex = blocks.findIndex((b) => b.id === over.id)
        const insertIndex =
          over.id === CANVAS_DROPPABLE_ID || overIndex === -1
            ? blocks.length
            : overIndex + 1
        addBlock(blockType, insertIndex)
        return
      }

      if (active.id !== over.id) {
        reorderBlocks(active.id, over.id)
      }
    },
    [blocks, addBlock, reorderBlocks],
  )

  async function handleSave() {
    setIsSaving(true)
    try {
      const payload = { title, blocks }
      if (isNew) {
        const created = await createTemplate({ ...payload, category: 'Personalizzato' })
        toast.success('Template salvato')
        navigate(`/templates/${created.id}`, { replace: true })
      } else {
        await updateTemplate(id, payload)
        toast.success('Template salvato')
      }
    } catch (err) {
      const status = err.response?.status
      if (status === 401 || status === 403) {
        toast.error('Non sei autorizzato a salvare questo template.')
      } else {
        toast.error('Impossibile salvare il template.')
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
              aria-label="Torna ai template"
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
                Aggiornamento anteprima...
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:opacity-70"
            >
              {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Salva
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
    </DndContext>
  )
}

export default function TemplateBuilderPage() {
  return (
    <BuilderProvider>
      <BuilderContent />
    </BuilderProvider>
  )
}
