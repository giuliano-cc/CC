import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { createBlockInstance, createNestedBlockInstance } from '../utils/blockTypes'
import { findBlockById, removeBlockById, updateBlockById } from '../utils/blockTree'
import { seedFreeLayout } from '../utils/layout'

const DEFAULT_GLOBAL_STYLE = {
  primaryColor: '#2563eb',
  textColor: '#1e293b',
  fontFamily: 'Inter, system-ui, sans-serif',
}

const BuilderContext = createContext(null)

export function BuilderProvider({ children, initialBlocks = [], initialGlobalStyle }) {
  const [blocks, setBlocks] = useState(() => seedFreeLayout(initialBlocks))
  const [selectedBlockId, setSelectedBlockId] = useState(null)
  const [globalStyle, setGlobalStyle] = useState({
    ...DEFAULT_GLOBAL_STYLE,
    ...initialGlobalStyle,
  })
  const zCounter = useRef(Math.max(1, ...blocks.map((b) => b.zIndex || 0)) + 1)

  const selectedBlock = useMemo(
    () => findBlockById(blocks, selectedBlockId),
    [blocks, selectedBlockId],
  )

  // Creates a free block on the sheet, at a given position (typically the
  // cursor position at drop time from the palette).
  const addBlock = useCallback((type, position) => {
    const newBlock = createBlockInstance(type)
    if (position) {
      newBlock.x = position.x
      newBlock.y = position.y
    }
    newBlock.zIndex = zCounter.current++
    setBlocks((prev) => [...prev, newBlock])
    setSelectedBlockId(newBlock.id)
    return newBlock
  }, [])

  // Adds a simple block (heading/text) inside a column of a COLUMNS
  // block: a column's items stay in vertical flow (they aren't free on the
  // sheet), but they're still selectable/editable like all the others.
  const addNestedItem = useCallback((columnsBlockId, columnIndex, type) => {
    const newItem = createNestedBlockInstance(type)
    setBlocks((prev) =>
      updateBlockById(prev, columnsBlockId, (block) => ({
        ...block,
        columns: block.columns.map((column, index) =>
          index === columnIndex
            ? { ...column, items: [...column.items, newItem] }
            : column,
        ),
      })),
    )
    setSelectedBlockId(newItem.id)
  }, [])

  const updateBlock = useCallback((id, patch) => {
    setBlocks((prev) => updateBlockById(prev, id, patch))
  }, [])

  const removeBlock = useCallback((id) => {
    setBlocks((prev) => removeBlockById(prev, id))
    setSelectedBlockId((current) => (current === id ? null : current))
  }, [])

  // Brings a block to the front when selected/dragged, so two overlapping
  // blocks on the sheet behave predictably.
  const bringToFront = useCallback((id) => {
    const nextZ = zCounter.current++
    setBlocks((prev) => updateBlockById(prev, id, { zIndex: nextZ }))
  }, [])

  const selectBlock = useCallback(
    (id) => {
      setSelectedBlockId(id)
      if (id) bringToFront(id)
    },
    [bringToFront],
  )

  const value = {
    blocks,
    setBlocks,
    selectedBlock,
    selectedBlockId,
    selectBlock,
    addBlock,
    addNestedItem,
    updateBlock,
    removeBlock,
    bringToFront,
    globalStyle,
    setGlobalStyle,
  }

  return (
    <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>
  )
}

export function useBuilder() {
  const context = useContext(BuilderContext)
  if (!context) {
    throw new Error('useBuilder must be used within a BuilderProvider')
  }
  return context
}
