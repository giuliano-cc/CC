import { BLOCK_TYPES, DEFAULT_BLOCK_SIZE } from './blockTypes'

export const SHEET_WIDTH = 794
export const SHEET_HEIGHT = 1123
export const SHEET_PADDING = 48
export const CONTENT_WIDTH = SHEET_WIDTH - SHEET_PADDING * 2

// Shared between the visual grid overlay (Canvas.jsx) and drag/resize
// snapping (FreeBlock.jsx), so a block actually snaps to the same lines
// the grid draws. The grid lives entirely inside the margins (like the
// golden ratio and column/row guides) rather than the whole page, and the
// content box's dimensions aren't exact multiples of GRID_SIZE, so the
// pattern is centered within that box rather than flush at its top-left
// corner.
export const GRID_SIZE = 20
function centeredGridOffset(size) {
  return ((size % GRID_SIZE) / 2 + GRID_SIZE) % GRID_SIZE
}

// `local.x`/`local.y`: the pattern's own centering offset (0..GRID_SIZE-1),
// relative to the margin box's own top-left corner — for the overlay
// div's CSS `background-position`, which is relative to that div's own
// box, not the page's.
// `x`/`y`: the same centering offset translated into absolute page
// coordinates (margins.left/top + the local offset) — for
// nearestGridLine, which snaps a block's page-space position.
export function resolveGridOffsets(margins) {
  const contentWidth = SHEET_WIDTH - margins.left - margins.right
  const contentHeight = SHEET_HEIGHT - margins.top - margins.bottom
  const localX = centeredGridOffset(contentWidth)
  const localY = centeredGridOffset(contentHeight)
  return {
    local: { x: localX, y: localY },
    x: margins.left + localX,
    y: margins.top + localY,
  }
}

// Shared between the golden ratio guide overlay (Canvas.jsx) and drag/
// resize snapping (FreeBlock.jsx), so a block actually snaps to the same
// lines the guide draws — the classic "golden ratio" composition guide
// (the same overlay Photoshop/Lightroom offer as "Golden Ratio" cropping):
// two lines per axis, at ~38.2%/~61.8% of the space between the margins
// (not the whole page — same as the column/row grid) instead of plain
// thirds. These are always the exact mathematical split — never moved by
// an offset — so they stay a fixed reference (see
// goldenRatioOffsetLinesX/Y below for the adjustable duplicate lines
// measured from them).
const PHI = (1 + Math.sqrt(5)) / 2

export function goldenRatioLinesX(margins) {
  const width = SHEET_WIDTH - margins.left - margins.right
  const a = width / PHI
  return { sx: margins.left + (width - a), dx: margins.left + a }
}

export function goldenRatioLinesY(margins) {
  const height = SHEET_HEIGHT - margins.top - margins.bottom
  const a = height / PHI
  return { top: margins.top + (height - a), bottom: margins.top + a }
}

// A symmetric pair of lines duplicated from each exact golden ratio line
// above, one on each side of it at the user-chosen distance — not a
// replacement for the exact line, two additional ones to snap a block's
// margin against (typing 20 for "sx" means "20px on either side of that
// line", so a block can leave that gap approaching from the left or the
// right). The exact line stays put as the fixed reference either way. A
// line whose offset is 0 has no pair at all (both would sit exactly on
// top of the reference line), so it comes back `null` — callers skip
// drawing/snapping to it.
export function goldenRatioOffsetLinesX(margins, offsets) {
  const { sx, dx } = goldenRatioLinesX(margins)
  return {
    sx: offsets.sx ? [sx - offsets.sx, sx + offsets.sx] : null,
    dx: offsets.dx ? [dx - offsets.dx, dx + offsets.dx] : null,
  }
}

export function goldenRatioOffsetLinesY(margins, offsets) {
  const { top, bottom } = goldenRatioLinesY(margins)
  return {
    top: offsets.top ? [top - offsets.top, top + offsets.top] : null,
    bottom: offsets.bottom ? [bottom - offsets.bottom, bottom + offsets.bottom] : null,
  }
}

// A template's own per-line margin from the golden ratio guide — 0 (no
// duplicate line at all) unless the user has typed a value in Global
// Style. Same fallback pattern as resolveMargins below.
export function resolveGoldenRatioOffsets(globalStyle) {
  return {
    sx: globalStyle.goldenOffsetSx ?? 0,
    dx: globalStyle.goldenOffsetDx ?? 0,
    top: globalStyle.goldenOffsetTop ?? 0,
    bottom: globalStyle.goldenOffsetBottom ?? 0,
  }
}

