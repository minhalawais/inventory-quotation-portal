import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"

import clientPromise from "@/lib/mongodb"
import { quotationShowsPrices, resolveStoredProductImages } from "@/lib/quotation"
import { generateQuotationPdf } from "@/lib/quotation-pdf"
import { ensureQuotationNumber, quotationPdfFilename } from "@/lib/quotation-number"

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid quotation ID" }, { status: 400 })
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

    const quotationNo = await ensureQuotationNumber(db, {
      _id: quotation._id,
      createdAt: quotation.createdAt,
      quotationNo: quotation.quotationNo,
    })
    const showPrices = quotationShowsPrices(quotation.showPrices)

    const itemsWithDetails = await Promise.all(
      quotation.items.map(async (item: {
        productId: ObjectId
        quantity: number
        price: number
        productImage?: string
        productImages?: string[]
      }) => {
        const product = await products.findOne({ _id: new ObjectId(item.productId) })
        const productImages = resolveStoredProductImages(item, product)
        return {
          productName: product?.name || "Unknown Product",
          productId: product?.productId || "N/A",
          quantity: item.quantity,
          price: showPrices ? item.price : 0,
          productImage: productImages[0] || "",
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

    const pdfBuffer = await generateQuotationPdf(
      {
        ...quotation,
        rider,
        showPrices,
        quotationNo,
        totalAmount: showPrices ? quotation.totalAmount : 0,
      },
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
        "Cache-Control": "public, max-age=300",
      },
    })
  } catch (error) {
    console.error("Public PDF generation error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
