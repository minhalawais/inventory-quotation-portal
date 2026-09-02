import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

import { isQuotationStatus } from "@/lib/quotation"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body

    if (!isQuotationStatus(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const quotations = db.collection("quotations")

    const quotation = await quotations.findOne({ _id: new ObjectId(params.id) })
    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
    }

    const update: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    }

    if (status === "sent") {
      update.sentAt = new Date()
      update.items = (quotation.items || []).map((item: { quantity?: number }) => ({
        ...item,
        sentQuantity: item.quantity,
      }))
    }

    const result = await quotations.updateOne(
      { _id: quotation._id },
      { $set: update },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Status update error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}