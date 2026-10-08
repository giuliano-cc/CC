import { useDroppable } from '@dnd-kit/core'
import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Grid3x3,
  LayoutTemplate,
  Minus,
  Plus,
  Proportions,
  Ratio,
  X,
} from 'lucide-react'
import { useBuilder } from '../../context/BuilderContext'
import {
  a4ConstructionGeometry,
  goldenRatioLinesX,
  goldenRatioLinesY,
  goldenRatioOffsetLinesX,
  goldenRatioOffsetLinesY,
  GRID_SIZE,
  pageBackgroundStyle,
  resolveGoldenRatioOffsets,
  resolveGridOffsets,
  resolveMargins,
  resolveStructureGrid,
  SHEET_HEIGHT,
  SHEET_WIDTH,
  structureColumnLines,
  structureRowLines,
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

function Page({
  pageIndex,
  blocks,
  margins,
  gridOffsets,
  globalStyle,
  showGrid,
  showGoldenRatio,
  goldenOffsets,
  showA4Ratio,
  showStructureGrid,
  structureGrid,
  preview,
  zoom,
}) {
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
        ...pageBackgroundStyle(globalStyle),
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
            top: margins.top,
            right: margins.right,
            bottom: margins.bottom,
            left: margins.left,
            backgroundImage:
              'linear-gradient(to right, rgba(15, 23, 42, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(15, 23, 42, 0.08) 1px, transparent 1px)',
            backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
            backgroundPosition: `${gridOffsets.local.x}px ${gridOffsets.local.y}px`,
          }}
          // A purely editor-side alignment aid, confined to the margin box
          // like the golden ratio/column/row guides — printing/exporting
          // builds its own separate tree (see
          // components/builder/PrintDocument.jsx) that never includes this
          // at all, so `pdf-ignore` is vestigial, kept only in case
          // anything else still reads it.
          className="pdf-ignore pointer-events-none absolute"
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

      {/* Golden ratio guide, entirely inside the margins on both axes
          (position AND extent — a line only runs from the top margin to
          the bottom margin/left margin to the right margin, not edge to
          edge of the page). */}
      {!preview &&
        showGoldenRatio &&
        Object.values(goldenRatioLinesX(margins)).map((x, i) => (
          <div
            key={`phi-v-${i}`}
            style={{ left: x, top: margins.top, bottom: margins.bottom }}
            className="pdf-ignore pointer-events-none absolute z-10 w-px border-l border-dashed border-amber-500"
          />
        ))}
      {!preview &&
        showGoldenRatio &&
        Object.values(goldenRatioLinesY(margins)).map((y, i) => (
          <div
            key={`phi-h-${i}`}
            style={{ top: y, left: margins.left, right: margins.right }}
            className="pdf-ignore pointer-events-none absolute z-10 h-px border-t border-dashed border-amber-500"
          />
        ))}

      {/* The user's own duplicate pair, offset a chosen distance to
          either side of the exact golden ratio line above — solid (not
          dashed) so it reads as "your margin", not the mathematical
          reference — drawn only for an axis side that actually has a
          non-zero offset (each side then draws 2 lines, one on each side
          of the reference). */}
      {!preview &&
        showGoldenRatio &&
        Object.entries(goldenRatioOffsetLinesX(margins, goldenOffsets))
          .filter(([, pair]) => pair !== null)
          .flatMap(([side, pair]) => pair.map((x, i) => ({ key: `${side}-${i}`, x })))
          .map(({ key, x }) => (
            <div
              key={`phi-offset-v-${key}`}
              style={{ left: x, top: margins.top, bottom: margins.bottom }}
              className="pdf-ignore pointer-events-none absolute z-10 w-px border-l-2 border-amber-500"
            />
          ))}
      {!preview &&
        showGoldenRatio &&
        Object.entries(goldenRatioOffsetLinesY(margins, goldenOffsets))
          .filter(([, pair]) => pair !== null)
          .flatMap(([side, pair]) => pair.map((y, i) => ({ key: `${side}-${i}`, y })))
          .map(({ key, y }) => (
            <div
              key={`phi-offset-h-${key}`}
              style={{ top: y, left: margins.left, right: margins.right }}
              className="pdf-ignore pointer-events-none absolute z-10 h-px border-t-2 border-amber-500"
            />
          ))}

      {/* A4 ratio guide: the classic square + diagonal + swung-arc
          construction behind the 1:√2 ratio (the ratio the page itself
          already is), not just a split line like the golden ratio guide
          above — an SVG overlay, since CSS borders can't draw the arc.
          Clipped to the page by the page's own overflow-hidden, same as
          every other guide here. */}
      {!preview &&
        showA4Ratio &&
        (() => {
          const { square, diagonal, arcCenter, landingPoint } = a4ConstructionGeometry(margins)
          return (
            <svg
              className="pdf-ignore pointer-events-none absolute inset-0 z-10"
              width={SHEET_WIDTH}
              height={SHEET_HEIGHT}
              viewBox={`0 0 ${SHEET_WIDTH} ${SHEET_HEIGHT}`}
            >
              <rect
                x={square.x}
                y={square.y}
                width={square.size}
                height={square.size}
                fill="none"
                stroke="rgb(14 165 233)"
                strokeWidth="1"
              />
              <line
                x1={diagonal.x1}
                y1={diagonal.y1}
                x2={diagonal.x2}
                y2={diagonal.y2}
                stroke="rgb(14 165 233)"
                strokeWidth="1.5"
              />
              <path
                d={`M ${diagonal.x1} ${diagonal.y1} A ${square.size * Math.SQRT2} ${square.size * Math.SQRT2} 0 0 1 ${landingPoint.x} ${landingPoint.y}`}
                fill="none"
                stroke="rgb(14 165 233)"
                strokeWidth="1"
                strokeDasharray="4 3"
              />
              <line
                x1={arcCenter.x}
                y1={arcCenter.y}
                x2={landingPoint.x}
                y2={landingPoint.y}
                stroke="rgb(14 165 233)"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            </svg>
          )
        })()}

      {/* Column × row "structure grid" (see utils/layout.js) — a
          separate teal color from the grid/margin/golden-ratio guides so
          all four stay visually distinct when several are on at once.
          Entirely inside the margins, on both axes (position AND
          extent — a column line only runs top-margin to bottom-margin,
          not edge to edge of the page). */}
      {!preview &&
        showStructureGrid &&
        structureColumnLines(margins, structureGrid.columns, structureGrid.gutter).map((x, i) => (
          <div
            key={`structure-v-${i}`}
            style={{ left: x, top: margins.top, bottom: margins.bottom }}
            className="pdf-ignore pointer-events-none absolute z-10 w-px border-l border-dashed border-teal-500/70"
          />
        ))}
      {!preview &&
        showStructureGrid &&
        structureRowLines(margins, structureGrid.rows, structureGrid.gutter).map((y, i) => (
          <div
            key={`structure-h-${i}`}
            style={{ top: y, left: margins.left, right: margins.right }}
            className="pdf-ignore pointer-events-none absolute z-10 h-px border-t border-dashed border-teal-500/70"
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
          gridOffsets={gridOffsets}
          snapToGoldenRatio={showGoldenRatio}
          goldenOffsets={goldenOffsets}
          snapToA4Ratio={showA4Ratio}
          snapToStructureGrid={showStructureGrid}
          structureGrid={structureGrid}
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
  const { blocks, globalStyle, selectBlock, pageCount, addPage, removeLastPage, duplicatePage, movePage } = useBuilder()
  const margins = resolveMargins(globalStyle)
  const gridOffsets = resolveGridOffsets(margins)
  const goldenOffsets = resolveGoldenRatioOffsets(globalStyle)
  const structureGrid = resolveStructureGrid(globalStyle)
  const [showGrid, setShowGrid] = useState(false)
  const [showGoldenRatio, setShowGoldenRatio] = useState(false)
  const [showA4Ratio, setShowA4Ratio] = useState(false)
  const [showStructureGrid, setShowStructureGrid] = useState(false)
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
    <div className="relative flex flex-1 items-start justify-start gap-12 overflow-auto bg-slate-100 p-8">
      <div className="sticky left-8 top-8 z-20 flex w-11 shrink-0 flex-col gap-1.5">
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
        <button
          type="button"
          onClick={() => setShowA4Ratio((v) => !v)}
          disabled={preview}
          title={showA4Ratio ? 'Hide A4 ratio guide (1:1.414)' : 'Show A4 ratio guide (1:1.414)'}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border shadow-sm transition disabled:cursor-not-allowed disabled:opacity-30 ${
            showA4Ratio
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-slate-200 bg-white text-slate-500 hover:border-primary hover:text-primary'
          }`}
        >
          <Proportions size={16} />
        </button>
        <button
          type="button"
          onClick={() => setShowStructureGrid((v) => !v)}
          disabled={preview}
          title={showStructureGrid ? 'Hide column & row grid' : 'Show column & row grid'}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border shadow-sm transition disabled:cursor-not-allowed disabled:opacity-30 ${
            showStructureGrid
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-slate-200 bg-white text-slate-500 hover:border-primary hover:text-primary'
          }`}
        >
          <LayoutTemplate size={16} />
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
                gridOffsets={gridOffsets}
                globalStyle={globalStyle}
                showGrid={showGrid}
                showGoldenRatio={showGoldenRatio}
                goldenOffsets={goldenOffsets}
                showA4Ratio={showA4Ratio}
                showStructureGrid={showStructureGrid}
                structureGrid={structureGrid}
                preview={preview}
                zoom={zoom}
              />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => movePage(pageIndex, pageIndex - 1)}
              disabled={pageIndex === 0}
              title="Move page left"
              className="flex h-6 w-6 items-center justify-center rounded text-slate-400 transition hover:bg-slate-200 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs text-slate-400">Page {pageIndex + 1}</span>
            <button
              type="button"
              onClick={() => movePage(pageIndex, pageIndex + 1)}
              disabled={pageIndex === pageCount - 1}
              title="Move page right"
              className="flex h-6 w-6 items-center justify-center rounded text-slate-400 transition hover:bg-slate-200 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => duplicatePage(pageIndex)}
              title="Duplicate page"
              className="flex h-6 w-6 items-center justify-center rounded text-slate-400 transition hover:bg-slate-200 hover:text-primary"
            >
              <Copy size={13} />
            </button>
          </div>
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
