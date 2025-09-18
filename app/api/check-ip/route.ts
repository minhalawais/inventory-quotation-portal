// app/api/check-ip/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getClientIP, isIPAllowed } from '@/lib/ip-utils'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('session:',session )
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clientIP = getClientIP(request)
    const client = await clientPromise

    const db = client.db("inventory_portal")
    const users = db.collection("users")

    const user = await users.findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ allowed: false, error: 'User not found' }, { status: 404 })
    }

    const allowedIPs = user.allowedIps || ["*"]
    console.log('Allowed Ips: ',allowedIPs);
    const isAllowed = isIPAllowed(clientIP, allowedIPs)

    return NextResponse.json({ allowed: isAllowed, ip: clientIP })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ allowed: false, error: 'Server error' }, { status: 500 })
  }
}