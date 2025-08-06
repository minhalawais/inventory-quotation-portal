import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
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

// Import the same function from the public route
// Update the generateReliablePDF function in route.ts
async function generateReliablePDF(quotation: any, items: any[]): Promise<Buffer> {
  try {
    // Import both jsPDF and the image handling utilities
    const { jsPDF } = await import("jspdf")
    // @ts-ignore - This is a workaround for jsPDF's lack of TypeScript support for addImage options
    await import("jspdf-autotable")

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

    // Header (same as before)
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
    doc.text("Image", 22, yPos)
    doc.text("Description", 45, yPos)
    doc.text("Qty", 120, yPos)
    doc.text("Unit Price", 135, yPos)
    doc.text("Total", 165, yPos)

    yPos += 12

    // Table rows
    doc.setTextColor(...textColor)
    let totalAmount = 0

    for (const [index, item] of items.entries()) {
      const rowTotal = item.quantity * item.price
      totalAmount += rowTotal

      // Alternate row background
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251) // Light gray
        doc.rect(20, yPos - 4, 170, 20, "F") // Increased row height for images
      }

      // Add product image if available
     // Update the image fetching part in generateReliablePDF function
if (item.productImage) {
  try {
    // Construct the full URL for the image
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const imageUrl = item.productImage.startsWith('http') 
      ? item.productImage 
      : `${baseUrl}${item.productImage}`;
    
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Image fetch failed');
    
    const arrayBuffer = await response.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString('base64');
    const imageType = imageUrl.split('.').pop()?.toLowerCase() || 'jpeg';
    
    // Add image to PDF
    doc.addImage(`data:image/${imageType};base64,${base64String}`, imageType, 22, yPos - 2, 10, 10);
  } catch (error) {
    console.error('Error adding product image:', error);
    // Fallback to placeholder
    doc.setFillColor(200, 200, 200);
    doc.rect(22, yPos - 2, 10, 10, 'F');
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(6);
    doc.text('No Image', 22, yPos + 3);
    doc.setFontSize(9);
    doc.setTextColor(...textColor);
  }
} else {
        // Placeholder for no image
        doc.setFillColor(200, 200, 200)
        doc.rect(22, yPos - 2, 10, 10, 'F')
        doc.setTextColor(100, 100, 100)
        doc.setFontSize(6)
        doc.text('No Image', 22, yPos + 3)
        doc.setFontSize(9)
        doc.setTextColor(...textColor)
      }

      // Product details
      doc.text(item.productId.toString(), 35, yPos + 3)
      doc.text(item.productName.substring(0, 20), 45, yPos + 3) // Truncate long names
      doc.text(item.quantity.toString(), 122, yPos + 3)
      doc.text(`PKR ${item.price.toLocaleString()}`, 137, yPos + 3)
      doc.text(`PKR ${rowTotal.toLocaleString()}`, 167, yPos + 3)

      yPos += 20 // Increased row height

      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }
    }

    // Rest of the PDF generation remains the same...
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
    // Fallback to simple text PDF
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
