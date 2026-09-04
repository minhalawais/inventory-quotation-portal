const { MongoClient } = require("mongodb")
require("dotenv").config({ path: ".env.local" })
require("dotenv").config({ path: ".env" })

const MONGODB_URI = process.env.MONGODB_URI

async function ensureIndexes(db) {
  const created = []

  async function add(collection, spec, options = {}) {
    const name = await db.collection(collection).createIndex(spec, options)
    created.push(`${collection}.${name}`)
  }

  await add("users", { email: 1 }, { unique: true })

  await add("products", { productId: 1 }, { unique: true })
  await add("products", { isOutOfStock: 1, productId: -1 })
  await add("products", { departmentId: 1 }, { sparse: true })
  await add("products", { categoryId: 1 }, { sparse: true })
  await add("products", { subCategoryId: 1 }, { sparse: true })

  await add("quotations", { quotationNo: 1 }, { unique: true, sparse: true })
  await add("quotations", { riderId: 1, createdAt: -1 })
  await add("quotations", { createdAt: -1 })
  await add("quotations", { status: 1, createdAt: -1 })

  await add("product_taxonomy", { type: 1, parentId: 1, name: 1 })
  await add("product_taxonomy", { parentId: 1 })
  await add("product_taxonomy", { type: 1, name: 1 })
  await add("product_taxonomy", { name: 1 })

  await add("activity_logs", { timestamp: -1 })

  return created
}

async function main() {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db("inventory_portal")

  console.log("Ensuring database indexes...\n")
  const created = await ensureIndexes(db)

  console.log("Indexes ensured:")
  for (const name of created) {
    console.log(`  - ${name}`)
  }

  console.log("\nRun `node scripts/audit-indexes.js` to verify query plans.")
  await client.close()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
