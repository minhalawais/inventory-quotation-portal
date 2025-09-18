import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const quotations = db.collection("quotations")
    const products = db.collection("products")

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

    // Use the same reliable PDF generation function
    const pdfBuffer = await generateReliablePDF(quotation, itemsWithDetails)

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="quotation-${quotation.customerName.replace(/\s+/g, "-")}-${params.id.slice(-6)}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("PDF generation error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

async function generateReliablePDF(quotation: any, items: any[]): Promise<Buffer> {
  try {
    const { jsPDF } = await import("jspdf")
    // @ts-ignore
    await import("jspdf-autotable")

    // Create new PDF document with better margins
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    // Define design constants
    const colors = {
      primary: [30, 58, 138],     // #1E3A8A (dark blue)
      secondary: [30, 58, 138],   // #1E3A8A (same as primary)
      success: [16, 185, 129],    // #10B981
      error: [239, 68, 68],       // #EF4444
      neutral: [243, 244, 246],   // #F3F4F6 (light grey)
      neutralDark: [229, 231, 235], // #E5E7EB (medium grey)
      text: [75, 85, 99],         // #4B5563
      textDark: [31, 41, 55],     // #1F2937
      border: [209, 213, 219],    // #D1D5DB
      white: [255, 255, 255]      // #FFFFFF
    }

    const margins = {
      left: 15,
      right: 15,
      top: 10
    }

    const pageWidth = 210
    const contentWidth = pageWidth - margins.left - margins.right

    // Helper functions
    const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number, fill = false, stroke = false) => {
      doc.roundedRect(x, y, w, h, r, r, fill ? 'F' : stroke ? 'S' : undefined)
    }

    // HEADER SECTION - Modern design with brand identity
    // Background with primary color
    doc.setFillColor(...colors.primary)
    drawRoundedRect(margins.left, margins.top, contentWidth, 45, 3, true)

    // Logo placeholder (white circle with initials)
    doc.setFillColor(...colors.white)
    doc.circle(margins.left + 15, margins.top + 22, 10, 'F')
    doc.setTextColor(...colors.primary)
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("IP", margins.left + 15, margins.top + 25, { align: "center" })

    // Company name and tagline
    doc.setTextColor(...colors.white)
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text("INVENTORY PORTAL", margins.left + 35, margins.top + 18)
    
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text("Professional Inventory & Quotation Management", margins.left + 35, margins.top + 26)

    // Quotation badge on the right
    doc.setFillColor(...colors.white)
    drawRoundedRect(pageWidth - margins.right - 50, margins.top + 12, 45, 20, 2, true)
    doc.setTextColor(...colors.primary)
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("QUOTATION", pageWidth - margins.right - 27.5, margins.top + 24, { align: "center" })

    let yPos = margins.top + 55

    // QUOTATION INFO BAR - Modern card design with grey background
    doc.setFillColor(...colors.neutral)
    drawRoundedRect(margins.left, yPos, contentWidth, 20, 2, true)
    
    // Quotation ID
    doc.setFillColor(...colors.primary)
    drawRoundedRect(margins.left + 5, yPos + 5, 50, 10, 2, true)
    doc.setTextColor(...colors.white)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text(`#${quotation._id.toString().slice(-8).toUpperCase()}`, margins.left + 30, yPos + 11, { align: "center" })

    // Status badge with appropriate color
    const statusColors = {
      'pending': colors.error,
      'sent': colors.primary,
      'completed': colors.success,
      'cancelled': colors.text
    }
    const statusColor = statusColors[quotation.status] || colors.text
    
    doc.setFillColor(...statusColor)
    drawRoundedRect(margins.left + 60, yPos + 5, 35, 10, 2, true)
    doc.setTextColor(...colors.white)
    doc.text(quotation.status.toUpperCase(), margins.left + 77.5, yPos + 11, { align: "center" })

    // Date on the right
    doc.setTextColor(...colors.textDark)
    doc.setFont("helvetica", "normal")
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margins.right - 5, yPos + 11, { align: "right" })

    yPos += 30

    // CUSTOMER & PREPARED BY SECTION - Two column layout
    const columnWidth = (contentWidth - 10) / 2
    
    // Customer Information Card with grey background
    doc.setFillColor(...colors.neutral)
    doc.setDrawColor(...colors.border)
    drawRoundedRect(margins.left, yPos, columnWidth, 65, 3, true, true)
    
    // Customer header with primary color
    doc.setFillColor(...colors.primary)
    drawRoundedRect(margins.left, yPos, columnWidth, 12, 3, true)
    doc.setTextColor(...colors.white)
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("BILL TO", margins.left + 5, yPos + 8)

    // Customer details
    doc.setTextColor(...colors.textDark)
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    let customerY = yPos + 20
    
    // Name with icon
    doc.setFillColor(...colors.primary)
    doc.circle(margins.left + 8, customerY, 3, 'F')
    doc.setFont("helvetica", "bold")
    doc.text(quotation.customerName, margins.left + 15, customerY + 1)
    
    customerY += 12
    // Phone with icon
    doc.setFillColor(...colors.primary)
    doc.circle(margins.left + 8, customerY, 3, 'F')
    doc.setFont("helvetica", "normal")
    doc.text(quotation.customerPhone, margins.left + 15, customerY + 1)
    
    customerY += 12
    // Address with icon
    doc.setFillColor(...colors.primary)
    doc.circle(margins.left + 8, customerY, 3, 'F')
    const addressLines = doc.splitTextToSize(quotation.customerAddress, columnWidth - 20)
    doc.text(addressLines, margins.left + 15, customerY + 1)

    // Prepared By Card (if rider exists) with grey background
    if (quotation.rider) {
      doc.setFillColor(...colors.neutral)
      doc.setDrawColor(...colors.border)
      drawRoundedRect(margins.left + columnWidth + 10, yPos, columnWidth, 65, 3, true, true)
      
      // Prepared by header with primary color
      doc.setFillColor(...colors.primary)
      drawRoundedRect(margins.left + columnWidth + 10, yPos, columnWidth, 12, 3, true)
      doc.setTextColor(...colors.white)
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.text("PREPARED BY", margins.left + columnWidth + 15, yPos + 8)

      // Rider details
      doc.setTextColor(...colors.textDark)
      doc.setFontSize(9)
      let riderY = yPos + 20
      
      // Name with icon
      doc.setFillColor(...colors.primary)
      doc.circle(margins.left + columnWidth + 18, riderY, 3, 'F')
      doc.setFont("helvetica", "bold")
      doc.text(quotation.rider.name, margins.left + columnWidth + 25, riderY + 1)
      
      if (quotation.rider.phone) {
        riderY += 12
        doc.setFillColor(...colors.primary)
        doc.circle(margins.left + columnWidth + 18, riderY, 3, 'F')
        doc.setFont("helvetica", "normal")
        doc.text(quotation.rider.phone, margins.left + columnWidth + 25, riderY + 1)
      }
      
      if (quotation.rider.email) {
        riderY += 12
        doc.setFillColor(...colors.primary)
        doc.circle(margins.left + columnWidth + 18, riderY, 3, 'F')
        doc.text(quotation.rider.email, margins.left + columnWidth + 25, riderY + 1)
      }
    } else {
      // Quotation Details Card with grey background (if no rider)
      doc.setFillColor(...colors.neutral)
      doc.setDrawColor(...colors.border)
      drawRoundedRect(margins.left + columnWidth + 10, yPos, columnWidth, 65, 3, true, true)
      
      // Header with primary color
      doc.setFillColor(...colors.primary)
      drawRoundedRect(margins.left + columnWidth + 10, yPos, columnWidth, 12, 3, true)
      doc.setTextColor(...colors.white)
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.text("QUOTATION DETAILS", margins.left + columnWidth + 15, yPos + 8)

      // Details content
      doc.setTextColor(...colors.textDark)
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      
      let detailsY = yPos + 20
      
      // Date created with icon
      doc.setFillColor(...colors.primary)
      doc.circle(margins.left + columnWidth + 15, detailsY, 3, 'F')
      doc.text(`Created: ${new Date(quotation.createdAt).toLocaleDateString()}`, margins.left + columnWidth + 22, detailsY + 1)
      
      detailsY += 10
      // Valid until with icon
      doc.setFillColor(...colors.primary)
      doc.circle(margins.left + columnWidth + 15, detailsY, 3, 'F')
      doc.text(`Valid Until: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}`, margins.left + columnWidth + 22, detailsY + 1)
      
      detailsY += 10
      // Total items with icon
      doc.setFillColor(...colors.primary)
      doc.circle(margins.left + columnWidth + 15, detailsY, 3, 'F')
      doc.text(`Total Items: ${items.length}`, margins.left + columnWidth + 22, detailsY + 1)
    }

    yPos += 75

    // ITEMS TABLE - Modern design with better spacing
    doc.setFillColor(...colors.primary)
    drawRoundedRect(margins.left, yPos, contentWidth, 12, 3, true)
    
    doc.setTextColor(...colors.white)
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("ITEMS & SERVICES", pageWidth / 2, yPos + 8, { align: "center" })
    
    yPos += 15

    // Table header with grey background
    doc.setFillColor(...colors.neutral)
    doc.rect(margins.left, yPos, contentWidth, 10, 'F')
    
    doc.setTextColor(...colors.textDark)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    
    // Column headers with better spacing
    const columns = {
      image: { x: margins.left + 3, width: 15, label: "Image" },
      id: { x: margins.left + 20, width: 30, label: "Product ID" },
      name: { x: margins.left + 52, width: 65, label: "Description" },
      qty: { x: margins.left + 119, width: 20, label: "Qty" },
      price: { x: margins.left + 141, width: 25, label: "Unit Price" },
      total: { x: margins.left + 168, width: 25, label: "Total" }
    }
    
    Object.values(columns).forEach(col => {
      doc.text(col.label, col.x, yPos + 7)
    })
    
    yPos += 13

    // Table rows with alternating colors and images
    doc.setFont("helvetica", "normal")
    let totalAmount = 0

    for (const [index, item] of items.entries()) {
      const rowTotal = item.quantity * item.price
      totalAmount += rowTotal

      // Check for page break
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      // Alternating row background
      if (index % 2 === 0) {
        doc.setFillColor(...colors.neutral)
        doc.rect(margins.left, yPos - 3, contentWidth, 18, 'F')
      }

      // Product image or placeholder
      if (item.productImage) {
        try {
          const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
          const imageUrl = item.productImage.startsWith('http') 
            ? item.productImage 
            : `${baseUrl}${item.productImage}`
          
          const response = await fetch(imageUrl)
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer()
            const base64String = Buffer.from(arrayBuffer).toString('base64')
            const imageType = imageUrl.split('.').pop()?.toLowerCase() || 'jpeg'
            
            // Add rounded image
            doc.addImage(`data:image/${imageType};base64,${base64String}`, imageType, columns.image.x, yPos - 1, 12, 12)
          }
        } catch (error) {
          // Fallback placeholder
          doc.setFillColor(...colors.border)
          drawRoundedRect(columns.image.x, yPos - 1, 12, 12, 1, true)
          doc.setTextColor(...colors.text)
          doc.setFontSize(6)
          doc.text("No Image", columns.image.x + 6, yPos + 5, { align: "center" })
        }
      } else {
        // No image placeholder
        doc.setFillColor(...colors.border)
        drawRoundedRect(columns.image.x, yPos - 1, 12, 12, 1, true)
        doc.setTextColor(...colors.text)
        doc.setFontSize(6)
        doc.text("No Image", columns.image.x + 6, yPos + 5, { align: "center" })
      }

      // Product details
      doc.setTextColor(...colors.textDark)
      doc.setFontSize(8)
      
      // Product ID with monospace style
      doc.setFont("courier", "bold")
      doc.text(item.productId.toString().substring(0, 12), columns.id.x, yPos + 5)
      
      // Product name
      doc.setFont("helvetica", "normal")
      const productName = item.productName.substring(0, 30)
      doc.text(productName, columns.name.x, yPos + 5)
      
      // Quantity with emphasis
      doc.setFont("helvetica", "bold")
      doc.text(item.quantity.toString(), columns.qty.x + 5, yPos + 5, { align: "center" })
      
      // Prices
      doc.setFont("helvetica", "normal")
      doc.text(`${item.price.toLocaleString()}`, columns.price.x + 5, yPos + 5)
      
      doc.setFont("helvetica", "bold")
      doc.setTextColor(...colors.primary)
      doc.text(`${rowTotal.toLocaleString()}`, columns.total.x + 5, yPos + 5, { align: "right" })

      yPos += 18
    }

    yPos += 5

    // TOTAL SECTION - Modern summary card with grey background
    const summaryWidth = 80
    const summaryX = pageWidth - margins.right - summaryWidth

    // Summary background
    doc.setFillColor(...colors.neutral)
    drawRoundedRect(summaryX, yPos, summaryWidth, 45, 3, true)
    
    // Summary header with primary color
    doc.setFillColor(...colors.primary)
    drawRoundedRect(summaryX, yPos, summaryWidth, 10, 3, true)
    doc.setTextColor(...colors.white)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text("PAYMENT SUMMARY", summaryX + 40, yPos + 7, { align: "center" })

    // Summary details
    doc.setTextColor(...colors.text)
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    
    let summaryY = yPos + 15
    doc.text("Subtotal:", summaryX + 5, summaryY)
    doc.text(`PKR ${quotation.totalAmount.toLocaleString()}`, summaryX + summaryWidth - 5, summaryY, { align: "right" })
    
    summaryY += 6
    doc.text("Tax (0%):", summaryX + 5, summaryY)
    doc.text("PKR 0", summaryX + summaryWidth - 5, summaryY, { align: "right" })
    
    // Divider line
    summaryY += 5
    doc.setDrawColor(...colors.border)
    doc.line(summaryX + 5, summaryY, summaryX + summaryWidth - 5, summaryY)
    
    // Grand total
    summaryY += 7
    doc.setTextColor(...colors.primary)
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("GRAND TOTAL:", summaryX + 5, summaryY)
    doc.text(`PKR ${quotation.totalAmount.toLocaleString()}`, summaryX + summaryWidth - 5, summaryY, { align: "right" })

    // TERMS & CONDITIONS - Modern accordion style with grey background
    yPos += 55

    if (yPos > 220) {
      doc.addPage()
      yPos = 20
    }

    doc.setFillColor(...colors.neutral)
    doc.setDrawColor(...colors.border)
    drawRoundedRect(margins.left, yPos, contentWidth, 55, 3, true, true)
    
    // Terms header with primary color
    doc.setFillColor(...colors.primary)
    drawRoundedRect(margins.left, yPos, contentWidth, 10, 3, true)
    doc.setTextColor(...colors.white)
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("TERMS & CONDITIONS", margins.left + 5, yPos + 7)

    // Terms content
    doc.setTextColor(...colors.text)
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    
    const terms = [
      "• This quotation is valid for 30 days from the date of issue",
      "• Prices are subject to change without prior notice",
      "• Payment terms: 50% advance, 50% on delivery",
      "• Delivery time: 7-14 business days after order confirmation",
      "• All prices are in Pakistani Rupees (PKR)",
      "• Returns accepted within 7 days in original condition"
    ]
    
    let termsY = yPos + 15
    terms.forEach(term => {
      doc.text(term, margins.left + 5, termsY)
      termsY += 6
    })

    // FOOTER - Professional contact section with primary color
    yPos += 65

    // Footer background
    doc.setFillColor(...colors.primary)
    drawRoundedRect(margins.left, yPos, contentWidth, 25, 3, true)
    
    // Footer content - centered
    doc.setTextColor(...colors.white)
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("INVENTORY PORTAL", pageWidth / 2, yPos + 8, { align: "center" })
    
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.text("info@inventoryportal.com | +92-300-1234567 | www.inventoryportal.com", pageWidth / 2, yPos + 14, { align: "center" })
    
    doc.setFontSize(9)
    doc.setFont("helvetica", "italic")
    doc.text("Thank you for your business!", pageWidth / 2, yPos + 20, { align: "center" })

    // Add page numbers if multiple pages
    const pageCount = doc.getNumberOfPages()
    if (pageCount > 1) {
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setTextColor(...colors.text)
        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 287, { align: "center" })
      }
    }

    // Convert to buffer
    const pdfArrayBuffer = doc.output("arraybuffer")
    return Buffer.from(pdfArrayBuffer)
  } catch (error) {
    console.error("Enhanced PDF generation failed:", error)
    // Fallback to simple PDF
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