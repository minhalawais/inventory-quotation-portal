import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db("inventory_portal")
    const quotations = db.collection("quotations")
    const products = db.collection("products")

    // Validate quotation ID format
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid quotation ID" }, { status: 400 })
    }

    const quotation = await quotations.findOne({ _id: new ObjectId(params.id) })

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
    }

    // Get product details for each item
    const itemsWithDetails = await Promise.all(
      quotation.items.map(async (item: any) => {
        const product = await products.findOne({ _id: new ObjectId(item.productId) })
        return {
          ...item,
          productName: product?.name || "Unknown Product",
          productId: product?.productId || "N/A",
        }
      }),
    )

    // Generate PDF using reliable method
    const pdfBuffer = await generateReliablePDF(quotation, itemsWithDetails)

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="quotation-${quotation.customerName.replace(/\s+/g, "-")}-${params.id.slice(-6)}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error) {
    console.error("Public PDF generation error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

async function generateReliablePDF(quotation: any, items: any[]): Promise<Buffer> {
  try {
    // Use jsPDF for reliable PDF generation
    const { jsPDF } = await import("jspdf")

    // Create new PDF document
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    // Set font
    doc.setFont("helvetica")

    // Colors
    const primaryColor = [37, 99, 235] // Blue
    const secondaryColor = [107, 114, 128] // Gray
    const textColor = [31, 41, 55] // Dark gray

    // Header
    doc.setFontSize(24)
    doc.setTextColor(...primaryColor)
    doc.text("Inventory Portal", 105, 25, { align: "center" })

    doc.setFontSize(12)
    doc.setTextColor(...secondaryColor)
    doc.text("Professional Inventory & Quotation Management", 105, 35, { align: "center" })

    doc.setFontSize(20)
    doc.setTextColor(...primaryColor)
    doc.text("QUOTATION", 105, 50, { align: "center" })

    doc.setFontSize(12)
    doc.setTextColor(...textColor)
    doc.text(`#${quotation._id.toString().slice(-8).toUpperCase()}`, 105, 60, { align: "center" })
    doc.text(`Status: ${quotation.status.toUpperCase()}`, 105, 68, { align: "center" })

    // Line separator
    doc.setDrawColor(...primaryColor)
    doc.setLineWidth(1)
    doc.line(20, 75, 190, 75)

    let yPos = 90

    // Customer Information
    doc.setFontSize(14)
    doc.setTextColor(...primaryColor)
    doc.text("Bill To:", 20, yPos)

    doc.setFontSize(11)
    doc.setTextColor(...textColor)
    yPos += 8
    doc.text(`Name: ${quotation.customerName}`, 20, yPos)
    yPos += 6
    doc.text(`Phone: ${quotation.customerPhone}`, 20, yPos)
    yPos += 6
    doc.text(`Address: ${quotation.customerAddress}`, 20, yPos)

    // Quotation Details (right side)
    doc.setFontSize(14)
    doc.setTextColor(...primaryColor)
    doc.text("Quotation Details:", 120, 90)

    doc.setFontSize(11)
    doc.setTextColor(...textColor)
    doc.text(`Date: ${new Date(quotation.createdAt).toLocaleDateString()}`, 120, 98)
    doc.text(`Valid Until: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}`, 120, 104)
    doc.text(`Items: ${items.length}`, 120, 110)

    yPos = Math.max(yPos, 110) + 15

    // Items Table Header
    doc.setFontSize(14)
    doc.setTextColor(...primaryColor)
    doc.text("Items & Services", 105, yPos, { align: "center" })
    yPos += 10

    // Table header background
    doc.setFillColor(...primaryColor)
    doc.rect(20, yPos - 5, 170, 8, "F")

    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255) // White text
    doc.text("Product ID", 22, yPos)
    doc.text("Description", 55, yPos)
    doc.text("Qty", 120, yPos)
    doc.text("Unit Price", 135, yPos)
    doc.text("Total", 165, yPos)

    yPos += 12

    // Table rows
    doc.setTextColor(...textColor)
    let totalAmount = 0

    items.forEach((item, index) => {
      const rowTotal = item.quantity * item.price
      totalAmount += rowTotal

      // Alternate row background
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251) // Light gray
        doc.rect(20, yPos - 4, 170, 7, "F")
      }

      doc.setFontSize(9)
      doc.text(item.productId.toString(), 22, yPos)
      doc.text(item.productName.substring(0, 25), 55, yPos) // Truncate long names
      doc.text(item.quantity.toString(), 122, yPos)
      doc.text(`PKR ${item.price.toLocaleString()}`, 137, yPos)
      doc.text(`PKR ${rowTotal.toLocaleString()}`, 167, yPos)

      yPos += 7

      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }
    })

    yPos += 10

    // Total Section
    doc.setDrawColor(...primaryColor)
    doc.setLineWidth(0.5)
    doc.line(120, yPos, 190, yPos)
    yPos += 8

    doc.setFontSize(11)
    doc.setTextColor(...textColor)
    doc.text("Subtotal:", 140, yPos)
    doc.text(`PKR ${quotation.totalAmount.toLocaleString()}`, 170, yPos)
    yPos += 6

    doc.text("Tax (0%):", 140, yPos)
    doc.text("PKR 0", 170, yPos)
    yPos += 8

    // Grand Total
    doc.setDrawColor(...primaryColor)
    doc.setLineWidth(1)
    doc.line(120, yPos, 190, yPos)
    yPos += 8

    doc.setFontSize(14)
    doc.setTextColor(...primaryColor)
    doc.text("Grand Total:", 140, yPos)
    doc.text(`PKR ${quotation.totalAmount.toLocaleString()}`, 170, yPos)

    yPos += 20

    // Terms and Conditions
    if (yPos > 220) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(12)
    doc.setTextColor(...primaryColor)
    doc.text("Terms & Conditions:", 20, yPos)
    yPos += 8

    doc.setFontSize(9)
    doc.setTextColor(...textColor)
    const terms = [
      "• This quotation is valid for 30 days from the date of issue.",
      "• Prices are subject to change without prior notice.",
      "• Payment terms: 50% advance, 50% on delivery.",
      "• Delivery time: 7-14 business days after order confirmation.",
      "• All prices are in Pakistani Rupees (PKR).",
      "• Returns are accepted within 7 days of delivery in original condition.",
    ]

    terms.forEach((term) => {
      doc.text(term, 20, yPos)
      yPos += 5
    })

    yPos += 10

    // Footer
    doc.setDrawColor(...secondaryColor)
    doc.setLineWidth(0.5)
    doc.line(20, yPos, 190, yPos)
    yPos += 8

    doc.setFontSize(12)
    doc.setTextColor(...primaryColor)
    doc.text("Inventory Portal", 105, yPos, { align: "center" })
    yPos += 6

    doc.setFontSize(9)
    doc.setTextColor(...secondaryColor)
    doc.text("Email: info@inventoryportal.com | Phone: +92-300-1234567", 105, yPos, { align: "center" })
    yPos += 4
    doc.text("Website: www.inventoryportal.com", 105, yPos, { align: "center" })
    yPos += 6
    doc.text("Thank you for your business!", 105, yPos, { align: "center" })

    // Convert to buffer
    const pdfArrayBuffer = doc.output("arraybuffer")
    return Buffer.from(pdfArrayBuffer)
  } catch (error) {
    console.error("jsPDF generation failed:", error)

    // Ultimate fallback - create a simple text-based PDF
    return createSimpleTextPDF(quotation, items)
  }
}

