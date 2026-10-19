import { useState } from 'react'
import {
  AlignHorizontalDistributeCenter,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyStart,
  AlignVerticalDistributeCenter,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  Maximize2,
} from 'lucide-react'
import { useBuilder } from '../../../context/BuilderContext'
import { BLOCK_TYPES } from '../../../utils/blockTypes'
import { splitTextToFit } from '../../../utils/textFlow'
import { SHEET_HEIGHT, SHEET_WIDTH } from '../../../utils/layout'
import { Field, inputClasses } from './fields'

export function AlignIconButton({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-primary"
    >
      <Icon size={16} />
    </button>
  )
}

export const PAGE_ALIGN_MODES = {
  left: 'page-left',
  centerH: 'page-center-h',
  right: 'page-right',
  top: 'page-top',
  middle: 'page-middle',
  bottom: 'page-bottom',
}

export const SELECTION_ALIGN_MODES = {
  left: 'left',
  centerH: 'center-h',
  right: 'right',
  top: 'top',
  middle: 'middle',
  bottom: 'bottom',
}

// One row of align buttons: left/center/right relative to the horizontal
// axis, then top/middle/bottom relative to the vertical one. `modes` picks
// whether "center"/"page" targets the sheet or the selection's own
// bounding box (see utils/align.js).
export function AlignRow({ modes, onAlign }) {
  return (
    <div className="flex items-center gap-0.5">
      <AlignIconButton icon={AlignHorizontalJustifyStart} label="Align left" onClick={() => onAlign(modes.left)} />
      <AlignIconButton
        icon={AlignHorizontalJustifyCenter}
        label="Align center"
        onClick={() => onAlign(modes.centerH)}
      />
      <AlignIconButton icon={AlignHorizontalJustifyEnd} label="Align right" onClick={() => onAlign(modes.right)} />
      <div className="mx-1 h-5 w-px bg-slate-200" />
      <AlignIconButton icon={AlignVerticalJustifyStart} label="Align top" onClick={() => onAlign(modes.top)} />
      <AlignIconButton
        icon={AlignVerticalJustifyCenter}
        label="Align middle"
        onClick={() => onAlign(modes.middle)}
      />
      <AlignIconButton icon={AlignVerticalJustifyEnd} label="Align bottom" onClick={() => onAlign(modes.bottom)} />
    </div>
  )
}

// Alignment relative to the page (top/middle/bottom, left/center/right):
// available for any single free block, since it only needs its own
// position/size to compute.
export function PageAlignField() {
  const { alignSelection } = useBuilder()
  return (
    <Field label="Align to page">
      <AlignRow modes={PAGE_ALIGN_MODES} onAlign={alignSelection} />
    </Field>
  )
}

// Shown instead of the single-block editor when 2+ free blocks are
// selected (shift-click on the sheet to build a selection): align them to
// the page, to each other, or spread them out evenly.
export function MultiSelectPanel({ count }) {
  const { alignSelection } = useBuilder()
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-slate-800">{count} objects selected</h3>
      <p className="text-xs text-slate-500">
        Shift-click blocks on the sheet to add or remove them from the selection.
      </p>
      <Field label="Align to page">
        <AlignRow modes={PAGE_ALIGN_MODES} onAlign={alignSelection} />
      </Field>
      <Field label="Align to each other">
        <AlignRow modes={SELECTION_ALIGN_MODES} onAlign={alignSelection} />
      </Field>
      {count >= 3 && (
        <Field label="Distribute evenly">
          <div className="flex items-center gap-1">
            <AlignIconButton
              icon={AlignHorizontalDistributeCenter}
              label="Distribute horizontally"
              onClick={() => alignSelection('distribute-h')}
            />
            <AlignIconButton
              icon={AlignVerticalDistributeCenter}
              label="Distribute vertically"
              onClick={() => alignSelection('distribute-v')}
            />
          </div>
        </Field>
      )}
    </div>
  )
}

