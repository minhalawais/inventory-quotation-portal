const { MongoClient } = require("mongodb")
const path = require("path")
require("dotenv").config({ path: ".env.local" })
require("dotenv").config({ path: ".env" })

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/inventory_portal"
const catalog = require(path.join(__dirname, "..", "lib", "kk-sports-taxonomy.json"))

async function findSibling(col, type, parentId, name) {
  const siblings = await col.find({ type, parentId }).toArray()
  const target = name.trim().toLowerCase()
  return siblings.find((item) => item.name.trim().toLowerCase() === target) || null
}

async function seedTaxonomy() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    const db = client.db("inventory_portal")
    const col = db.collection("product_taxonomy")
    await col.createIndex({ type: 1, parentId: 1, name: 1 })

    const now = new Date()
    const inserted = { departments: 0, categories: 0, subcategories: 0 }

    for (const department of catalog) {
      let deptDoc = await findSibling(col, "department", null, department.name)
      if (!deptDoc) {
        const result = await col.insertOne({
          type: "department",
          name: department.name,
          parentId: null,
          createdAt: now,
          updatedAt: now,
        })
        deptDoc = { _id: result.insertedId }
        inserted.departments += 1
      }

      for (const category of department.categories) {
        let categoryDoc = await findSibling(col, "category", deptDoc._id, category.name)
        if (!categoryDoc) {
          const result = await col.insertOne({
            type: "category",
            name: category.name,
            parentId: deptDoc._id,
            createdAt: now,
            updatedAt: now,
          })
          categoryDoc = { _id: result.insertedId }
          inserted.categories += 1
        }

        for (const subName of category.subcategories || []) {
          const exists = await findSibling(col, "subcategory", categoryDoc._id, subName)
          if (!exists) {
            await col.insertOne({
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

    const departments = await col.countDocuments({ type: "department" })
    const categories = await col.countDocuments({ type: "category" })
    const subcategories = await col.countDocuments({ type: "subcategory" })

    console.log("KK Sports taxonomy upsert complete.")
    console.log(
      `Inserted: ${inserted.departments} departments, ${inserted.categories} categories, ${inserted.subcategories} subcategories`,
    )
    console.log(`Totals: ${departments} departments, ${categories} categories, ${subcategories} subcategories`)
  } catch (error) {
    console.error("Taxonomy seed error:", error)
    process.exitCode = 1
  } finally {
    await client.close()
  }
}

seedTaxonomy()