function createSimpleTextPDF(quotation: any, items: any[]): Buffer {
  // Create a proper PDF with basic structure
  const content = `
INVENTORY PORTAL
Professional Inventory & Quotation Management

QUOTATION #${quotation._id.toString().slice(-8).toUpperCase()}
Status: ${quotation.status.toUpperCase()}

BILL TO:
Name: ${quotation.customerName}
Phone: ${quotation.customerPhone}
Address: ${quotation.customerAddress}

QUOTATION DETAILS:
Date: ${new Date(quotation.createdAt).toLocaleDateString()}
Valid Until: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}

ITEMS & SERVICES:
${items
  .map(
    (item, index) =>
      `${index + 1}. ${item.productId} - ${item.productName}
     Quantity: ${item.quantity} | Unit Price: PKR ${item.price.toLocaleString()} | Total: PKR ${(item.quantity * item.price).toLocaleString()}`,
  )
  .join("\n")}

TOTAL SUMMARY:
Subtotal: PKR ${quotation.totalAmount.toLocaleString()}
Tax (0%): PKR 0
Grand Total: PKR ${quotation.totalAmount.toLocaleString()}

TERMS & CONDITIONS:
• This quotation is valid for 30 days from the date of issue.
• Prices are subject to change without prior notice.
• Payment terms: 50% advance, 50% on delivery.
• Delivery time: 7-14 business days after order confirmation.
• All prices are in Pakistani Rupees (PKR).
• Returns are accepted within 7 days of delivery in original condition.

CONTACT:
Inventory Portal
Email: info@inventoryportal.com | Phone: +92-300-1234567
Website: www.inventoryportal.com
Thank you for your business!
`

  // Create a proper PDF structure
  const pdfHeader = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj

4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj

5 0 obj
<< /Length ${content.length + 100} >>
stream
BT
/F1 12 Tf
50 750 Td
`

  const pdfContent = content
    .split("\n")
    .map((line, index) => {
      const yPos = 750 - index * 15
      return `(${line.replace(/[()\\]/g, "")}) Tj 0 -15 Td`
    })
    .join("\n")

  const pdfFooter = `
ET
endstream
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000351 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${600 + content.length}
%%EOF`

  const fullPdf = pdfHeader + pdfContent + pdfFooter
  return Buffer.from(fullPdf, "utf-8")
}
