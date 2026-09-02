import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"

import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import {
  cascadeRename,
  countProductsUsingNode,
  countTaxonomyChildren,
  findSiblingByName,
  normalizeName,
  parseObjectId,
  serializeTaxonomyNode,
  taxonomyCollection,
} from "@/lib/taxonomy"

const MANAGE_ROLES = ["manager", "product_manager"]

function canManage(role?: string) {
  return Boolean(role && MANAGE_ROLES.includes(role))
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !canManage(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = parseObjectId(params.id)
    if (!id) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 })
    }

    const body = await request.json()
    const name = typeof body.name === "string" ? normalizeName(body.name) : ""
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const col = taxonomyCollection(db)
    const existing = await col.findOne({ _id: id })

    if (!existing) {
      return NextResponse.json({ error: "Option not found" }, { status: 404 })
    }

    const duplicate = await findSiblingByName(col, existing.type, existing.parentId, name, existing._id)
    if (duplicate) {
      return NextResponse.json({ error: "That name already exists at this level" }, { status: 409 })
    }

    if (existing.name !== name) {
      await cascadeRename(db, existing, name)
      await col.updateOne({ _id: id }, { $set: { name, updatedAt: new Date() } })
    }

    const updated = await col.findOne({ _id: id })
    return NextResponse.json(updated ? serializeTaxonomyNode(updated) : { success: true })
  } catch (error) {
    console.error("Taxonomy PUT error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !canManage(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = parseObjectId(params.id)
    if (!id) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const col = taxonomyCollection(db)
    const existing = await col.findOne({ _id: id })

    if (!existing) {
      return NextResponse.json({ error: "Option not found" }, { status: 404 })
    }

    const childCount = await countTaxonomyChildren(col, existing._id)
    if (childCount > 0) {
      const childLabel = existing.type === "department" ? "categories" : "subcategories"
      return NextResponse.json(
        { error: `Remove ${childCount} ${childLabel} first` },
        { status: 409 },
      )
    }

    const productCount = await countProductsUsingNode(db, existing)
    if (productCount > 0) {
      return NextResponse.json(
        { error: `${productCount} product${productCount === 1 ? "" : "s"} still use this option` },
        { status: 409 },
      )
    }

    await col.deleteOne({ _id: id })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Taxonomy DELETE error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