// The grid line nearest to `value` along one axis (pass resolveGridOffsets's
// `.x`/`.y` as `offset`).
export function nearestGridLine(value, offset) {
  return Math.round((value - offset) / GRID_SIZE) * GRID_SIZE + offset
}

// The classic print-design "structure grid" (see
// https://visme.co/blog/layout-design/): `columns` × `rows` equal-size
// cells filling the space between the margins, separated by `gutter` px
// of empty space on both axes — the same modular grid a real layout
// tool's column/row guide gives you. Purely a visual/snap guide, same
// family as the grid/margin/golden ratio guides.
export function resolveStructureGrid(globalStyle) {
  return {
    columns: Math.max(1, globalStyle.structureColumns ?? 1),
    rows: Math.max(1, globalStyle.structureRows ?? 1),
    gutter: globalStyle.structureGutter ?? 24,
  }
}

// The vertical line at each column's left and right edge — `columns`
// equal-width columns filling the space between the left/right margins,
// separated by `gutter` px of empty space. A single column (the default)
// has no internal dividers to draw, so this returns nothing until the
// user actually asks for more than one.
export function structureColumnLines(margins, columns, gutter) {
  if (columns <= 1) return []
  const contentWidth = SHEET_WIDTH - margins.left - margins.right
  const columnWidth = (contentWidth - gutter * (columns - 1)) / columns
  const lines = []
  for (let i = 0; i < columns; i++) {
    const left = margins.left + i * (columnWidth + gutter)
    lines.push(left, left + columnWidth)
  }
  return lines
}

// The horizontal line at each row's top and bottom edge — same idea as
// structureColumnLines above, along the vertical axis between the top/
// bottom margins.
export function structureRowLines(margins, rows, gutter) {
  if (rows <= 1) return []
  const contentHeight = SHEET_HEIGHT - margins.top - margins.bottom
  const rowHeight = (contentHeight - gutter * (rows - 1)) / rows
  const lines = []
  for (let i = 0; i < rows; i++) {
    const top = margins.top + i * (rowHeight + gutter)
    lines.push(top, top + rowHeight)
  }
  return lines
}

// The baseline rhythm line nearest to `value`, anchored at the top
// margin (row 0 of the grid) rather than the page's own top edge.
export function nearestBaselineLine(value, margins, unit) {
  return Math.round((value - margins.top) / unit) * unit + margins.top
}

function estimateHeight(block) {
  if (block.type === BLOCK_TYPES.COLUMNS) {
    const maxItems = Math.max(1, ...block.columns.map((c) => c.items.length))
    return Math.max(220, maxItems * 70 + 40)
  }
  return DEFAULT_BLOCK_SIZE[block.type]?.height ?? 80
}

// Legacy templates (created before the free canvas was introduced) don't
// have x/y/width/height: this function assigns them a full-width, vertically
// stacked position, equivalent to the old "flow" behavior. From there on the
// user can freely move/resize each block. Each page stacks independently.
export function seedFreeLayout(blocks) {
  const cursorYByPage = {}
  return blocks.map((block, index) => {
    const page = block.page ?? 0
    if (typeof block.x === 'number' && typeof block.y === 'number') {
      return block.page === undefined ? { ...block, page } : block
    }
    const cursorY = cursorYByPage[page] ?? SHEET_PADDING
    const height = estimateHeight(block)
    const positioned = {
      ...block,
      page,
      x: SHEET_PADDING,
      y: cursorY,
      width: CONTENT_WIDTH,
      height,
      zIndex: index + 1,
    }
    cursorYByPage[page] = cursorY + height + 16
    return positioned
  })
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

// The page margin used to be a single value applied to all four sides
// (`globalStyle.margin`); per-side overrides (`marginTop`/Right/Bottom/
// Left) are optional on top of that, so an existing template with only
// the old single value keeps working unchanged, and only the sides
// someone actually customizes need their own field.
export function resolveMargins(globalStyle) {
  const base = globalStyle.margin ?? 0
  return {
    top: globalStyle.marginTop ?? base,
    right: globalStyle.marginRight ?? base,
    bottom: globalStyle.marginBottom ?? base,
    left: globalStyle.marginLeft ?? base,
  }
}
