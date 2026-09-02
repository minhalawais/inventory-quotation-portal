import { readFile } from "node:fs/promises"
import path from "node:path"

import {
  COMPANY,
  displayPersonName,
  formatAmount,
  formatPkr,
  formatQuotationDate,
  quotationRefDisplay,
  validUntilDate,
} from "@/lib/company"
import { quotationStatusLabel } from "@/lib/quotation"

type PdfItem = {
  productId: string
  quantity: number
  price: number
  productName?: string
  productImage?: string
}

type PdfQuotation = {
  _id: { toString(): string } | string
  customerName: string
  customerPhone: string
  customerAddress: string
  totalAmount: number
  status: string
  createdAt: string | Date
  showPrices?: boolean
  quotationNo?: string | null
  rider?: {
    name: string
    phone?: string
    email?: string
  } | null
}

type Rgb = [number, number, number]

const GOLD: Rgb = [184, 134, 11]
const INK: Rgb = [26, 26, 26]
const MUTED: Rgb = [107, 107, 107]
const LINE: Rgb = [228, 228, 228]
const SURFACE: Rgb = [247, 247, 247]
const WHITE: Rgb = [255, 255, 255]

type EmbeddedImage = { data: string; format: "PNG" | "JPEG"; width?: number; height?: number }

function statusAccent(status: string): Rgb {
  switch (status) {
    case "sent":
      return [22, 163, 74]
    case "pending":
    case "returned":
      return [217, 119, 6]
    case "completed":
      return [37, 99, 235]
    case "cancelled":
      return [220, 38, 38]
    default:
      return MUTED
  }
}

function pngSize(bytes: Buffer) {
  if (bytes.length < 24) return undefined
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

function sniffImageFormat(bytes: Buffer): "PNG" | "JPEG" | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "PNG"
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "JPEG"
  }
  return null
}

