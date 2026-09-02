import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"

import clientPromise from "@/lib/mongodb"

const MAX_QTY = 100000

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid quotation" }, { status: 400 })
    }

    const body = await request.json()
    const requested = Array.isArray(body.items) ? body.items : null
    if (!requested) {
      return NextResponse.json({ error: "Items are required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const quotations = db.collection("quotations")
    const products = db.collection("products")

    const quotation = await quotations.findOne({ _id: new ObjectId(params.id) })
    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
    }

    if (quotation.status === "completed" || quotation.status === "cancelled") {
      return NextResponse.json({ error: "This quotation can no longer be changed" }, { status: 409 })
    }

    if (quotation.status !== "sent" && quotation.status !== "returned") {
      return NextResponse.json({ error: "This quotation is not open for quantity changes" }, { status: 409 })
    }

    if (requested.length !== quotation.items.length) {
      return NextResponse.json({ error: "You can only change quantities for listed products" }, { status: 400 })
    }

    let changed = false
    const nextItems = []

    for (let i = 0; i < quotation.items.length; i++) {
      const current = quotation.items[i]
      const qty = Number.parseInt(String(requested[i]?.quantity), 10)
      if (!Number.isFinite(qty) || qty < 1 || qty > MAX_QTY) {
        return NextResponse.json({ error: "Enter a valid quantity for each product" }, { status: 400 })
      }

      const product = await products.findOne({ _id: new ObjectId(current.productId) })
      const catalogId = product?.productId || "N/A"
      if (String(requested[i]?.productId) !== String(catalogId)) {
        return NextResponse.json({ error: "Products on this quotation cannot be replaced" }, { status: 400 })
      }

      if (qty !== current.quantity) changed = true
      nextItems.push({
        ...current,
        quantity: qty,
        sentQuantity: current.sentQuantity ?? current.quantity,
      })
    }

    if (!changed) {
      return NextResponse.json({ error: "Change at least one quantity before sending back" }, { status: 400 })
    }

    const totalAmount = nextItems.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.price || 0),
      0,
    )

    await quotations.updateOne(
      { _id: quotation._id },
      {
        $set: {
          items: nextItems,
          totalAmount,
          status: "returned",
          returnedAt: new Date(),
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json({ success: true, status: "returned", totalAmount })
  } catch (error) {
    console.error("Public quotation return error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
