import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const logs = db.collection("activity_logs")

    const result = await logs.find({}).sort({ timestamp: -1 }).limit(100).toArray()

    return NextResponse.json(result)
  } catch (error) {
    console.error("Logs API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, userName, userRole, action, resource, resourceId, details, status = "success" } = body

    // Get IP address and user agent
    const forwarded = request.headers.get("x-forwarded-for")
    const ipAddress = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const logs = db.collection("activity_logs")

    await logs.insertOne({
      userId,
      userName,
      userRole,
      action,
      resource,
      resourceId,
      details,
      status,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Log creation error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
