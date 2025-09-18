// File: app/api/products/check-id/route.ts
import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID parameter is required" }, 
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const products = db.collection("products")

    const existingProduct = await products.findOne({ productId: id })

    return NextResponse.json({ isUnique: !existingProduct })
  } catch (error) {
    console.error("Failed to check product ID uniqueness:", error)
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"