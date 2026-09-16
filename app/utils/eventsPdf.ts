import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { registerThaiFonts } from '~/utils/cashflowPdf'

export type PDFExportEvent = {
  title: string
  description: string | null
  eventType: 'same_day_time' | 'same_day_all_day' | 'multi_day'
  startDate: string
  startTime: string | null
  endDate: string | null
  endTime: string | null
}

const getTypeLabel = (event: PDFExportEvent) => {
  if (event.eventType === 'same_day_all_day') return 'ตลอดวัน'
  if (event.eventType === 'multi_day') return 'ข้ามวัน'
  return 'ระบุเวลา'
}

const getTimeLabel = (event: PDFExportEvent, formatDate: (date: string) => string) => {
  if (event.eventType === 'same_day_all_day') return `${formatDate(event.startDate)} (ตลอดวัน)`
  const start = `${formatDate(event.startDate)} ${event.startTime?.slice(0, 5) || '00:00'} น.`
  if (event.eventType === 'same_day_time') return `${start} - ${event.endTime?.slice(0, 5) || '23:59'} น.`
  return `${start}\nถึง ${formatDate(event.endDate || event.startDate)} ${event.endTime?.slice(0, 5) || '23:59'} น.`
}

export async function generateEventsPDF(events: PDFExportEvent[], formatDate: (date: string) => string): Promise<void> {
  if (!events.length) throw new Error('ไม่มีกิจกรรมสำหรับส่งออก')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  await registerThaiFonts(doc)
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14
  const generatedAt = new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })

  doc.setFont('Sarabun', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(15, 23, 42)
  doc.text('รายงานกิจกรรมและนัดหมาย', margin, 17)
  doc.setFont('Sarabun', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(`จำนวน ${events.length} รายการ • สร้างเมื่อ ${generatedAt}`, margin, 23)

  autoTable(doc, {
    startY: 28,
    head: [['วันที่และเวลา', 'ประเภท', 'ชื่อกิจกรรม', 'รายละเอียด']],
    body: [...events]
      .sort((a, b) => a.startDate.localeCompare(b.startDate) || (a.startTime || '').localeCompare(b.startTime || ''))
      .map(event => [getTimeLabel(event, formatDate), getTypeLabel(event), event.title, event.description || '-']),
    theme: 'grid',
    styles: {
      font: 'Sarabun', fontStyle: 'normal', fontSize: 9,
      cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 },
      lineColor: [226, 232, 240], lineWidth: 0.15, textColor: [30, 41, 59],
      valign: 'middle',
    },
    headStyles: {
      font: 'Sarabun', fontStyle: 'bold', fillColor: [59, 78, 240],
      textColor: [255, 255, 255], halign: 'center',
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 75 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 65 },
      3: { cellWidth: 'auto' },
    },
    margin: { top: 16, right: margin, bottom: 16, left: margin },
  })

  const totalPages = (doc.internal as any).pages?.length - 1 || 1
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page)
    doc.setFont('Sarabun', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text('MyLife App • รายงานกิจกรรม', margin, pageHeight - 7)
    doc.text(`หน้า ${page} จาก ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' })
  }
  doc.save(`my-life-activities-${new Date().toISOString().slice(0, 10)}.pdf`)
}
