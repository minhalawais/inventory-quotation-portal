import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { ObjectId } from "mongodb"

import { authOptions } from "@/lib/auth"
import { getClientIP, isIPAllowed } from "@/lib/ip-utils"
import clientPromise from "@/lib/mongodb"

async function checkIp(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const clientIP = getClientIP(request)
  const client = await clientPromise
  const users = client.db("inventory_portal").collection("users")

  const user = ObjectId.isValid(session.user.id)
    ? await users.findOne({ _id: new ObjectId(session.user.id) })
    : await users.findOne({ email: session.user.email })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const allowedIPs: string[] = Array.isArray(user.allowedIps) && user.allowedIps.length > 0
    ? user.allowedIps
    : ["*"]
  const isAllowed = isIPAllowed(clientIP, allowedIPs)

  return NextResponse.json({
    allowed: isAllowed,
    isAllowed,
    ip: clientIP,
    currentIP: clientIP,
    allowedIPs,
  })
}

export async function GET(request: NextRequest) {
  try {
    return await checkIp(request)
  } catch (error) {
    console.error("IP check error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
