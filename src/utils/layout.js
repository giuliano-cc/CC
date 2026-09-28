import { BLOCK_TYPES, DEFAULT_BLOCK_SIZE } from './blockTypes'

export const SHEET_WIDTH = 794
export const SHEET_HEIGHT = 1123
export const SHEET_PADDING = 48
export const CONTENT_WIDTH = SHEET_WIDTH - SHEET_PADDING * 2

// Shared between the visual grid overlay (Canvas.jsx) and drag/resize
// snapping (FreeBlock.jsx), so a block actually snaps to the same lines
// the grid draws. The sheet's dimensions aren't exact multiples of
// GRID_SIZE, so the pattern is centered (see Canvas.jsx) rather than
// flush at the top-left corner — these offsets are that same centering,
// kept here once instead of duplicated.
export const GRID_SIZE = 20
export const GRID_OFFSET_X = ((SHEET_WIDTH % GRID_SIZE) / 2 + GRID_SIZE) % GRID_SIZE
export const GRID_OFFSET_Y = ((SHEET_HEIGHT % GRID_SIZE) / 2 + GRID_SIZE) % GRID_SIZE

// Shared between the golden ratio guide overlay (Canvas.jsx) and drag/
// resize snapping (FreeBlock.jsx), so a block actually snaps to the same
// lines the guide draws — the classic "golden ratio" composition guide
// (the same overlay Photoshop/Lightroom offer as "Golden Ratio" cropping):
// two lines per axis, at ~38.2%/~61.8% of the page instead of plain
// thirds. These are always the exact mathematical split — never moved by
// an offset — so they stay a fixed reference (see
// goldenRatioOffsetLinesX/Y below for the adjustable duplicate lines
// measured from them).
const PHI = (1 + Math.sqrt(5)) / 2

export function goldenRatioLinesX(width) {
  const a = width / PHI
  return { sx: width - a, dx: a }
}

export function goldenRatioLinesY(height) {
  const a = height / PHI
  return { top: height - a, bottom: a }
}

// A second line duplicated from each exact golden ratio line above, at a
// user-chosen distance from it — not a replacement for the exact line, an
// additional one to snap a block's margin against (e.g. "leave 24px
// between the photo and the golden ratio line" instead of butting it
// flush). The exact line stays put as the fixed reference either way.
// A line whose offset is 0 has no duplicate at all (it would sit exactly
// on top of the reference line, which isn't a second line), so it comes
// back `null` — callers skip drawing/snapping to it.
export function goldenRatioOffsetLinesX(width, offsets) {
  const { sx, dx } = goldenRatioLinesX(width)
  return {
    sx: offsets.sx ? sx + offsets.sx : null,
    dx: offsets.dx ? dx + offsets.dx : null,
  }
}

export function goldenRatioOffsetLinesY(height, offsets) {
  const { top, bottom } = goldenRatioLinesY(height)
  return {
    top: offsets.top ? top + offsets.top : null,
    bottom: offsets.bottom ? bottom + offsets.bottom : null,
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

// The grid line nearest to `value` along one axis (pass GRID_OFFSET_X or
// GRID_OFFSET_Y as `offset`).
export function nearestGridLine(value, offset) {
  return Math.round((value - offset) / GRID_SIZE) * GRID_SIZE + offset
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
