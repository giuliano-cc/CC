import { BLOCK_TYPES } from '../../utils/blockTypes'
import { ImageIcon } from 'lucide-react'

function textStyleClasses(block) {
  return [
    block.bold ? 'font-bold' : '',
    block.italic ? 'italic' : '',
    block.underline ? 'underline' : '',
    block.align === 'center'
      ? 'text-center'
      : block.align === 'right'
        ? 'text-right'
        : 'text-left',
  ].join(' ')
}

export default function BlockRenderer({ block }) {
  switch (block.type) {
    case BLOCK_TYPES.HEADER:
      return (
        <div className={`border-b border-slate-200 pb-3 text-lg ${textStyleClasses(block)}`}>
          {block.content}
        </div>
      )

    case BLOCK_TYPES.HEADING: {
      const Tag = block.level || 'h1'
      const sizeClass = Tag === 'h1' ? 'text-2xl' : 'text-lg'
      return (
        <Tag className={`${sizeClass} ${textStyleClasses(block)}`}>
          {block.content}
        </Tag>
      )
    }

    case BLOCK_TYPES.TEXT:
      return (
        <p className={`text-sm leading-relaxed ${textStyleClasses(block)}`}>
          {block.content}
        </p>
      )

    case BLOCK_TYPES.IMAGE:
      return (
        <div
          className={`flex ${
            block.align === 'center'
              ? 'justify-center'
              : block.align === 'right'
                ? 'justify-end'
                : 'justify-start'
          }`}
        >
          {block.src ? (
            <img src={block.src} alt={block.alt} className="max-h-40 rounded-md" />
          ) : (
            <div className="flex h-32 w-full max-w-xs items-center justify-center rounded-md border border-dashed border-slate-300 text-slate-300">
              <ImageIcon size={28} />
            </div>
          )}
        </div>
      )

    case BLOCK_TYPES.DIVIDER:
      return <hr className="border-slate-200" />

    case BLOCK_TYPES.QUOTE:
      return (
        <blockquote
          className={`border-l-4 border-primary/40 pl-3 text-sm text-slate-600 ${textStyleClasses(block)}`}
        >
          {block.content}
        </blockquote>
      )

    case BLOCK_TYPES.FOOTER:
      return (
        <div className={`border-t border-slate-200 pt-3 text-xs text-slate-500 ${textStyleClasses(block)}`}>
          {block.content}
        </div>
      )

    default:
      return null
  }
}
