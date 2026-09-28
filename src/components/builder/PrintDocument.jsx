import { createPortal } from 'react-dom'
import { EDGE_TO_EDGE_TYPES } from '../../utils/blockTypes'
import { seedFreeLayout } from '../../utils/layout'
import BlockRenderer from './BlockRenderer'

// Renders the template for printing/"Save as PDF" — portaled into
// #print-root (see index.html/index.css), a sibling of the app root that
// `@media print` shows instead of the builder UI. Every block is drawn by
// the exact same BlockRenderer + CSS that already renders it on screen
// (mirroring FreeBlock.jsx's own wrapper — same padding/border, so a
// block's content sits exactly where it does while editing), so the
// browser's print pagination is laying out the real DOM, not a
// re-interpretation of it — this is what actually guarantees the printed
// PDF matches the canvas, which a hand-written PDF renderer (comparing
// its own text-wrapping/metrics against the browser's) never fully can.
export default function PrintDocument({ blocks, globalStyle, pageCount }) {
  const printRoot = typeof document !== 'undefined' ? document.getElementById('print-root') : null
  if (!printRoot) return null

  const positionedBlocks = seedFreeLayout(blocks)

  return createPortal(
    Array.from({ length: pageCount }).map((_, pageIndex) => (
      <div
        key={pageIndex}
        className="print-page"
        style={{
          background: globalStyle.pageBackground || '#ffffff',
          fontFamily: globalStyle.bodyFontFamily || globalStyle.fontFamily,
          color: globalStyle.textColor,
        }}
      >
        {positionedBlocks
          .filter((block) => (block.page ?? 0) === pageIndex)
          .map((block) => (
            <div
              key={block.id}
              style={{
                position: 'absolute',
                left: block.x,
                top: block.y,
                width: block.width,
                height: block.height,
                zIndex: block.zIndex || 1,
              }}
            >
              {/* Same box model as FreeBlock's content wrapper (border +
                  padding, and the same `overflow-hidden`), minus the
                  interactive-only bits (cursor, hover/selection ring) —
                  a block too small for its content is cropped at its own
                  edge here exactly like it is on screen, instead of
                  spilling into whatever sits after it on the page. No
                  padding for EDGE_TO_EDGE_TYPES, same as on screen. */}
              <div
                className={`h-full w-full overflow-hidden rounded-md border border-transparent ${
                  EDGE_TO_EDGE_TYPES.includes(block.type) ? '' : 'p-2'
                }`}
              >
                <BlockRenderer block={block} globalStyle={globalStyle} />
              </div>
            </div>
          ))}
      </div>
    )),
    printRoot,
  )
}
