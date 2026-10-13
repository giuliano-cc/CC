import QRCodeImage from '../QRCodeImage'

export default function renderQrCodeBlock({ block, library }) {
  const value = block.useLibraryValue ? library.qrValue : block.value
  const captionPosition = block.captionPosition || 'bottom'
  const isHorizontal = captionPosition === 'left' || captionPosition === 'right'
  const size = isHorizontal
    ? Math.max(20, block.height - 16)
    : Math.max(20, Math.min(block.width - 16, block.height - 32))
  const qr = <QRCodeImage value={value} size={size} />
  const caption = block.caption && <p className="text-xs opacity-70">{block.caption}</p>
  const wrapperClass = {
    top: 'flex flex-col-reverse items-center gap-1.5',
    bottom: 'flex flex-col items-center gap-1.5',
    left: 'flex flex-row-reverse items-center gap-2.5',
    right: 'flex flex-row items-center gap-2.5',
  }[captionPosition]
  return (
    <div className={wrapperClass}>
      {qr}
      {caption}
    </div>
  )
}
