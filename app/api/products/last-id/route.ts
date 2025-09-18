// File: app/api/products/last-id/route.ts
import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("inventory_portal")
    const products = db.collection("products")

    const lastProduct = await products
      .find()
      .sort({ _id: -1 })
      .limit(1)
      .project({ productId: 1 })
      .toArray()

    return NextResponse.json({ 
      lastId: lastProduct.length > 0 ? lastProduct[0].productId : null 
    })
  } catch (error) {
    console.error("Failed to get last product ID:", error)
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"