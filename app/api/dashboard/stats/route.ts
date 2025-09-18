import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("inventory_portal")

    const [totalProducts, totalQuotations, totalUsers, revenueData] = await Promise.all([
      db.collection("products").countDocuments(),
      db.collection("quotations").countDocuments(),
      db.collection("users").countDocuments(),
      db
        .collection("quotations")
        .aggregate([{ $match: { status: "sent" } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }])
        .toArray(),
    ])

    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0

    return NextResponse.json({
      totalProducts,
      totalQuotations,
      totalUsers,
      totalRevenue,
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
