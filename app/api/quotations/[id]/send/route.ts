import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const quotations = db.collection("quotations")

    const quotation = await quotations.findOne({ _id: new ObjectId(params.id) })
    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
    }

    const items = (quotation.items || []).map((item: { quantity?: number; sentQuantity?: number }) => ({
      ...item,
      sentQuantity: item.quantity,
    }))

    const result = await quotations.updateOne(
      { _id: quotation._id },
      {
        $set: {
          items,
          status: "sent",
          sentAt: new Date(),
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Send quotation error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
