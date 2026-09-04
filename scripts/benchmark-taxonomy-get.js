const { MongoClient } = require("mongodb")
const path = require("path")
require("dotenv").config({ path: ".env.local" })
require("dotenv").config({ path: ".env" })

const MONGODB_URI = process.env.MONGODB_URI
const catalog = require(path.join(__dirname, "..", "lib", "kk-sports-taxonomy.json"))

async function findSibling(col, type, parentId, name) {
  const siblings = await col.find({ type, parentId }).toArray()
  const target = name.trim().toLowerCase()
  return siblings.find((item) => item.name.trim().toLowerCase() === target) || null
}

async function upsertKkSportsTaxonomy(db) {
  const col = db.collection("product_taxonomy")
  for (const department of catalog) {
    let deptDoc = await findSibling(col, "department", null, department.name)
    if (!deptDoc) continue
    for (const category of department.categories) {
      let categoryDoc = await findSibling(col, "category", deptDoc._id, category.name)
      if (!categoryDoc) continue
      for (const subName of category.subcategories) {
        await findSibling(col, "subcategory", categoryDoc._id, subName)
      }
    }
  }
}

async function buildTaxonomyTree(db) {
  const col = db.collection("product_taxonomy")
  const nodes = await col.find({}).sort({ name: 1 }).toArray()
  return {
    departments: nodes.filter((n) => n.type === "department").length,
    categories: nodes.filter((n) => n.type === "category").length,
    subcategories: nodes.filter((n) => n.type === "subcategory").length,
  }
}

async function time(label, fn) {
  const start = Date.now()
  const result = await fn()
  const ms = Date.now() - start
  console.log(`${label}: ${ms}ms`, result && typeof result === "object" ? result : "")
  return ms
}

async function main() {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db("inventory_portal")

  console.log("Benchmarking taxonomy GET work (Atlas round-trips dominate)\n")

  const upsertMs = await time("OLD upsertKkSportsTaxonomy (every GET)", () => upsertKkSportsTaxonomy(db))
  const indexMs = await time("OLD createIndex (every GET)", () =>
    db.collection("product_taxonomy").createIndex({ type: 1, parentId: 1, name: 1 }),
  )
  const treeMs = await time("buildTaxonomyTree (needed on GET)", () => buildTaxonomyTree(db))

  console.log("\nTotals:")
  console.log(`  Old GET path: ~${upsertMs + indexMs + treeMs}ms`)
  console.log(`  New GET path: ~${treeMs}ms`)

  await client.close()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
