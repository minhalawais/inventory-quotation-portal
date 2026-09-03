import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { ObjectId } from "mongodb"

import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { generateQuotationPdf } from "@/lib/quotation-pdf"
import { classificationFromProduct } from "@/lib/quotation-catalog"
import { ensureQuotationNumber, quotationPdfFilename } from "@/lib/quotation-number"

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const quotations = db.collection("quotations")
    const products = db.collection("products")
    const users = db.collection("users")

    const quotation = await quotations.findOne({ _id: new ObjectId(params.id) })
    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
    }

    const itemsWithDetails = await Promise.all(
      quotation.items.map(async (item: { productId: ObjectId; quantity: number; price: number; productImage?: string }) => {
        const product = await products.findOne({ _id: new ObjectId(item.productId) })
        return {
          ...item,
          productName: product?.name || "Unknown Product",
          productId: product?.productId || "N/A",
          productImage:
            item.productImage ||
            (product?.imagePaths?.[0] as string | undefined) ||
            (product?.imagePath as string | undefined),
          ...classificationFromProduct(product),
        }
      }),
    )

    let rider = null
    if (quotation.riderId) {
      const riderDoc = await users.findOne({ _id: new ObjectId(quotation.riderId) })
      if (riderDoc) {
        rider = {
          name: riderDoc.name,
          email: riderDoc.email,
          phone: riderDoc.contact,
        }
      }
    }

    const quotationNo = await ensureQuotationNumber(db, {
      _id: quotation._id,
      createdAt: quotation.createdAt,
      quotationNo: quotation.quotationNo,
    })

    const pdfBuffer = await generateQuotationPdf(
      { ...quotation, rider, showPrices: true, quotationNo },
      itemsWithDetails,
    )
    const filename = quotationPdfFilename({
      customerName: quotation.customerName,
      quotationNo,
      _id: quotation._id,
    })

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("PDF generation error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
