import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { determineUserStatus } from "@/lib/status-utils"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const users = db.collection("users")

    const allUsers = await users
      .find(
        {},
        {
          projection: {
            _id: 1,
            name: 1,
            email: 1,
            role: 1,
            lastSeen: 1,
            isOnline: 1,
            contact: 1,
            createdAt: 1,
            status: 1,
            allowedIps: 1, // ✅ include allowedIps
          },
        },
      )
      .toArray()

    // Ensure each user always has allowedIps (fallback to [])
    const usersWithStatus = allUsers.map((u) => ({
      ...determineUserStatus(u),
      allowedIps: u.allowedIps ?? [], // ✅ fallback
    }))

    return NextResponse.json(usersWithStatus)
  } catch (error) {
    console.error("Status fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
