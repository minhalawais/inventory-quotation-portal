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

    const { searchParams } = new URL(request.url)
    const lowStock = searchParams.get("lowStock")

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const products = db.collection("products")

    let query = {}
    if (lowStock === "true") {
      query = { isOutOfStock: true }
    }

    // Sort by productId in descending order (assuming higher IDs are newer)
    const result = await products.find(query).sort({ productId: -1 }).toArray()

    return NextResponse.json(result)
  } catch (error) {
    console.error("Products API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "manager" && session.user.role !== "product_manager")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { group, subGroup, productId, name, price, purchaseRate, imagePaths, isOutOfStock } = body

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const products = db.collection("products")

    const productData: any = {
      group,
      subGroup,
      productId,
      name,
      price,
      imagePaths: imagePaths || [],
      isOutOfStock: isOutOfStock || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Only add purchaseRate if it's provided and user is manager
    if (purchaseRate !== undefined ) {
      productData.purchaseRate = purchaseRate
    }

    const result = await products.insertOne(productData)

    return NextResponse.json({ id: result.insertedId })
  } catch (error) {
    console.error("Products POST error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
