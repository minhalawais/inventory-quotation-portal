import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { ObjectId } from "mongodb"

import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { withClassification } from "@/lib/product-classification"
import { resolveProductClassification } from "@/lib/taxonomy"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const products = db.collection("products")

    const product = await products.findOne({ _id: new ObjectId(params.id) })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Filter out purchaseRate if user is not a manager
    if (session.user.role !== "manager" && product.purchaseRate) {
      delete product.purchaseRate
    }

    return NextResponse.json(withClassification(product))
  } catch (error) {
    console.error("Product GET error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "manager" && session.user.role !== "product_manager")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { productId, name, price, purchaseRate, imagePaths, isOutOfStock } = body

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const products = db.collection("products")
    const classification = await resolveProductClassification(db, body)
    if ("error" in classification) {
      return NextResponse.json({ error: classification.error }, { status: classification.status })
    }

    const updateData: Record<string, unknown> = {
      department: classification.department,
      category: classification.category,
      subCategory: classification.subCategory,
      departmentId: classification.departmentId,
      categoryId: classification.categoryId,
      subCategoryId: classification.subCategoryId || undefined,
      group: classification.department,
      subGroup: classification.category,
      productId,
      name,
      price,
      imagePaths: imagePaths || [],
      isOutOfStock: isOutOfStock || false,
      updatedAt: new Date(),
    }

    // Only add purchaseRate if it's provided and user is manager
    if (purchaseRate !== undefined) {
      updateData.purchaseRate = purchaseRate
    }

    const result = await products.updateOne({ _id: new ObjectId(params.id) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Product PUT error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const products = db.collection("products")

    await products.deleteOne({ _id: new ObjectId(params.id) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Product DELETE error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
