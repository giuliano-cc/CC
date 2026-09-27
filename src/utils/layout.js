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