async function loadPublicPng(filename: string): Promise<EmbeddedImage | null> {
  try {
    const filePath = path.join(process.cwd(), "public", filename.replace(/^\//, ""))
    const bytes = await readFile(filePath)
    const format = sniffImageFormat(bytes)
    if (!format) return null
    const mime = format === "PNG" ? "image/png" : "image/jpeg"
    const size = format === "PNG" ? pngSize(bytes) : undefined
    return { data: `data:${mime};base64,${bytes.toString("base64")}`, format, ...size }
  } catch (error) {
    console.error("PDF logo load failed:", error)
    return null
  }
}

/** Crop the circular mark to a square RGB PNG so jsPDF can embed it. */
async function prepareCompanyLogo(): Promise<EmbeddedImage | null> {
  const filePath = path.join(process.cwd(), "public", COMPANY.logoWhiteBgPath.replace(/^\//, ""))
  try {
    const { createCanvas, loadImage } = await import("canvas")
    const img = await loadImage(filePath)
    const src = createCanvas(img.width, img.height)
    const sourceCtx = src.getContext("2d")
    sourceCtx.fillStyle = "#ffffff"
    sourceCtx.fillRect(0, 0, img.width, img.height)
    sourceCtx.drawImage(img, 0, 0)
    const { data } = sourceCtx.getImageData(0, 0, img.width, img.height)
    let minX = img.width
    let minY = img.height
    let maxX = 0
    let maxY = 0
    for (let y = 0; y < img.height; y += 2) {
      for (let x = 0; x < img.width; x += 2) {
        const i = (y * img.width + x) * 4
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const a = data[i + 3]
        if (a > 12 && (r < 248 || g < 248 || b < 248)) {
          if (x < minX) minX = x
          if (y < minY) minY = y
          if (x > maxX) maxX = x
          if (y > maxY) maxY = y
        }
      }
    }
    if (maxX <= minX || maxY <= minY) {
      minX = 0
      minY = 0
      maxX = img.width
      maxY = img.height
    }
    const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.06)
    minX = Math.max(0, minX - pad)
    minY = Math.max(0, minY - pad)
    maxX = Math.min(img.width, maxX + pad)
    maxY = Math.min(img.height, maxY + pad)
    const cropW = maxX - minX
    const cropH = maxY - minY
    const size = 256
    const out = createCanvas(size, size)
    const outCtx = out.getContext("2d")
    outCtx.fillStyle = "#ffffff"
    outCtx.fillRect(0, 0, size, size)
    outCtx.drawImage(src, minX, minY, cropW, cropH, 0, 0, size, size)
    const bytes = out.toBuffer("image/png")
    return { data: `data:image/png;base64,${bytes.toString("base64")}`, format: "PNG", width: size, height: size }
  } catch (error) {
    console.error("PDF logo prepare failed:", error)
    return loadPublicPng(COMPANY.logoWhiteBgPath)
  }
}

async function loadItemImage(src?: string): Promise<EmbeddedImage | null> {
  if (!src) return null
  try {
    let bytes: Buffer
    if (src.startsWith("/") && !src.startsWith("//")) {
      bytes = await readFile(path.join(process.cwd(), "public", src.replace(/^\//, "")))
    } else if (/^https?:\/\//i.test(src)) {
      const response = await fetch(src, { signal: AbortSignal.timeout(4000) })
      if (!response.ok) return null
      bytes = Buffer.from(await response.arrayBuffer())
    } else {
      return null
    }
    if (bytes.length > 2_000_000) return null
    const format = sniffImageFormat(bytes)
    if (!format) return null
    const mime = format === "PNG" ? "image/png" : "image/jpeg"
    return { data: `data:${mime};base64,${bytes.toString("base64")}`, format }
  } catch {
    return null
  }
}

/** KK Sports quotation PDF shared by authenticated and public routes. */
export async function generateQuotationPdf(quotation: PdfQuotation, items: PdfItem[]): Promise<Buffer> {
  try {
    const { jsPDF } = await import("jspdf")
    const { default: autoTable } = await import("jspdf-autotable")

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true })
    const showPrices = quotation.showPrices !== false
    const left = 16
    const right = 16
    const pageWidth = 210
    const contentWidth = pageWidth - left - right
    const ref = quotationRefDisplay(quotation, quotation.quotationNo)
    const issued = formatQuotationDate(quotation.createdAt)
    const valid = validUntilDate(quotation.createdAt)
    const customerName = displayPersonName(quotation.customerName)
    const riderName = quotation.rider?.name ? displayPersonName(quotation.rider.name) : ""
    const statusLabel = quotationStatusLabel(quotation.status)
    const computed = items.reduce((sum, item) => sum + item.quantity * item.price, 0)
    const grandTotal = quotation.totalAmount || computed

    const [logo, ...itemPhotos] = await Promise.all([
      prepareCompanyLogo(),
      ...items.map((item) => loadItemImage(item.productImage)),
    ])
    const hasPhotos = itemPhotos.some(Boolean)

    const drawChrome = (page: number, pageCount: number) => {
      doc.setFillColor(...GOLD)
      doc.rect(0, 0, pageWidth, 2, "F")

      if (page > 1) {
        doc.setTextColor(...INK)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(9)
        doc.text(COMPANY.name, left, 10)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(...MUTED)
        doc.setFontSize(8)
        doc.text(ref, pageWidth - right, 10, { align: "right" })
        doc.setDrawColor(...GOLD)
        doc.setLineWidth(0.35)
        doc.line(left, 13, pageWidth - right, 13)
      }

      doc.setDrawColor(...GOLD)
      doc.setLineWidth(0.4)
      doc.line(left, 282, pageWidth - right, 282)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)
      doc.setTextColor(...MUTED)
      doc.text(`${COMPANY.phoneDisplay}  |  ${COMPANY.email}  |  ${COMPANY.website}`, left, 287)
      doc.text(`Page ${page} of ${pageCount}`, pageWidth - right, 287, { align: "right" })
    }

    const logoSize = 16
    const headerTop = 10
    let logoWidth = logoSize
    let logoHeight = logoSize
    if (logo?.width && logo.height && logo.width !== logo.height) {
      const ratio = logo.width / logo.height
      if (ratio > 1) {
        logoWidth = logoSize * ratio
        logoHeight = logoSize
      } else {
        logoWidth = logoSize
        logoHeight = logoSize / ratio
      }
    }
    if (logo) {
      try {
        doc.addImage(logo.data, logo.format, left, headerTop, logoWidth, logoHeight, undefined, "FAST")
      } catch (error) {
        console.error("PDF logo embed failed:", error)
      }
    }

    const brandX = logo ? left + logoWidth + 3.5 : left
    doc.setTextColor(...INK)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.text(COMPANY.name, brandX, headerTop + 9)

    doc.setTextColor(...MUTED)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7.5)
    doc.text("QUOTATION", pageWidth - right, headerTop + 3, { align: "right" })
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.setTextColor(...INK)
    doc.text(ref, pageWidth - right, headerTop + 9.5, { align: "right" })

    const pillLabel = statusLabel.toUpperCase()
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7)
    const pillPadX = 2.6
    const pillW = doc.getTextWidth(pillLabel) + pillPadX * 2
    const pillH = 5
    const pillX = pageWidth - right - pillW
    const pillY = headerTop + 12
    doc.setFillColor(...statusAccent(quotation.status))
    doc.roundedRect(pillX, pillY, pillW, pillH, 1.2, 1.2, "F")
    doc.setTextColor(...WHITE)
    doc.text(pillLabel, pillX + pillW / 2, pillY + 3.5, { align: "center" })

    let headerBottom = headerTop + Math.max(logoHeight, 16) + 5
    if (showPrices) {
      doc.setTextColor(...INK)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(12)
      doc.text(formatPkr(grandTotal), pageWidth - right, headerTop + 22.5, { align: "right" })
      headerBottom = Math.max(headerBottom, headerTop + 26)
    }

    doc.setDrawColor(...GOLD)
    doc.setLineWidth(0.7)
    doc.line(left, headerBottom, pageWidth - right, headerBottom)

    let y = headerBottom + 6
    const colCount = quotation.rider ? 3 : 2
    const gap = 5
    const colW = (contentWidth - gap * (colCount - 1)) / colCount
    const metaH = Math.max(
      28,
      16 + Math.ceil(doc.splitTextToSize(quotation.customerAddress || "—", colW - 6).length) * 4,
    )

    doc.setFillColor(...SURFACE)
    doc.roundedRect(left, y, contentWidth, metaH, 1.5, 1.5, "F")

    const writeMeta = (x: number, label: string, lines: string[]) => {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(7)
      doc.setTextColor(...MUTED)
      doc.text(label, x, y + 6)
      doc.setTextColor(...INK)
      let ty = y + 11
      lines.forEach((line, index) => {
        if (!line) return
        doc.setFont("helvetica", index === 0 ? "bold" : "normal")
        doc.setFontSize(index === 0 ? 9.5 : 8)
        if (index > 0) doc.setTextColor(...MUTED)
        else doc.setTextColor(...INK)
        const wrapped = doc.splitTextToSize(line, colW - 6)
        doc.text(wrapped, x, ty)
        ty += wrapped.length * 4
      })
    }

    writeMeta(left + 4, "BILL TO", [customerName, quotation.customerPhone, quotation.customerAddress])
    if (quotation.rider) {
      writeMeta(left + colW + gap + 4, "SALES REP", [
        riderName,
        quotation.rider.phone || "",
        quotation.rider.email || "",
      ])
      writeMeta(left + (colW + gap) * 2 + 4, "DATES", [`Issued  ${issued}`, `Valid until  ${valid}`])
    } else {
      writeMeta(left + colW + gap + 4, "DATES", [`Issued  ${issued}`, `Valid until  ${valid}`])
    }

    y += metaH + 6

    const head = hasPhotos
      ? showPrices
        ? [["", "Item", "Qty", "Unit", "Amount"]]
        : [["", "Item", "Qty"]]
      : showPrices
        ? [["Item", "Qty", "Unit", "Amount"]]
        : [["Item", "Qty"]]

    const body = items.map((item) => {
      const itemCell = `${item.productName || "Product"}\n#${item.productId}`
      const qty = String(item.quantity)
      if (hasPhotos && showPrices) {
        return ["", itemCell, qty, formatAmount(item.price), formatAmount(item.quantity * item.price)]
      }
      if (hasPhotos) return ["", itemCell, qty]
      if (showPrices) return [itemCell, qty, formatAmount(item.price), formatAmount(item.quantity * item.price)]
      return [itemCell, qty]
    })

    const photoIndex = hasPhotos ? 0 : -1
    const amountIndex = showPrices ? (hasPhotos ? 4 : 3) : -1
    const qtyIndex = hasPhotos ? 2 : 1
    const unitIndex = showPrices ? (hasPhotos ? 3 : 2) : -1

    autoTable(doc, {
      startY: y,
      head,
      body,
      theme: "plain",
      margin: { left, right, bottom: 22, top: 18 },
      tableWidth: contentWidth,
      styles: {
        font: "helvetica",
        fontSize: 8.5,
        textColor: INK,
        cellPadding: { top: 3.2, bottom: 3.2, left: 2.2, right: 2.2 },
        lineColor: LINE,
        lineWidth: 0.2,
        minCellHeight: hasPhotos ? 16 : 9,
        overflow: "linebreak",
        valign: "middle",
      },
      headStyles: {
        fillColor: INK,
        textColor: WHITE,
        fontStyle: "bold",
        fontSize: 7.5,
        cellPadding: { top: 2.8, bottom: 2.8, left: 2.2, right: 2.2 },
        minCellHeight: 8,
      },
      alternateRowStyles: { fillColor: SURFACE },
      columnStyles: {
        ...(hasPhotos ? { 0: { cellWidth: 16, halign: "center" as const } } : {}),
        [qtyIndex]: { cellWidth: 16, halign: "right" as const, fontStyle: "bold" },
        ...(unitIndex >= 0 ? { [unitIndex]: { cellWidth: 28, halign: "right" as const } } : {}),
        ...(amountIndex >= 0 ? { [amountIndex]: { cellWidth: 32, halign: "right" as const, fontStyle: "bold" } } : {}),
      },
      didParseCell: (data) => {
        if (data.section === "head" && photoIndex === 0 && data.column.index === 0) {
          data.cell.text = []
        }
      },
      didDrawCell: (data) => {
        if (data.section !== "body" || data.column.index !== photoIndex) return
        const photo = itemPhotos[data.row.index]
        if (!photo) return
        const pad = 1.6
        const size = Math.min(data.cell.width, data.cell.height) - pad * 2
        try {
          doc.addImage(photo.data, photo.format, data.cell.x + pad, data.cell.y + pad, size, size, undefined, "FAST")
        } catch {
          /* skip broken product image */
        }
      },
    })

    y = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 10
    y += 6

    if (y > 248) {
      doc.addPage()
      y = 22
    }

    if (showPrices) {
      const boxW = 72
      const boxX = pageWidth - right - boxW
      doc.setDrawColor(...GOLD)
      doc.setLineWidth(0.7)
      doc.line(boxX, y, pageWidth - right, y)
      y += 7
      doc.setFont("helvetica", "bold")
      doc.setFontSize(8)
      doc.setTextColor(...MUTED)
      doc.text("TOTAL", boxX, y)
      doc.setTextColor(...INK)
      doc.setFontSize(13)
      doc.text(formatPkr(grandTotal), pageWidth - right, y, { align: "right" })
      y += 10
    }

    if (y > 255) {
      doc.addPage()
      y = 22
    }

    doc.setDrawColor(...LINE)
    doc.setLineWidth(0.3)
    doc.line(left, y, pageWidth - right, y)
    y += 6
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7.5)
    doc.setTextColor(...INK)
    doc.text("Terms", left, y)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(...MUTED)
    const terms = doc.splitTextToSize(
      showPrices
        ? "Prices are in Pakistani Rupees (PKR). Stock availability is subject to confirmation at order time."
        : "Stock availability is subject to confirmation at order time.",
      contentWidth * 0.58,
    )
    doc.text(terms, left, y + 4.5)

    doc.setTextColor(...INK)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.text(COMPANY.name, pageWidth - right, y, { align: "right" })
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(...MUTED)
    const companyLines = doc.splitTextToSize(COMPANY.address, 70)
    doc.text(companyLines, pageWidth - right, y + 4.5, { align: "right" })

    const pageCount = doc.getNumberOfPages()
    for (let page = 1; page <= pageCount; page++) {
      doc.setPage(page)
      drawChrome(page, pageCount)
    }

    return Buffer.from(doc.output("arraybuffer"))
  } catch (error) {
    console.error("PDF generation failed, using text fallback:", error)
    return createSimpleTextPdf(quotation, items)
  }
}

