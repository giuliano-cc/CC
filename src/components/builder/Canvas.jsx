import { useDroppable } from '@dnd-kit/core'
import { useState } from 'react'
import { Eye, EyeOff, Grid3x3, Minus, Plus, Ratio, X } from 'lucide-react'
import { useBuilder } from '../../context/BuilderContext'
import {
  goldenRatioLines,
  GRID_OFFSET_X,
  GRID_OFFSET_Y,
  GRID_SIZE,
  resolveMargins,
  SHEET_HEIGHT,
  SHEET_WIDTH,
} from '../../utils/layout'
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

function Page({ pageIndex, blocks, margins, globalStyle, showGrid, showGoldenRatio, preview, zoom }) {
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
  // Smart alignment guides: while a block is being dragged/resized on this
  // page, FreeBlock reports back which lines it just snapped to (another
  // block's edge/center, the margin, or the page's own center) so they can
  // be drawn as thin lines spanning the whole page — otherwise a snap is
  // silent and easy to miss, especially against the page center, which
  // isn't marked by anything else on the sheet.
  const [guides, setGuides] = useState(null)

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
        fontFamily: globalStyle.bodyFontFamily || globalStyle.fontFamily,
        color: globalStyle.textColor,
        backgroundColor: globalStyle.pageBackground || '#ffffff',
      }}
      // `z-0`: without an explicit z-index, `relative` alone doesn't
      // establish a new stacking context, so a block with a negative
      // z-index (a background Shape sent behind its siblings — see
      // BuilderContext's addBlock/sendToBack) would resolve that z-index
      // against some ancestor far above this page instead of just its own
      // siblings, and disappear behind unrelated things instead of just
      // the page's own background.
      className={`relative z-0 shrink-0 overflow-hidden rounded-sm shadow-lg transition ${
        isOver ? 'ring-2 ring-primary/40' : ''
      }`}
    >
      {!preview && showGrid && (
        <div
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(15, 23, 42, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(15, 23, 42, 0.08) 1px, transparent 1px)',
            backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
            backgroundPosition: `${GRID_OFFSET_X}px ${GRID_OFFSET_Y}px`,
          }}
          // A purely editor-side alignment aid — printing/exporting builds
          // its own separate tree (see components/builder/PrintDocument.jsx)
          // that never includes this at all, so `pdf-ignore` is vestigial,
          // kept only in case anything else still reads it.
          className="pdf-ignore pointer-events-none absolute inset-0"
        />
      )}

      {!preview && (margins.top > 0 || margins.right > 0 || margins.bottom > 0 || margins.left > 0) && (
        <div
          style={{ top: margins.top, right: margins.right, bottom: margins.bottom, left: margins.left }}
          // A purely editor-side guide (see the note on `pdf-ignore` just
          // above). Magenta (rather than the grid's neutral gray) so the
          // margin — the one guide that actually constrains where content
          // is meant to sit — reads as distinct from the grid/alignment
          // guides at a glance.
          className="pdf-ignore pointer-events-none absolute rounded-sm border border-dashed border-fuchsia-500"
        />
      )}

      {!preview &&
        showGoldenRatio &&
        goldenRatioLines(SHEET_WIDTH).map((x) => (
          <div
            key={`phi-v-${x}`}
            style={{ left: x }}
            className="pdf-ignore pointer-events-none absolute inset-y-0 z-10 w-px border-l border-dashed border-amber-500"
          />
        ))}
      {!preview &&
        showGoldenRatio &&
        goldenRatioLines(SHEET_HEIGHT).map((y) => (
          <div
            key={`phi-h-${y}`}
            style={{ top: y }}
            className="pdf-ignore pointer-events-none absolute inset-x-0 z-10 h-px border-t border-dashed border-amber-500"
          />
        ))}

      {!preview && blocks.length === 0 && (
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
          margins={margins}
          siblings={blocks.filter((b) => b.id !== block.id && typeof b.x === 'number')}
          globalStyle={globalStyle}
          snapToGrid={showGrid}
          snapToGoldenRatio={showGoldenRatio}
          zoom={zoom}
          preview={preview}
          onGuides={setGuides}
          onSelect={selectBlock}
          onRemove={removeBlock}
          onAddNestedItem={addNestedItem}
          onChangeGeometry={(geometry) => updateBlock(block.id, geometry)}
        />
      ))}

      {guides?.vLines.map((x) => (
        <div
          key={`v-${x}`}
          style={{ left: x }}
          className="pdf-ignore pointer-events-none absolute inset-y-0 z-30 w-px bg-primary"
        />
      ))}
      {guides?.hLines.map((y) => (
        <div
          key={`h-${y}`}
          style={{ top: y }}
          className="pdf-ignore pointer-events-none absolute inset-x-0 z-30 h-px bg-primary"
        />
      ))}
    </div>
  )
}

