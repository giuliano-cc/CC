import { arrayMove } from '@dnd-kit/sortable'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { createBlockInstance } from '../utils/blockTypes'
import { findBlockById, removeBlockById, updateBlockById } from '../utils/blockTree'

const DEFAULT_GLOBAL_STYLE = {
  primaryColor: '#2563eb',
  textColor: '#1e293b',
  fontFamily: 'Inter, system-ui, sans-serif',
}

const BuilderContext = createContext(null)

export function BuilderProvider({ children, initialBlocks = [], initialGlobalStyle }) {
  const [blocks, setBlocks] = useState(initialBlocks)
  const [selectedBlockId, setSelectedBlockId] = useState(null)
  const [globalStyle, setGlobalStyle] = useState({
    ...DEFAULT_GLOBAL_STYLE,
    ...initialGlobalStyle,
  })

  const selectedBlock = useMemo(
    () => findBlockById(blocks, selectedBlockId),
    [blocks, selectedBlockId],
  )

  const addBlock = useCallback((type, index) => {
    const newBlock = createBlockInstance(type)
    setBlocks((prev) => {
      const next = [...prev]
      const insertAt = index === undefined ? next.length : index
      next.splice(insertAt, 0, newBlock)
      return next
    })
    setSelectedBlockId(newBlock.id)
    return newBlock
  }, [])

  // Aggiunge un blocco semplice (titolo/testo) dentro una colonna di un
  // blocco COLUMNS: le colonne non sono riordinabili via drag-and-drop, ma
  // i loro elementi restano modificabili/selezionabili come tutti gli altri.
  const addNestedItem = useCallback((columnsBlockId, columnIndex, type) => {
    const newItem = createBlockInstance(type)
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

  const reorderBlocks = useCallback((activeId, overId) => {
    setBlocks((prev) => {
      const oldIndex = prev.findIndex((b) => b.id === activeId)
      const newIndex = prev.findIndex((b) => b.id === overId)
      if (oldIndex === -1 || newIndex === -1) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }, [])

  const selectBlock = useCallback((id) => {
    setSelectedBlockId(id)
  }, [])

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
    reorderBlocks,
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
    throw new Error('useBuilder deve essere usato dentro un BuilderProvider')
  }
  return context
}