function createSimpleTextPdf(quotation: PdfQuotation, items: PdfItem[]): Buffer {
  const ref = quotationRefDisplay(quotation, quotation.quotationNo)
  const lines = [
    COMPANY.name,
    "QUOTATION",
    ref,
    `Status: ${quotation.status}`,
    `Customer: ${quotation.customerName}`,
    `Phone: ${quotation.customerPhone}`,
    `Address: ${quotation.customerAddress}`,
    "",
    ...items.map((item, i) =>
      quotation.showPrices === false
        ? `${i + 1}. ${item.productName || "Product"} (${item.productId}) x${item.quantity}`
        : `${i + 1}. ${item.productName || "Product"} (${item.productId}) x${item.quantity} @ ${item.price} = ${item.quantity * item.price}`,
    ),
    "",
    ...(quotation.showPrices === false ? [] : [`Total: PKR ${quotation.totalAmount}`]),
    "",
    COMPANY.phoneDisplay,
    COMPANY.email,
    COMPANY.website,
  ]

  const content = lines.join("\n")
  const escaped = content.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
  const stream = `BT /F1 10 Tf 40 750 Td 12 TL (${escaped.replace(/\n/g, ") Tj T* (")}) Tj ET`
  const pdf = `%PDF-1.4
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >>endobj
4 0 obj<< /Length ${stream.length} >>stream
${stream}
endstream
endobj
5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000000 65535 f 
trailer<< /Size 6 /Root 1 0 R >>
startxref
0
%%EOF`

  return Buffer.from(pdf)
}