// Measures a block's own rendered content (see FreeBlock.jsx's
// data-block-content wrapper) by briefly letting the node size itself
// (`max-content`, overflow visible) instead of staying pinned to its
// current box, then reverting before the next paint — not just reading
// scrollHeight/scrollWidth, which a wrapper already bigger than its
// content would just echo back unchanged. `axis` picks which dimension(s)
// are actually measured (see fitToContent below for what each one means);
// returns `null` if the block isn't on the page (no matching node).
export function measureNaturalSize(blockId, axis = 'both') {
  const node = document.querySelector(`[data-block-content="${blockId}"]`)
  if (!node) return null
  const prevWidth = node.style.width
  const prevHeight = node.style.height
  const prevOverflow = node.style.overflow
  if (axis !== 'height') node.style.width = 'max-content'
  if (axis !== 'width') node.style.height = 'max-content'
  node.style.overflow = 'visible'
  const rect = node.getBoundingClientRect()
  const naturalWidth = rect.width
  const naturalHeight = rect.height
  node.style.width = prevWidth
  node.style.height = prevHeight
  node.style.overflow = prevOverflow
  return { naturalWidth, naturalHeight }
}

export function PositionSizeFields({ block, onChange }) {
  const { sendToBack, bringToFront } = useBuilder()
  if (typeof block.x !== 'number') return null

  // `axis` picks which dimension(s) actually change:
  //  - 'height': keeps the current width (so text reflows exactly as
  //    already shown) and measures how tall that makes it — for a
  //    fixed-width paragraph/column where only the height should shrink
  //    or grow to stop clipping or leaving empty space below the text.
  //  - 'width': keeps the current height and measures the content's
  //    intrinsic (unwrapped) width — for a short line/title that's
  //    sitting in a box wider or narrower than the text actually needs.
  //  - 'both' (default): measures both at once, letting the box shrink-
  //    wrap the text exactly on all four sides.
  // Both edges stay anchored at the block's own x/y — nothing here moves
  // the block, only its width/height, so which corner it grows/shrinks
  // from is whatever the block's own top-left position already is. Unlike
  // measureNaturalSize alone, this also *shrinks* an oversized block, not
  // just grows one.
  function fitToContent(axis = 'both') {
    const measured = measureNaturalSize(block.id, axis)
    if (!measured) return
    const { naturalWidth, naturalHeight } = measured
    const patch = {}
    if (axis !== 'height' && naturalWidth) {
      patch.width = Math.min(SHEET_WIDTH, Math.max(20, Math.ceil(naturalWidth)))
    }
    if (axis !== 'width' && naturalHeight) {
      patch.height = Math.min(SHEET_HEIGHT, Math.max(20, Math.ceil(naturalHeight)))
    }
    if (Object.keys(patch).length > 0) onChange(patch)
  }

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
      <PageAlignField />
      <div className="grid grid-cols-2 gap-3">
        <Field label="X (px)">
          <input
            type="number"
            value={Math.round(block.x)}
            onChange={(e) => onChange({ x: Number(e.target.value) })}
            className={inputClasses}
          />
        </Field>
        <Field label="Y (px)">
          <input
            type="number"
            value={Math.round(block.y)}
            onChange={(e) => onChange({ y: Number(e.target.value) })}
            className={inputClasses}
          />
        </Field>
        <Field label="Width (px)">
          <input
            type="number"
            min={20}
            max={SHEET_WIDTH}
            value={Math.round(block.width)}
            onChange={(e) => onChange({ width: Number(e.target.value) })}
            className={inputClasses}
          />
        </Field>
        <Field label="Height (px)">
          <input
            type="number"
            min={20}
            max={SHEET_HEIGHT}
            value={Math.round(block.height)}
            onChange={(e) => onChange({ height: Number(e.target.value) })}
            className={inputClasses}
          />
        </Field>
      </div>
      <Field label="Fit to content">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => fitToContent('width')}
            title="Resize width only, keeping the current height"
            className="flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary hover:text-primary"
          >
            <Maximize2 size={12} />
            Width
          </button>
          <button
            type="button"
            onClick={() => fitToContent('height')}
            title="Resize height only, keeping the current width"
            className="flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary hover:text-primary"
          >
            <Maximize2 size={12} />
            Height
          </button>
          <button
            type="button"
            onClick={() => fitToContent('both')}
            title="Resize both width and height exactly to the content"
            className="flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary hover:text-primary"
          >
            <Maximize2 size={12} />
            Both
          </button>
        </div>
      </Field>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => sendToBack(block.id)}
          title="Move behind every other block on this page"
          className="flex-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary hover:text-primary"
        >
          Send to back
        </button>
        <button
          type="button"
          onClick={() => bringToFront(block.id)}
          title="Move in front of every other block on this page"
          className="flex-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary hover:text-primary"
        >
          Bring to front
        </button>
      </div>
      <label className="flex items-center gap-1.5 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={!!block.locked}
          onChange={(e) => {
            const locked = e.target.checked
            onChange({ locked })
            // A background only stays a background if it's actually
            // behind everything else the moment it's locked — otherwise
            // "lock" would just freeze it wherever it happened to be in
            // the stacking order, which (for an image dropped in after
            // its surrounding content) is usually on top.
            if (locked) sendToBack(block.id)
          }}
        />
        Lock as background (behind new blocks, can't be dragged/resized)
      </label>
      <label className="flex items-center gap-1.5 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={!!block.repeatAcrossPages}
          onChange={(e) => onChange({ repeatAcrossPages: e.target.checked })}
        />
        Repeat on every page (same content and position, e.g. a header or footer)
      </label>
    </div>
  )
}

