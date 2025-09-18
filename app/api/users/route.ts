import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const users = db.collection("users")

    const result = await users.find({}, { projection: {
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
    } }).toArray()
    
    console.log('Result: ',result)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Users API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, password, role, contact, allowedIps = ["*"] } = body

    const hashedPassword = await bcrypt.hash(password, 12)

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const users = db.collection("users")

    const result = await users.insertOne({
      name,
      email,
      password: hashedPassword,
      role,
      contact,
      allowedIps, // Added allowedIps field to user document
      createdAt: new Date(),
    })

    return NextResponse.json({ id: result.insertedId })
  } catch (error) {
    console.error("Users POST error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
