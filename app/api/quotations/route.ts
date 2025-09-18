import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit")

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const quotations = db.collection("quotations")
    const products = db.collection("products")

    let query = {}
    if (session.user.role === "rider") {
      query = { riderId: new ObjectId(session.user.id) }
    }

    let cursor = quotations.find(query).sort({ createdAt: -1 })

    if (limit) {
      cursor = cursor.limit(Number.parseInt(limit))
    }

    const quotationsData = await cursor.toArray()

    // Enrich quotations with product details
    const enrichedQuotations = await Promise.all(
      quotationsData.map(async (quotation) => {
        const itemsWithDetails = await Promise.all(
          quotation.items.map(async (item: any) => {
            const product = await products.findOne({ _id: new ObjectId(item.productId) })
            const mainImage =
              product?.imagePaths && product.imagePaths.length > 0 ? product.imagePaths[0] : product?.imagePath || ""

            return {
              ...item,
              productName: product?.name || "Unknown Product",
              productId: product?.productId || "N/A",
              productImage: item.productImage || mainImage,
            }
          }),
        )
            // Add rider information if available
          let riderInfo = null
          if (quotation.riderId) {
            const riders = db.collection("users") // or "users" depending on your schema
            riderInfo = await riders.findOne({ _id: new ObjectId(quotation.riderId) })
          }
          
          return {
            ...quotation,
            items: itemsWithDetails,
            rider: riderInfo ? {
              _id: riderInfo._id.toString(),
              name: riderInfo.name,
              email: riderInfo.email,
              phone: riderInfo.contact
            } : null
          }
        }),
      )


    return NextResponse.json(enrichedQuotations)
  } catch (error) {
    console.error("Quotations API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { riderId, customerName, customerPhone, customerAddress, items, totalAmount } = body

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const quotations = db.collection("quotations")

    const result = await quotations.insertOne({
      riderId: new ObjectId(riderId),
      customerName,
      customerPhone,
      customerAddress,
      items: items.map((item: any) => ({
        ...item,
        productId: new ObjectId(item.productId),
      })),
      totalAmount,
      status: "pending",
      createdAt: new Date(),
    })

    return NextResponse.json({ id: result.insertedId })
  } catch (error) {
    console.error("Quotations POST error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
