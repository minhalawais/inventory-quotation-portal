import { type Collection, type Db, ObjectId } from "mongodb"

import kkSportsCatalog from "@/lib/kk-sports-taxonomy.json"
import { classifyProduct, type TaxonomyType } from "@/lib/product-classification"

export interface TaxonomyDoc {
  _id: ObjectId
  type: TaxonomyType
  name: string
  parentId: ObjectId | null
  createdAt: Date
  updatedAt: Date
}

export function taxonomyCollection(db: Db): Collection<TaxonomyDoc> {
  return db.collection<TaxonomyDoc>("product_taxonomy")
}

export function serializeTaxonomyNode(doc: TaxonomyDoc) {
  return {
    _id: doc._id.toString(),
    type: doc.type,
    name: doc.name,
    parentId: doc.parentId ? doc.parentId.toString() : null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export function parseObjectId(value: unknown): ObjectId | null {
  if (typeof value !== "string" || !ObjectId.isValid(value)) return null
  return new ObjectId(value)
}

export function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ")
}

export async function findSiblingByName(
  col: Collection<TaxonomyDoc>,
  type: TaxonomyType,
  parentId: ObjectId | null,
  name: string,
  excludeId?: ObjectId,
) {
  const normalized = normalizeName(name)
  if (!normalized) return null

  const exactMatch = await col.findOne({
    type,
    parentId,
    name: normalized,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  })
  if (exactMatch) return exactMatch

  const target = normalized.toLowerCase()
  const siblings = await col.find({ type, parentId, ...(excludeId ? { _id: { $ne: excludeId } } : {}) }).toArray()
  return siblings.find((item) => item.name.trim().toLowerCase() === target) ?? null
}

export async function countTaxonomyChildren(col: Collection<TaxonomyDoc>, parentId: ObjectId) {
  return col.countDocuments({ parentId })
}

export async function countProductsUsingNode(db: Db, node: TaxonomyDoc) {
  const products = db.collection("products")
  const id = node._id.toString()

  if (node.type === "department") {
    return products.countDocuments({
      $or: [{ departmentId: id }, { department: node.name }, { group: node.name }],
    })
  }

  if (node.type === "category") {
    const parent = node.parentId ? await taxonomyCollection(db).findOne({ _id: node.parentId }) : null
    return products.countDocuments({
      $or: [
        { categoryId: id },
        { category: node.name, departmentId: node.parentId?.toString() },
        parent ? { group: parent.name, subGroup: node.name } : { subGroup: node.name },
      ],
    })
  }

  return products.countDocuments({
    $or: [{ subCategoryId: id }, { subCategory: node.name, categoryId: node.parentId?.toString() }],
  })
}

export async function cascadeRename(db: Db, node: TaxonomyDoc, nextName: string) {
  const products = db.collection("products")
  const id = node._id.toString()
  const now = new Date()

  if (node.type === "department") {
    await products.updateMany(
      { $or: [{ departmentId: id }, { department: node.name }, { group: node.name }] },
      { $set: { department: nextName, group: nextName, updatedAt: now } },
    )
    return
  }

  if (node.type === "category") {
    const parent = node.parentId ? await taxonomyCollection(db).findOne({ _id: node.parentId }) : null
    await products.updateMany(
      {
        $or: [
          { categoryId: id },
          { category: node.name, departmentId: node.parentId?.toString() },
          parent ? { group: parent.name, subGroup: node.name } : { subGroup: node.name },
        ],
      },
      { $set: { category: nextName, subGroup: nextName, updatedAt: now } },
    )
    return
  }

  await products.updateMany(
    { $or: [{ subCategoryId: id }, { subCategory: node.name, categoryId: node.parentId?.toString() }] },
    { $set: { subCategory: nextName, updatedAt: now } },
  )
}

export async function buildTaxonomyTree(db: Db) {
  const col = taxonomyCollection(db)
  const nodes = await col.find({}).sort({ name: 1 }).toArray()

  const departments = nodes.filter((node) => node.type === "department")
  const categories = nodes.filter((node) => node.type === "category")
  const subcategories = nodes.filter((node) => node.type === "subcategory")

  return {
    departments: departments.map((department) => ({
      _id: department._id.toString(),
      name: department.name,
      parentId: null,
      categories: categories
        .filter((category) => category.parentId?.equals(department._id))
        .map((category) => ({
          _id: category._id.toString(),
          name: category.name,
          parentId: department._id.toString(),
          subcategories: subcategories
            .filter((sub) => sub.parentId?.equals(category._id))
            .map((sub) => ({
              _id: sub._id.toString(),
              name: sub.name,
              parentId: category._id.toString(),
            })),
        })),
    })),
  }
}

export async function seedTaxonomyFromProducts(db: Db) {
  const col = taxonomyCollection(db)
  const existing = await col.countDocuments()
  if (existing > 0) return

  const products = await db
    .collection("products")
    .find(
      {},
      {
        projection: {
          group: 1,
          subGroup: 1,
          department: 1,
          category: 1,
          subCategory: 1,
        },
      },
    )
    .toArray()

  if (products.length === 0) return

  const now = new Date()
  const departmentIds = new Map<string, ObjectId>()
  const categoryIds = new Map<string, ObjectId>()

  for (const product of products) {
    const classification = classifyProduct(product)
    const departmentName = normalizeName(classification.department)
    if (!departmentName) continue

    const departmentKey = departmentName.toLowerCase()
    if (!departmentIds.has(departmentKey)) {
      const existingDepartment = await findSiblingByName(col, "department", null, departmentName)
      const departmentId = existingDepartment?._id ?? new ObjectId()
      departmentIds.set(departmentKey, departmentId)
      if (!existingDepartment) {
        await col.insertOne({
          _id: departmentId,
          type: "department",
          name: departmentName,
          parentId: null,
          createdAt: now,
          updatedAt: now,
        })
      }
    }

    const categoryName = normalizeName(classification.category)
    if (!categoryName) continue

    const departmentId = departmentIds.get(departmentKey)!
    const categoryKey = `${departmentId.toString()}:${categoryName.toLowerCase()}`
    if (!categoryIds.has(categoryKey)) {
      const existingCategory = await findSiblingByName(col, "category", departmentId, categoryName)
      const categoryId = existingCategory?._id ?? new ObjectId()
      categoryIds.set(categoryKey, categoryId)
      if (!existingCategory) {
        await col.insertOne({
          _id: categoryId,
          type: "category",
          name: categoryName,
          parentId: departmentId,
          createdAt: now,
          updatedAt: now,
        })
      }
    }

    const subCategoryName = normalizeName(classification.subCategory)
    if (!subCategoryName) continue

    const categoryId = categoryIds.get(categoryKey)!
    const exists = await findSiblingByName(col, "subcategory", categoryId, subCategoryName)
    if (!exists) {
      await col.insertOne({
        _id: new ObjectId(),
        type: "subcategory",
        name: subCategoryName,
        parentId: categoryId,
        createdAt: now,
        updatedAt: now,
      })
    }
  }
}

export async function upsertKkSportsTaxonomy(db: Db) {
  const col = taxonomyCollection(db)
  const catalog = kkSportsCatalog as Array<{
    name: string
    categories: Array<{ name: string; subcategories: string[] }>
  }>
  const now = new Date()
  const inserted = { departments: 0, categories: 0, subcategories: 0 }

  for (const department of catalog) {
    let deptDoc = await findSiblingByName(col, "department", null, department.name)
    if (!deptDoc) {
      const departmentId = new ObjectId()
      await col.insertOne({
        _id: departmentId,
        type: "department",
        name: department.name,
        parentId: null,
        createdAt: now,
        updatedAt: now,
      })
      deptDoc = { _id: departmentId } as TaxonomyDoc
      inserted.departments += 1
    }

    for (const category of department.categories) {
      let categoryDoc = await findSiblingByName(col, "category", deptDoc._id, category.name)
      if (!categoryDoc) {
        const categoryId = new ObjectId()
        await col.insertOne({
          _id: categoryId,
          type: "category",
          name: category.name,
          parentId: deptDoc._id,
          createdAt: now,
          updatedAt: now,
        })
        categoryDoc = { _id: categoryId } as TaxonomyDoc
        inserted.categories += 1
      }

      for (const subName of category.subcategories) {
        const exists = await findSiblingByName(col, "subcategory", categoryDoc._id, subName)
        if (!exists) {
          await col.insertOne({
            _id: new ObjectId(),
            type: "subcategory",
            name: subName,
            parentId: categoryDoc._id,
            createdAt: now,
            updatedAt: now,
          })
          inserted.subcategories += 1
        }
      }
    }
  }

  return inserted
}

export async function resolveProductClassification(
  db: Db,
  input: {
    departmentId?: string
    categoryId?: string
    subCategoryId?: string
    department?: string
    category?: string
    subCategory?: string
  },
) {
  const col = taxonomyCollection(db)
  const departmentId = parseObjectId(input.departmentId)
  const categoryId = parseObjectId(input.categoryId)
  const subCategoryId = parseObjectId(input.subCategoryId)

  let department =
    departmentId != null ? await col.findOne({ _id: departmentId, type: "department" }) : null
  if (!department && input.department) {
    department = await findSiblingByName(col, "department", null, normalizeName(input.department))
  }
  if (!department) {
    return { error: "Select a department", status: 400 as const }
  }

  let category =
    categoryId != null ? await col.findOne({ _id: categoryId, type: "category", parentId: department._id }) : null
  if (!category && input.category) {
    category = await findSiblingByName(col, "category", department._id, normalizeName(input.category))
  }
  if (!category) {
    return { error: "Select a category", status: 400 as const }
  }

  let subCategory = null as TaxonomyDoc | null
  if (subCategoryId) {
    subCategory = await col.findOne({ _id: subCategoryId, type: "subcategory", parentId: category._id })
    if (!subCategory) {
      return { error: "Select a valid subcategory", status: 400 as const }
    }
  } else if (input.subCategory) {
    subCategory = await findSiblingByName(col, "subcategory", category._id, normalizeName(input.subCategory))
  }

  const childCount = await countTaxonomyChildren(col, category._id)
  if (childCount > 0 && !subCategory) {
    return { error: "Select a subcategory", status: 400 as const }
  }

  return {
    department: department.name,
    category: category.name,
    subCategory: subCategory?.name || "",
    departmentId: department._id.toString(),
    categoryId: category._id.toString(),
    subCategoryId: subCategory?._id.toString() || "",
  }
}
