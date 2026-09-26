import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { SHEET_HEIGHT, SHEET_WIDTH } from './layout'

// Renders each page sheet (see Canvas.jsx, which gives every page the id
// `pdf-page-{index}`) to a canvas and assembles them into one PDF, entirely
// client-side (there's no backend to render it for us). Editor-only visuals
// (the margin guide, the empty-page placeholder) are skipped via the
// `pdf-ignore` class so the PDF shows only real content.
export async function generatePdfBlob(pageCount) {
  const pdf = new jsPDF({ unit: 'px', format: [SHEET_WIDTH, SHEET_HEIGHT] })

  for (let i = 0; i < pageCount; i += 1) {
    const node = document.getElementById(`pdf-page-${i}`)
    if (!node) continue

    const canvas = await html2canvas(node, {
      scale: 2,
      backgroundColor: '#ffffff',
      ignoreElements: (el) => el.classList?.contains('pdf-ignore'),
    })

    if (i > 0) pdf.addPage([SHEET_WIDTH, SHEET_HEIGHT], 'portrait')
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, SHEET_WIDTH, SHEET_HEIGHT)
  }

  return pdf.output('blob')
}
