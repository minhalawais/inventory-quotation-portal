import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "manager" && session.user.role !== "product_manager")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { updates } = body // Array of { id, isOutOfStock }

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const products = db.collection("products")

    // Perform bulk updates
    const bulkOps = updates.map((update: { id: string; isOutOfStock: boolean }) => ({
      updateOne: {
        filter: { _id: new ObjectId(update.id) },
        update: {
          $set: {
            isOutOfStock: update.isOutOfStock,
            updatedAt: new Date(),
          },
        },
      },
    }))

    const result = await products.bulkWrite(bulkOps)

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
    })
  } catch (error) {
    console.error("Bulk update error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
