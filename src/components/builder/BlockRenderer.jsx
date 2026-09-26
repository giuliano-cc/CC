import { BLOCK_TYPES } from '../../utils/blockTypes'
import { useContentLibrary } from '../../context/ContentLibraryContext'
import { ImageIcon } from 'lucide-react'

function alignClass(align) {
  return align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
}

function textStyleClasses(block) {
  return [
    block.bold ? 'font-bold' : '',
    block.italic ? 'italic' : '',
    block.underline ? 'underline' : '',
    alignClass(block.align),
  ].join(' ')
}

// Stile inline condiviso dai blocchi testuali "ricchi" (heading/text/quote):
// font, dimensione in px, spaziatura lettere, altezza riga, colore testo e
// di sfondo. `null`/`undefined` lasciano il valore ereditato dal foglio.
function typographyStyle(block) {
  return {
    color: block.color || undefined,
    fontFamily: block.fontFamily || undefined,
    fontSize: block.fontSize ? `${block.fontSize}px` : undefined,
    letterSpacing: block.letterSpacing ? `${block.letterSpacing}px` : undefined,
    lineHeight: block.lineHeight || undefined,
    backgroundColor: block.bgColor || undefined,
  }
}

const HEADING_SIZE_CLASSES = {
  sm: 'text-base',
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-5xl',
}

// A block can be "linked" to a Content Library entry (block.contentSlot):
// in that case the displayed text is read from the library instead of
// block.content, so the same content can be tried on different templates
// without having to rewrite it.
function useResolvedContent(block) {
  const { library } = useContentLibrary()
  if (block.contentSlot && block.contentSlot in library) {
    return library[block.contentSlot]
  }
  return block.content
}

export default function BlockRenderer({
  block,
  interactive = false,
  selectedId = null,
  onSelectItem,
  onAddItem,
}) {
  const resolvedContent = useResolvedContent(block)

  switch (block.type) {
    case BLOCK_TYPES.HEADER:
      return (
        <div className={`border-b border-slate-200 pb-3 text-lg ${textStyleClasses(block)}`}>
          {block.content}
        </div>
      )

    case BLOCK_TYPES.CV_HEADER: {
      const isStacked = block.layout === 'stacked'
      return (
        <div
          className={`flex ${isStacked ? 'items-start' : 'flex-wrap items-baseline'} justify-between gap-4 border-b border-slate-200 pb-4`}
        >
          <div>
            <p
              className="whitespace-pre-line text-lg font-bold leading-tight"
              style={{ color: block.color || undefined }}
            >
              {block.name}
            </p>
            {block.role && <p className="text-sm text-slate-500">{block.role}</p>}
          </div>
          {block.contacts?.length > 0 && (
            <div
              className={`flex text-xs text-slate-500 ${
                isStacked ? 'flex-col items-end gap-0.5' : 'flex-wrap justify-end gap-4'
              }`}
            >
              {block.contacts.map((contact, i) => (
                <span key={i}>{contact}</span>
              ))}
            </div>
          )}
        </div>
      )
    }

    case BLOCK_TYPES.HEADING: {
      const Tag = block.level || 'h1'
      const sizeClass = block.fontSize ? '' : HEADING_SIZE_CLASSES[block.size] || HEADING_SIZE_CLASSES.md
      return (
        <Tag
          className={`whitespace-pre-line ${sizeClass} ${textStyleClasses(block)} ${
            block.rule ? 'border-b border-slate-200 pb-1.5' : ''
          }`}
          style={typographyStyle(block)}
        >
          {resolvedContent}
        </Tag>
      )
    }

    case BLOCK_TYPES.TEXT:
      if (block.list) {
        const ListTag = block.ordered ? 'ol' : 'ul'
        return (
          <ListTag
            className={`${block.ordered ? 'list-decimal' : 'list-disc'} space-y-0.5 pl-5 text-sm leading-relaxed marker:text-slate-400 ${alignClass(block.align)}`}
            style={typographyStyle(block)}
          >
            {resolvedContent.split('\n').filter(Boolean).map((line, i) => (
              <li key={i} className={textStyleClasses({ ...block, align: undefined })}>
                {line}
              </li>
            ))}
          </ListTag>
        )
      }
      return (
        <p
          className={`whitespace-pre-line text-sm leading-relaxed ${textStyleClasses(block)}`}
          style={typographyStyle(block)}
        >
          {resolvedContent}
        </p>
      )

    case BLOCK_TYPES.IMAGE: {
      const justify =
        block.align === 'center'
          ? 'justify-center'
          : block.align === 'right'
            ? 'justify-end'
            : 'justify-start'
      const isCircle = block.shape === 'circle'
      return (
        <div className={`flex ${justify}`}>
          {block.src ? (
            <img
              src={block.src}
              alt={block.alt}
              className={isCircle ? 'h-28 w-28 rounded-full object-cover' : 'max-h-40 rounded-md'}
            />
          ) : (
            <div
              className={`flex items-center justify-center border border-dashed border-slate-300 text-slate-300 ${
                isCircle ? 'h-28 w-28 rounded-full' : 'h-32 w-full max-w-xs rounded-md'
              }`}
            >
              <ImageIcon size={28} />
            </div>
          )}
        </div>
      )
    }

    case BLOCK_TYPES.DIVIDER:
      return <hr className="border-slate-200" />

    case BLOCK_TYPES.QUOTE:
      return (
        <blockquote
          className={`border-l-4 border-primary/40 pl-3 text-sm text-slate-600 ${textStyleClasses(block)}`}
          style={typographyStyle(block)}
        >
          {resolvedContent}
        </blockquote>
      )

    case BLOCK_TYPES.FOOTER:
      return (
        <div className={`border-t border-slate-200 pt-3 text-xs text-slate-500 ${textStyleClasses(block)}`}>
          {block.content}
        </div>
      )

    case BLOCK_TYPES.COLUMNS: {
      const gridTemplateColumns = block.widths?.length
        ? block.widths.join(' ')
        : `repeat(${block.columns.length}, minmax(0, 1fr))`

      return (
        <div className="grid gap-x-8 gap-y-3" style={{ gridTemplateColumns }}>
          {block.columns.map((column, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-3">
              {column.items.map((item) => (
                <div
                  key={item.id}
                  onClick={
                    interactive
                      ? (event) => {
                          event.stopPropagation()
                          onSelectItem(item.id)
                        }
                      : undefined
                  }
                  className={
                    interactive
                      ? `-m-1 cursor-pointer rounded-md p-1 transition ${
                          selectedId === item.id
                            ? 'ring-2 ring-primary/40'
                            : 'hover:bg-slate-50'
                        }`
                      : ''
                  }
                >
                  <BlockRenderer block={item} />
                </div>
              ))}
              {interactive && (
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      onAddItem(colIndex, 'heading')
                    }}
                    className="text-[11px] font-medium text-primary hover:underline"
                  >
                    + Heading
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      onAddItem(colIndex, 'text')
                    }}
                    className="text-[11px] font-medium text-primary hover:underline"
                  >
                    + Text
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )
    }

    default:
      return null
  }
}
