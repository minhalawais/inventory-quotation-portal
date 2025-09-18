import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const products = db.collection("products")

    // Get out of stock products (isOutOfStock = true)
    const outOfStockProducts = await products.find({ isOutOfStock: true }).toArray()

    return NextResponse.json(outOfStockProducts)
  } catch (error) {
    console.error("Out of stock products API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
