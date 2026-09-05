import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { withClassification } from "@/lib/product-classification"
import { productsMatchingClassification } from "@/lib/quotation-catalog"
import { buildTaxonomyTree, resolveProductClassification } from "@/lib/taxonomy"

function parseIdList(searchParams: URLSearchParams, key: string) {
  const values = searchParams.getAll(key)
  if (values.length === 1 && values[0]?.includes(",")) {
    return values[0].split(",").map((value) => value.trim()).filter(Boolean)
  }
  return values.filter(Boolean)
}

function serializeProduct(product: Record<string, unknown>) {
  const classified = withClassification(product)
  return {
    ...classified,
    _id: String(product._id),
    departmentId: product.departmentId ? String(product.departmentId) : classified.departmentId,
    categoryId: product.categoryId ? String(product.categoryId) : classified.categoryId,
    subCategoryId: product.subCategoryId ? String(product.subCategoryId) : classified.subCategoryId,
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const lowStock = searchParams.get("lowStock")
    const departmentIds = parseIdList(searchParams, "departmentId")
    const categoryIds = parseIdList(searchParams, "categoryId")
    const subCategoryIds = parseIdList(searchParams, "subCategoryId")
    const hasClassificationFilter =
      departmentIds.length > 0 || categoryIds.length > 0 || subCategoryIds.length > 0

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const products = db.collection("products")

    let query: Record<string, unknown> = { isOutOfStock: { $ne: true } }
    if (lowStock === "true") {
      query = { isOutOfStock: true }
    }

    const result = await products.find(query).sort({ productId: -1 }).toArray()
    let serialized = result.map((product) => serializeProduct(product as Record<string, unknown>))

    if (hasClassificationFilter) {
      const tree = await buildTaxonomyTree(db)
      serialized = productsMatchingClassification(
        serialized,
        { departmentIds, categoryIds, subCategoryIds },
        tree,
      )
    }

    return NextResponse.json(serialized)
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
    const { productId, name, price, purchaseRate, imagePaths, isOutOfStock } = body

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const products = db.collection("products")
    const classification = await resolveProductClassification(db, body)
    if ("error" in classification) {
      return NextResponse.json({ error: classification.error }, { status: classification.status })
    }

    const productData: Record<string, unknown> = {
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
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Only add purchaseRate if it's provided and user is manager
    if (purchaseRate !== undefined ) {
      productData.purchaseRate = purchaseRate
    }

    const result = await products.insertOne(productData as any)

    return NextResponse.json({ id: result.insertedId })
  } catch (error) {
    console.error("Products POST error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
