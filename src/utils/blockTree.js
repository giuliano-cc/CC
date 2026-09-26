import { BLOCK_TYPES } from './blockTypes'

// COLUMNS blocks in turn contain an array of blocks (one per column).
// These helpers find/update/remove a block wherever it is in the tree,
// without the rest of the app needing to know whether a block is nested
// or top-level.

export function findBlockById(blocks, id) {
  for (const block of blocks) {
    if (block.id === id) return block
    if (block.type === BLOCK_TYPES.COLUMNS) {
      for (const column of block.columns) {
        const found = findBlockById(column.items, id)
        if (found) return found
      }
    }
  }
  return null
}

export function updateBlockById(blocks, id, updater) {
  return blocks.map((block) => {
    if (block.id === id) {
      return typeof updater === 'function' ? updater(block) : { ...block, ...updater }
    }
    if (block.type === BLOCK_TYPES.COLUMNS) {
      return {
        ...block,
        columns: block.columns.map((column) => ({
          ...column,
          items: updateBlockById(column.items, id, updater),
        })),
      }
    }
    return block
  })
}

export function removeBlockById(blocks, id) {
  return blocks
    .filter((block) => block.id !== id)
    .map((block) => {
      if (block.type === BLOCK_TYPES.COLUMNS) {
        return {
          ...block,
          columns: block.columns.map((column) => ({
            ...column,
            items: removeBlockById(column.items, id),
          })),
        }
      }
      return block
    })
}
