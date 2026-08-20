import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// In-memory cache for fonts to avoid repeated downloads
let cachedRegularFontBase64: string | null = null
let cachedBoldFontBase64: string | null = null

/**
 * Helper to fetch a font file and convert it to Base64 string
 */
async function fetchFontAsBase64(fontUrl: string): Promise<string> {
  const response = await fetch(fontUrl)
  if (!response.ok) {
    throw new Error(`Failed to load font from ${fontUrl} (status: ${response.status})`)
  }
  const buffer = await response.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return window.btoa(binary)
}

/**
 * Load and register Sarabun Thai fonts in jsPDF
 */
async function registerThaiFonts(doc: jsPDF): Promise<void> {
  try {
    if (!cachedRegularFontBase64) {
      cachedRegularFontBase64 = await fetchFontAsBase64('/fonts/Sarabun-Regular.ttf')
    }
    if (!cachedBoldFontBase64) {
      cachedBoldFontBase64 = await fetchFontAsBase64('/fonts/Sarabun-Bold.ttf')
    }

    doc.addFileToVFS('Sarabun-Regular.ttf', cachedRegularFontBase64)
    doc.addFont('Sarabun-Regular.ttf', 'Sarabun', 'normal')

    doc.addFileToVFS('Sarabun-Bold.ttf', cachedBoldFontBase64)
    doc.addFont('Sarabun-Bold.ttf', 'Sarabun', 'bold')
  } catch (err) {
    console.error('Error loading Thai fonts for PDF:', err)
    throw new Error('ไม่สามารถโหลดฟอนต์ภาษาไทยได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต')
  }
}

export interface PDFExportTransaction {
  id?: string
  entry_date: string
  type: 'income' | 'expense'
  category: string | null
  description: string | null
  amount: number
}

export interface PDFExportOptions {
  periodLabel: string
  transactions: PDFExportTransaction[]
  openingBalance?: number
  formatDate: (dateStr: string) => string
  filename?: string
  documentTitle?: string
}

/**
 * Generate and download professional Thai Cashflow Report PDF
 */
