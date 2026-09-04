const { MongoClient, ObjectId } = require("mongodb")
require("dotenv").config({ path: ".env.local" })
require("dotenv").config({ path: ".env" })

const MONGODB_URI = process.env.MONGODB_URI

async function listIndexes(db, name) {
  const indexes = await db.collection(name).indexes()
  return indexes.map((idx) => ({
    name: idx.name,
    key: idx.key,
    unique: Boolean(idx.unique),
    sparse: Boolean(idx.sparse),
  }))
}

async function explain(db, label, collection, operation, ...args) {
  const col = db.collection(collection)
  const cursor = col.find(...args)
  const plan = await cursor.explain("executionStats")
  const stats = plan.executionStats || plan
  const stage = plan.queryPlanner?.winningPlan?.inputStage?.stage
    || plan.queryPlanner?.winningPlan?.stage
    || "unknown"
  const docsExamined = stats.totalDocsExamined ?? stats.nReturned ?? "?"
  const keysExamined = stats.totalKeysExamined ?? "?"
  const ms = stats.executionTimeMillis ?? "?"

  console.log(`  ${label}`)
  console.log(`    stage: ${stage} | docsExamined: ${docsExamined} | keysExamined: ${keysExamined} | ${ms}ms`)
}

async function explainAggregate(db, label, collection, pipeline) {
  const col = db.collection(collection)
  const cursor = col.aggregate(pipeline)
  const plan = await cursor.explain("executionStats")
  const stats = plan.executionStats || plan
  const ms = stats.executionTimeMillis ?? "?"
  const docsExamined = stats.totalDocsExamined ?? "?"
  const stage = plan.stages?.[0]?.$cursor?.queryPlanner?.winningPlan?.stage ?? "?"
  console.log(`  ${label}`)
  console.log(`    stage: ${stage} | docsExamined: ${docsExamined} | ${ms}ms`)
}

async function main() {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db("inventory_portal")

  const collections = [
    "users",
    "products",
    "quotations",
    "product_taxonomy",
    "activity_logs",
    "counters",
  ]

  console.log("=== CURRENT INDEXES ===\n")
  for (const name of collections) {
    try {
      const count = await db.collection(name).countDocuments()
      const indexes = await listIndexes(db, name)
      console.log(`${name} (${count} docs)`)
      for (const idx of indexes) {
        const flags = [idx.unique && "unique", idx.sparse && "sparse"].filter(Boolean).join(", ")
        console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}${flags ? ` (${flags})` : ""}`)
      }
      console.log("")
    } catch {
      console.log(`${name}: collection missing\n`)
    }
  }

  console.log("=== QUERY PLAN CHECKS (COLLSCAN = bad at scale) ===\n")

  console.log("users:")
  await explain(db, "login by email", "users", "find", { email: "admin@inventory.com" })

  console.log("\nproducts:")
  await explain(db, "list in-stock sorted by productId", "products", "find", { isOutOfStock: { $ne: true } }, { sort: { productId: -1 } })
  await explain(db, "out of stock filter", "products", "find", { isOutOfStock: true })
  await explain(db, "check productId uniqueness", "products", "find", { productId: "TEST-001" })

  console.log("\nquotations:")
  await explain(db, "rider list sorted by createdAt", "quotations", "find", { riderId: new ObjectId("000000000000000000000001") }, { sort: { createdAt: -1 } })
  await explain(db, "all sorted by createdAt desc", "quotations", "find", {}, { sort: { createdAt: -1 }, limit: 20 })
  await explain(db, "dashboard filter status=sent", "quotations", "find", { status: "sent" })
  await explain(db, "sales chart filter status+date", "quotations", "find", {
    status: "sent",
    createdAt: { $gte: new Date("2025-01-01"), $lte: new Date() },
  })

  console.log("\nproduct_taxonomy:")
  await explain(db, "sibling lookup (type+parentId+name)", "product_taxonomy", "find", { type: "department", parentId: null, name: "Footwear" })
  await explain(db, "children by parentId", "product_taxonomy", "find", { parentId: new ObjectId("000000000000000000000001") })
  await explain(db, "full tree load", "product_taxonomy", "find", {}, { sort: { name: 1 } })

  console.log("\nactivity_logs:")
  await explain(db, "recent 100 logs", "activity_logs", "find", {}, { sort: { timestamp: -1 }, limit: 100 })

  await client.close()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
