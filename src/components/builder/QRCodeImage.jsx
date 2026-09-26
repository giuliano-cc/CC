import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { QrCode } from 'lucide-react'

export default function QRCodeImage({ value, size = 120 }) {
  const [dataUrl, setDataUrl] = useState(null)

  useEffect(() => {
    let cancelled = false
    if (!value) {
      setDataUrl(null)
      return
    }
    QRCode.toDataURL(value, { width: size, margin: 1 })
      .then((url) => {
        if (!cancelled) setDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null)
      })
    return () => {
      cancelled = true
    }
  }, [value, size])

  if (!value) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-slate-300 text-slate-300"
      >
        <QrCode size={28} />
        <span className="text-[10px]">No link set</span>
      </div>
    )
  }

  if (!dataUrl) {
    return <div style={{ width: size, height: size }} className="animate-pulse rounded-md bg-slate-100" />
  }

  return <img src={dataUrl} alt="QR code" width={size} height={size} className="rounded-md" />
}
