import type { Db, ObjectId } from "mongodb"

import { quotationRefDisplay } from "@/lib/company"

const TIME_ZONE = "Asia/Karachi"

export function quotationYear(date: Date | string = new Date()) {
  return Number(
    new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, year: "numeric" }).format(new Date(date)),
  )
}

export function formatQuotationNo(year: number, seq: number) {
  return `KQ-${year}-${String(seq).padStart(4, "0")}`
}

export function quotationLabel(quotation: { _id?: { toString(): string } | string; quotationNo?: string | null }) {
  return quotationRefDisplay(quotation)
}

export function quotationPdfFilename(quotation: {
  customerName?: string
  quotationNo?: string | null
  _id?: { toString(): string } | string
}) {
  const safeName =
    String(quotation.customerName || "quotation")
      .replace(/[<>:"/\\|?*]+/g, "")
      .trim()
      .replace(/\s+/g, "-") || "quotation"
  const id = typeof quotation._id === "string" ? quotation._id : quotation._id?.toString() || "quote"
  const ref = quotation.quotationNo || id.slice(-6).toUpperCase()
  return `quotation-${safeName}-${ref}.pdf`
}

function readCounterSeq(updated: unknown) {
  if (!updated || typeof updated !== "object") return Number.NaN
  const doc = updated as { seq?: number; value?: { seq?: number } | null }
  return Number(doc.seq ?? doc.value?.seq)
}

type QuotationCounter = { _id: string; seq: number }

async function seedYearCounter(db: Db, year: number) {
  const id = `quotation:${year}`
  const counters = db.collection<QuotationCounter>("counters")
  const prefix = `KQ-${year}-`
  const numbered = await db
    .collection("quotations")
    .find({ quotationNo: { $regex: `^${prefix}` } })
    .project({ quotationNo: 1 })
    .toArray()

  let max = 0
  for (const doc of numbered) {
    const seq = Number.parseInt(String(doc.quotationNo).slice(prefix.length), 10)
    if (Number.isFinite(seq) && seq > max) max = seq
  }

  await counters.updateOne({ _id: id }, { $max: { seq: max } }, { upsert: true })
}

export async function ensureQuotationNumberIndex(db: Db) {
  await db.collection("quotations").createIndex({ quotationNo: 1 }, { unique: true, sparse: true })
}

export async function allocateQuotationNo(db: Db, at: Date | string = new Date()) {
  const year = quotationYear(at)
  await seedYearCounter(db, year)

  const updated = await db.collection<QuotationCounter>("counters").findOneAndUpdate(
    { _id: `quotation:${year}` },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" },
  )

  const seq = readCounterSeq(updated)
  if (!Number.isFinite(seq) || seq < 1) {
    throw new Error("Could not allocate quotation number")
  }

  return formatQuotationNo(year, seq)
}

const MISSING_NUMBER = {
  $or: [{ quotationNo: { $exists: false } }, { quotationNo: null }, { quotationNo: "" }],
}

export async function ensureQuotationNumbers(db: Db) {
  await ensureQuotationNumberIndex(db)

  const quotations = db.collection("quotations")
  const missing = await quotations.find(MISSING_NUMBER).sort({ createdAt: 1, _id: 1 }).toArray()

  for (const doc of missing) {
    const createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date()
    const quotationNo = await allocateQuotationNo(db, createdAt)
    try {
      await quotations.updateOne({ _id: doc._id, ...MISSING_NUMBER }, { $set: { quotationNo } })
    } catch (error) {
      console.error("Quotation number backfill skipped:", error)
    }
  }
}

export async function ensureQuotationNumber(
  db: Db,
  quotation: { _id: ObjectId; createdAt?: Date | string; quotationNo?: string | null },
) {
  if (quotation.quotationNo) return quotation.quotationNo

  const createdAt = quotation.createdAt ? new Date(quotation.createdAt) : new Date()
  const quotationNo = await allocateQuotationNo(db, createdAt)
  const result = await db.collection("quotations").findOneAndUpdate(
    { _id: quotation._id, ...MISSING_NUMBER },
    { $set: { quotationNo } },
    { returnDocument: "after" },
  )

  const saved = (result as { quotationNo?: string; value?: { quotationNo?: string } } | null)?.quotationNo
    ?? (result as { value?: { quotationNo?: string } } | null)?.value?.quotationNo
  if (saved) return saved

  const current = await db.collection("quotations").findOne({ _id: quotation._id }, { projection: { quotationNo: 1 } })
  return (current?.quotationNo as string | undefined) || quotationNo
}
