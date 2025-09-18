import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const client = await clientPromise

    const db = client.db("inventory_portal")
    const users = db.collection("users")

    await users.updateOne(
      { _id: new ObjectId(session.user.id) },
      {
        $set: {
          lastSeen: new Date(),
          isOnline: true,
        },
      },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Heartbeat error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