export async function generateCashflowPDF(options: PDFExportOptions): Promise<void> {
  const { periodLabel, transactions, openingBalance = 0, formatDate, filename: customFilename, documentTitle = 'รายงานรายรับ - รายจ่าย' } = options

  if (!transactions || transactions.length === 0) {
    throw new Error('ไม่มีข้อมูลให้ Export')
  }

  // Create A4 portrait document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  // Load and register Thai fonts
  await registerThaiFonts(doc)

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14

  // Sort transactions chronologically
  const sortedTx = [...transactions].sort((a, b) => a.entry_date.localeCompare(b.entry_date))

  // Calculate totals and running balances
  let runningBalance = openingBalance
  let totalIncome = 0
  let totalExpense = 0

  const tableBody = sortedTx.map(tx => {
    const isIncome = tx.type === 'income'
    if (isIncome) {
      runningBalance += tx.amount
      totalIncome += tx.amount
    } else {
      runningBalance -= tx.amount
      totalExpense += tx.amount
    }

    const formattedAmount = (isIncome ? '+' : '-') + tx.amount.toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

    const formattedBalance = runningBalance.toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

    return [
      formatDate(tx.entry_date),
      isIncome ? 'รายรับ' : 'รายจ่าย',
      tx.category || 'ไม่ระบุหมวดหมู่',
      tx.description || '-',
      formattedAmount,
      formattedBalance,
    ]
  })

  // Document Title & Header (Page 1)
  doc.setFont('Sarabun', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(15, 23, 42) // slate-900
  doc.text(documentTitle, margin, 18)

  doc.setFont('Sarabun', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(71, 85, 105) // slate-600
  doc.text(periodLabel, margin, 24)

  const now = new Date()
  const thaiYear = now.getFullYear() + 543
  const printDay = String(now.getDate()).padStart(2, '0')
  const printMonth = String(now.getMonth() + 1).padStart(2, '0')
  const printHours = String(now.getHours()).padStart(2, '0')
  const printMinutes = String(now.getMinutes()).padStart(2, '0')
  const printDateStr = `วันที่ออกรายงาน: ${printDay}/${printMonth}/${thaiYear} ${printHours}:${printMinutes} น.`

  doc.setFontSize(8.5)
  doc.setTextColor(148, 163, 184) // slate-400
  doc.text(printDateStr, pageWidth - margin, 18, { align: 'right' })
  doc.text('MyLife App', pageWidth - margin, 24, { align: 'right' })

  // Decorative divider
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.25)
  doc.line(margin, 28, pageWidth - margin, 28)

  // Generate Table using jsPDF-AutoTable
  autoTable(doc, {
    startY: 32,
    head: [['วันที่', 'ประเภท', 'หมวดหมู่', 'รายละเอียด', 'จำนวนเงิน (฿)', 'คงเหลือสะสม (฿)']],
    body: tableBody,
    theme: 'grid',
    styles: {
      font: 'Sarabun',
      fontStyle: 'normal',
      fontSize: 9,
      cellPadding: { top: 2.8, right: 3, bottom: 2.8, left: 3 },
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      textColor: [30, 41, 59],
    },
    headStyles: {
      font: 'Sarabun',
      fontStyle: 'bold',
      fillColor: [59, 78, 240], // Brand Cobalt #3b4ef0
      textColor: [255, 255, 255],
      fontSize: 9.5,
      halign: 'center',
      cellPadding: { top: 3.2, bottom: 3.2 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 26 },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'left', cellWidth: 32 },
      3: { halign: 'left' },
      4: { halign: 'right', cellWidth: 30 },
      5: { halign: 'right', cellWidth: 30 },
    },
    showHead: 'everyPage',
    didParseCell(data) {
      if (data.section === 'body') {
        // Style Type column
        if (data.column.index === 1) {
          if (data.cell.raw === 'รายรับ') {
            data.cell.styles.textColor = [10, 138, 92] // emerald green
            data.cell.styles.fontStyle = 'bold'
          } else {
            data.cell.styles.textColor = [208, 39, 72] // rose red
          }
        }
        // Style Amount column
        if (data.column.index === 4) {
          const val = String(data.cell.raw || '')
          if (val.startsWith('+')) {
            data.cell.styles.textColor = [10, 138, 92]
            data.cell.styles.fontStyle = 'bold'
          } else {
            data.cell.styles.textColor = [208, 39, 72]
          }
        }
        // Style Balance column
        if (data.column.index === 5) {
          data.cell.styles.fontStyle = 'bold'
        }
      }
    },
    margin: { top: 16, left: margin, right: margin, bottom: 18 },
  })

  // Financial Summary Box after table
  const finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 6 : 50
  const summaryBoxHeight = 24

  let summaryY = finalY
  if (summaryY + summaryBoxHeight > pageHeight - 16) {
    doc.addPage()
    summaryY = 18
  }

  // Draw Summary Card
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.2)
  doc.roundedRect(margin, summaryY, pageWidth - (margin * 2), summaryBoxHeight, 2, 2, 'FD')

  const colWidth = (pageWidth - (margin * 2) - 8) / 4
  const contentY = summaryY + 6

  // 1. Total Count
  doc.setFont('Sarabun', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(100, 116, 139)
  doc.text('จำนวนรายการทั้งหมด', margin + 4, contentY + 2)
  doc.setFont('Sarabun', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(15, 23, 42)
  doc.text(`${transactions.length} รายการ`, margin + 4, contentY + 11)

  // 2. Total Income
  doc.setFont('Sarabun', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(100, 116, 139)
  doc.text('รายรับรวม (+)', margin + 4 + colWidth, contentY + 2)
  doc.setFont('Sarabun', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(10, 138, 92)
  doc.text(`+฿${totalIncome.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin + 4 + colWidth, contentY + 11)

  // 3. Total Expense
  doc.setFont('Sarabun', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(100, 116, 139)
  doc.text('รายจ่ายรวม (-)', margin + 4 + (colWidth * 2), contentY + 2)
  doc.setFont('Sarabun', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(208, 39, 72)
  doc.text(`-฿${totalExpense.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin + 4 + (colWidth * 2), contentY + 11)

  // 4. Net Balance
  const netBalance = totalIncome - totalExpense
  doc.setFont('Sarabun', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(100, 116, 139)
  doc.text('คงเหลือสุทธิ', margin + 4 + (colWidth * 3), contentY + 2)
  doc.setFont('Sarabun', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(netBalance >= 0 ? 10 : 208, netBalance >= 0 ? 138 : 39, netBalance >= 0 ? 92 : 72)
  doc.text(`${netBalance >= 0 ? '+' : ''}฿${netBalance.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin + 4 + (colWidth * 3), contentY + 11)

  // Add Page Numbers on all pages at the end
  const totalPages = (doc.internal as any).pages ? (doc.internal as any).pages.length - 1 : 1
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFont('Sarabun', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)

    // Subtle line above footer
    doc.setDrawColor(241, 245, 249)
    doc.setLineWidth(0.15)
    doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11)

    doc.text('MyLife App · รายงานรายรับ-รายจ่าย', margin, pageHeight - 6)
    doc.text(`หน้า ${p} จาก ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' })
  }

  // Save PDF file
  const defaultFilename = `รายงานรายรับรายจ่าย_${thaiYear}${printMonth}${printDay}.pdf`
  const finalFilename = customFilename || defaultFilename
  doc.save(finalFilename.endsWith('.pdf') ? finalFilename : `${finalFilename}.pdf`)
}