// Threaded text / autoflow: a manual action, not a live-recomputing layout
// engine (see utils/textFlow.js) — click it, and whatever doesn't fit this
// block's current box gets cut off and pushed into another Text block
// (freshly created the first time, or the same one again on a later
// click, so editing the source and re-flowing is a two-click loop rather
// than needing a brand new target every time). Only offered for a plain
// paragraph Text block (no title, no list, no library binding) — the one
// case that actually renders as the single flat <p> this measures.
export function TextFlowField({ block, onChange }) {
  const { blocks, addBlock, updateBlock, selectBlock, pageCount, addPage } = useBuilder()
  const [message, setMessage] = useState('')
  const linkedBlock = block.flowTargetId ? blocks.find((b) => b.id === block.flowTargetId) : null

  function handleFlow() {
    const node = document.querySelector(`[data-block-content="${block.id}"]`)
    if (!node) return
    const result = splitTextToFit(block.content || '', node)
    if (!result) {
      setMessage("This text already fits — there's nothing to flow.")
      return
    }
    setMessage('')

    if (linkedBlock) {
      onChange({ content: result.fits })
      updateBlock(linkedBlock.id, { content: result.remainder })
      return
    }

    let targetPage = (block.page ?? 0) + 1
    if (targetPage >= pageCount) {
      addPage()
    }
    const created = addBlock(BLOCK_TYPES.TEXT, { x: block.x, y: block.y }, targetPage, {
      content: result.remainder,
    })
    // Applied after addBlock (which re-matches a fresh block's style to
    // whatever else is already on that page — see matchNewBlockToSiblings)
    // so the continuation reliably mirrors THIS block, not an unrelated
    // sibling it happened to land next to.
    updateBlock(created.id, {
      width: block.width,
      height: block.height,
      fontFamily: block.fontFamily,
      fontSize: block.fontSize,
      lineHeight: block.lineHeight,
      letterSpacing: block.letterSpacing,
      bold: block.bold,
      italic: block.italic,
      color: block.color,
      textTransform: block.textTransform,
      align: block.align,
    })
    onChange({ content: result.fits, flowTargetId: created.id })
    // addBlock leaves the freshly created continuation selected — jump
    // back to the source block so its own panel (with the "Flows into"
    // indicator) is what's showing right after the action that made it.
    selectBlock(block.id)
  }

  function handleUnlink() {
    onChange({ flowTargetId: null })
    setMessage('')
  }

  return (
    <Field label="Text flow (autoflow)">
      <div className="flex flex-col gap-1.5">
        {linkedBlock && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Flows into another block.</span>
            <button
              type="button"
              onClick={() => selectBlock(linkedBlock.id)}
              className="font-medium text-primary hover:underline"
            >
              Select it
            </button>
            <button type="button" onClick={handleUnlink} className="text-red-500 hover:underline">
              Unlink
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={handleFlow}
          className="self-start rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary hover:text-primary"
        >
          {linkedBlock ? 'Re-flow overflow' : 'Flow overflow to new block'}
        </button>
        {message && <p className="text-xs text-slate-400">{message}</p>}
      </div>
    </Field>
  )
}
