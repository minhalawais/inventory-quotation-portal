import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"

import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import {
  buildTaxonomyTree,
  findSiblingByName,
  normalizeName,
  parseObjectId,
  seedTaxonomyFromProducts,
  serializeTaxonomyNode,
  taxonomyCollection,
  type TaxonomyDoc,
} from "@/lib/taxonomy"
import type { TaxonomyType } from "@/lib/product-classification"

const MANAGE_ROLES = ["manager", "product_manager"]
const TYPES: TaxonomyType[] = ["department", "category", "subcategory"]

function canManage(role?: string) {
  return Boolean(role && MANAGE_ROLES.includes(role))
}

function parentTypeFor(type: TaxonomyType): TaxonomyType | null {
  if (type === "category") return "department"
  if (type === "subcategory") return "category"
  return null
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("inventory_portal")
    // One-time migration when taxonomy is empty; catalog seeding lives in scripts/seed-taxonomy.js
    await seedTaxonomyFromProducts(db)
    const tree = await buildTaxonomyTree(db)

    return NextResponse.json(tree)
  } catch (error) {
    console.error("Taxonomy GET error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !canManage(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const type = body.type as TaxonomyType
    const name = typeof body.name === "string" ? normalizeName(body.name) : ""

    if (!TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid classification type" }, { status: 400 })
    }
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const col = taxonomyCollection(db)

    let parentId = null as TaxonomyDoc["parentId"]
    const expectedParent = parentTypeFor(type)

    if (expectedParent) {
      const parsedParent = parseObjectId(body.parentId)
      if (!parsedParent) {
        return NextResponse.json({ error: `Select a ${expectedParent} first` }, { status: 400 })
      }
      const parent = await col.findOne({ _id: parsedParent, type: expectedParent })
      if (!parent) {
        return NextResponse.json({ error: `Select a valid ${expectedParent}` }, { status: 400 })
      }
      parentId = parent._id
    }

    const duplicate = await findSiblingByName(col, type, parentId, name)
    if (duplicate) {
      return NextResponse.json({ error: "That name already exists at this level" }, { status: 409 })
    }

    const now = new Date()
    const doc: Omit<TaxonomyDoc, "_id"> = {
      type,
      name,
      parentId,
      createdAt: now,
      updatedAt: now,
    }
    const result = await col.insertOne(doc as TaxonomyDoc)
    const created = await col.findOne({ _id: result.insertedId })

    return NextResponse.json(created ? serializeTaxonomyNode(created) : { id: result.insertedId.toString() })
  } catch (error) {
    console.error("Taxonomy POST error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
