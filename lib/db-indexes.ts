import type { Db } from "mongodb"

let indexesEnsured = false

/**
 * Idempotent index setup for production. Safe to call at deploy time;
 * do not invoke on every read request.
 */
export async function ensureDatabaseIndexes(db: Db) {
  if (indexesEnsured) return

  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),

    db.collection("products").createIndex({ productId: 1 }, { unique: true }),
    db.collection("products").createIndex({ isOutOfStock: 1, productId: -1 }),
    db.collection("products").createIndex({ departmentId: 1 }, { sparse: true }),
    db.collection("products").createIndex({ categoryId: 1 }, { sparse: true }),
    db.collection("products").createIndex({ subCategoryId: 1 }, { sparse: true }),

    db.collection("quotations").createIndex({ quotationNo: 1 }, { unique: true, sparse: true }),
    db.collection("quotations").createIndex({ riderId: 1, createdAt: -1 }),
    db.collection("quotations").createIndex({ createdAt: -1 }),
    db.collection("quotations").createIndex({ status: 1, createdAt: -1 }),

    db.collection("product_taxonomy").createIndex({ type: 1, parentId: 1, name: 1 }),
    db.collection("product_taxonomy").createIndex({ parentId: 1 }),
    db.collection("product_taxonomy").createIndex({ type: 1, name: 1 }),
    db.collection("product_taxonomy").createIndex({ name: 1 }),

    db.collection("activity_logs").createIndex({ timestamp: -1 }),
  ])

  indexesEnsured = true
}

/** Reset in-memory guard (tests only). */
export function resetIndexGuardForTests() {
  indexesEnsured = false
}
