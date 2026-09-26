import { BLOCK_TYPES, DEFAULT_BLOCK_SIZE } from './blockTypes'

export const SHEET_WIDTH = 794
export const SHEET_HEIGHT = 1123
export const SHEET_PADDING = 48
export const CONTENT_WIDTH = SHEET_WIDTH - SHEET_PADDING * 2

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
