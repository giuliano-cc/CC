import { Image as ImageIcon } from 'lucide-react'

export default function renderImageBlock({ block, library }) {
  const justify =
    block.align === 'center'
      ? 'justify-center'
      : block.align === 'right'
        ? 'justify-end'
        : 'justify-start'
  const isCircle = block.shape === 'circle'
  const resolvedSrc = block.imageSlot ? library[block.imageSlot] || '' : block.src
  // The image fills its block's own width/height instead of a fixed
  // size, so dragging the block's resize handles actually scales the
  // picture — it used to stay a fixed 112px/160px regardless of how
  // big the block was resized to. A circle photo stays a perfect
  // circle (sized to fit within the block, capped by whichever of its
  // width/height is smaller) instead of stretching into an oval when
  // the block itself isn't square — most circle photos land in a
  // block that's wider than tall (auto-placed at the page's full
  // content width), and object-cover alone would just squash them.
  const imageShapeClasses = isCircle
    ? 'aspect-square h-full max-w-full rounded-full'
    : 'h-full w-full rounded-md'
  return (
    <div className={`flex h-full w-full ${justify}`}>
      {resolvedSrc ? (
        <img src={resolvedSrc} alt={block.alt} className={`${imageShapeClasses} object-cover`} />
      ) : (
        <div
          className={`flex items-center justify-center border border-dashed border-slate-300 text-slate-300 ${imageShapeClasses}`}
        >
          <ImageIcon size={28} />
        </div>
      )}
    </div>
  )
}
