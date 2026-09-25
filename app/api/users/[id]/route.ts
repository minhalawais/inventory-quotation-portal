import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"
import { isValidUsername, normalizeEmail, normalizeUsername, usernameRulesText } from "@/lib/usernames"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const users = db.collection("users")

    const user = await users.findOne({ _id: new ObjectId(params.id) }, { projection: { 
      _id: 1,
      name: 1,
      email: 1,
      username: 1,
      role: 1,
      lastSeen: 1,
      isOnline: 1,
      contact: 1,
      createdAt: 1,
      status: 1,
      allowedIps: 1, // ✅ include allowedIps
     } })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("User GET error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, role, contact, password, allowedIps, status } = body
    const email = normalizeEmail(body.email)
    const username = normalizeUsername(body.username)

    if (!name?.trim() || !email || !username || !role) {
      return NextResponse.json({ error: "Name, email, username, and role are required." }, { status: 400 })
    }

    if (!isValidUsername(username)) {
      return NextResponse.json({ error: usernameRulesText() }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const users = db.collection("users")

    const userId = new ObjectId(params.id)
    const existing = await users.findOne({
      _id: { $ne: userId },
      $or: [{ email }, { username }],
    })

    if (existing) {
      const field = existing.email === email ? "email" : "username"
      return NextResponse.json({ error: `A user with that ${field} already exists.` }, { status: 409 })
    }

    const updateData: any = {
      name: name.trim(),
      email,
      username,
      role,
      contact,
      updatedAt: new Date(),
    }

    if (allowedIps !== undefined) {
      updateData.allowedIps = allowedIps
    }

    if(status !== undefined){
      updateData.status = status
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    const result = await users.updateOne({ _id: userId }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("User PUT error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const users = db.collection("users")

    await users.deleteOne({ _id: new ObjectId(params.id) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("User DELETE error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
