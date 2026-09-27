import { useDroppable } from '@dnd-kit/core'
import { Plus, X } from 'lucide-react'
import { useBuilder } from '../../context/BuilderContext'
import { SHEET_HEIGHT, SHEET_WIDTH } from '../../utils/layout'
import FreeBlock from './FreeBlock'

export function pageDroppableId(pageIndex) {
  return `canvas-page-${pageIndex}`
}

// Parses a page index back out of a droppable id, or null if it isn't one
// of ours (e.g. dropped outside any page).
export function parsePageDroppableId(id) {
  const match = /^canvas-page-(\d+)$/.exec(id || '')
  return match ? Number(match[1]) : null
}

function Page({ pageIndex, blocks, margin, globalStyle }) {
  const {
    selectedBlockId,
    selectedIds,
    selectBlock,
    removeBlock,
    addNestedItem,
    updateBlock,
    setActivePage,
  } = useBuilder()
  const { setNodeRef, isOver } = useDroppable({ id: pageDroppableId(pageIndex) })

  return (
    <div
      ref={setNodeRef}
      id={`pdf-page-${pageIndex}`}
      onClick={() => {
        selectBlock(null)
        setActivePage(pageIndex)
      }}
      style={{
        width: SHEET_WIDTH,
        height: SHEET_HEIGHT,
        fontFamily: globalStyle.fontFamily,
        color: globalStyle.textColor,
      }}
      className={`relative shrink-0 overflow-hidden rounded-sm bg-white shadow-lg transition ${
        isOver ? 'ring-2 ring-primary/40' : ''
      }`}
    >
      {margin > 0 && (
        <div
          style={{ inset: margin }}
          // `pdf-ignore`: a purely editor-side guide, excluded when
          // rendering the PDF preview (see utils/pdfExport.js).
          className="pdf-ignore pointer-events-none absolute rounded-sm border border-dashed border-slate-200"
        />
      )}

      {blocks.length === 0 && (
        <div className="pdf-ignore absolute inset-8 flex items-center justify-center rounded-lg border-2 border-dashed border-slate-200 text-sm text-slate-400">
          Drag a block here to get started
        </div>
      )}

      {blocks.map((block) => (
        <FreeBlock
          key={block.id}
          block={block}
          isSelected={selectedIds.includes(block.id)}
          isOnlySelected={selectedIds.length === 1 && selectedIds[0] === block.id}
          selectedBlockId={selectedBlockId}
          margin={margin}
          siblings={blocks.filter((b) => b.id !== block.id && typeof b.x === 'number')}
          globalStyle={globalStyle}
          onSelect={selectBlock}
          onRemove={removeBlock}
          onAddNestedItem={addNestedItem}
          onChangeGeometry={(geometry) => updateBlock(block.id, geometry)}
        />
      ))}
    </div>
  )
}

export default function Canvas() {
  const { blocks, globalStyle, pageCount, addPage, removeLastPage } = useBuilder()
  const margin = globalStyle.margin ?? 0

  return (
    // `justify-start` (not `justify-center`): once enough pages overflow the
    // viewport's width, centering an overflowing flex row makes the start of
    // the content land in negative scroll territory that most browsers
    // don't let you scroll back into — page 1 (and everything on it) would
    // become unreachable. Left-aligning keeps every page reachable by
    // scrolling right, however many there are.
    <div className="flex flex-1 items-start justify-start gap-6 overflow-auto bg-slate-100 p-8">
      {Array.from({ length: pageCount }).map((_, pageIndex) => (
        <div key={pageIndex} className="flex flex-col items-center gap-2">
          <Page
            pageIndex={pageIndex}
            blocks={blocks.filter((b) => (b.page ?? 0) === pageIndex)}
            margin={margin}
            globalStyle={globalStyle}
          />
          <span className="text-xs text-slate-400">Page {pageIndex + 1}</span>
        </div>
      ))}

      <div className="flex h-[1123px] flex-col items-center justify-center gap-2">
        <button
          type="button"
          onClick={addPage}
          title="Add page"
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-primary hover:text-primary"
        >
          <Plus size={18} />
        </button>
        {pageCount > 1 && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Remove page ${pageCount}? Any blocks on it will be deleted.`)) {
                removeLastPage()
              }
            }}
            title="Remove last page"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition hover:text-red-500"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
