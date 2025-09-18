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

    // Get current date and 12 months ago
    const currentDate = new Date()
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setFullYear(currentDate.getFullYear() - 1)

    // Get sales data for the last 12 months
    const salesData = await db
      .collection("quotations")
      .aggregate([
        {
          $match: {
            status: "sent",
            createdAt: {
              $gte: twelveMonthsAgo,
              $lte: currentDate,
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            sales: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
          },
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1 },
        },
      ])
      .toArray()

    // Create a complete 12-month dataset
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const completeData = []

    // Generate last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const year = date.getFullYear()
      const month = date.getMonth() + 1

      // Find data for this month
      const monthData = salesData.find((item) => item._id.year === year && item._id.month === month)

      completeData.push({
        month: months[month - 1],
        sales: monthData ? monthData.sales : 0,
        revenue: monthData ? monthData.revenue : 0,
      })
    }

    return NextResponse.json(completeData)
  } catch (error) {
    console.error("Sales data error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