const ZOOM_MIN = 0.4
const ZOOM_MAX = 1.5
const ZOOM_STEP = 0.1

export default function Canvas() {
  const { blocks, globalStyle, selectBlock, pageCount, addPage, removeLastPage } = useBuilder()
  const margins = resolveMargins(globalStyle)
  const [showGrid, setShowGrid] = useState(false)
  const [showGoldenRatio, setShowGoldenRatio] = useState(false)
  const [preview, setPreview] = useState(false)
  const [zoom, setZoom] = useState(1)

  function togglePreview() {
    setPreview((v) => !v)
    // Nothing is selectable in preview anyway — clearing the selection
    // when entering it keeps the Properties panel from showing a stale
    // block that no longer has a visible outline to go with it.
    selectBlock(null)
  }

  return (
    // `justify-start` (not `justify-center`): once enough pages overflow the
    // viewport's width, centering an overflowing flex row makes the start of
    // the content land in negative scroll territory that most browsers
    // don't let you scroll back into — page 1 (and everything on it) would
    // become unreachable. Left-aligning keeps every page reachable by
    // scrolling right, however many there are.
    <div className="relative flex flex-1 items-start justify-start gap-6 overflow-auto bg-slate-100 p-8">
      <div className="sticky left-8 top-8 z-20 -mr-9 -mb-9 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={togglePreview}
          title={preview ? 'Exit preview' : 'Preview: hide every editor guide, exactly like the printed page'}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border shadow-sm transition ${
            preview
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-slate-200 bg-white text-slate-500 hover:border-primary hover:text-primary'
          }`}
        >
          {preview ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        <button
          type="button"
          onClick={() => setShowGrid((v) => !v)}
          disabled={preview}
          title={showGrid ? 'Hide alignment grid' : 'Show alignment grid'}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border shadow-sm transition disabled:cursor-not-allowed disabled:opacity-30 ${
            showGrid
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-slate-200 bg-white text-slate-500 hover:border-primary hover:text-primary'
          }`}
        >
          <Grid3x3 size={16} />
        </button>
        <button
          type="button"
          onClick={() => setShowGoldenRatio((v) => !v)}
          disabled={preview}
          title={showGoldenRatio ? 'Hide golden ratio guide' : 'Show golden ratio guide'}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border shadow-sm transition disabled:cursor-not-allowed disabled:opacity-30 ${
            showGoldenRatio
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-slate-200 bg-white text-slate-500 hover:border-primary hover:text-primary'
          }`}
        >
          <Ratio size={16} />
        </button>
        <div className="flex flex-col items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 100) / 100))}
            disabled={zoom >= ZOOM_MAX}
            title="Zoom in"
            className="flex h-7 w-7 items-center justify-center rounded text-slate-500 transition hover:bg-slate-100 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Plus size={14} />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            title="Reset zoom to 100%"
            className="w-full rounded px-1 py-0.5 text-center text-[10px] font-medium text-slate-500 hover:bg-slate-100 hover:text-primary"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 100) / 100))}
            disabled={zoom <= ZOOM_MIN}
            title="Zoom out"
            className="flex h-7 w-7 items-center justify-center rounded text-slate-500 transition hover:bg-slate-100 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Minus size={14} />
          </button>
        </div>
      </div>
      {Array.from({ length: pageCount }).map((_, pageIndex) => (
        <div key={pageIndex} className="flex flex-col items-center gap-2">
          <div style={{ width: SHEET_WIDTH * zoom, height: SHEET_HEIGHT * zoom }}>
            <div style={{ width: SHEET_WIDTH, height: SHEET_HEIGHT, transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
              <Page
                pageIndex={pageIndex}
                blocks={blocks.filter((b) => (b.page ?? 0) === pageIndex)}
                margins={margins}
                globalStyle={globalStyle}
                showGrid={showGrid}
                showGoldenRatio={showGoldenRatio}
                preview={preview}
                zoom={zoom}
              />
            </div>
          </div>
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
