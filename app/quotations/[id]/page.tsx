import { notFound } from "next/navigation"
import { ObjectId } from "mongodb"

import clientPromise from "@/lib/mongodb"
import PublicQuotationView from "@/components/quotations/public-quotation-view"
import { COMPANY, quotationRefDisplay } from "@/lib/company"
import { quotationShowsPrices, resolveStoredProductImages } from "@/lib/quotation"
import { ensureQuotationNumber } from "@/lib/quotation-number"
import { classificationFromProduct } from "@/lib/quotation-catalog"

interface QuotationItem {
  productId: string
  quantity: number
  price: number
  productName?: string
  productImage?: string | null
  productImages?: string[]
  sentQuantity?: number
}

interface Quotation {
  _id: string
  customerName: string
  customerPhone: string
  customerAddress: string
  totalAmount: number
  status: string
  createdAt: string
  showPrices: boolean
  canRequestQuantities: boolean
  quotationNo?: string
  items: QuotationItem[]
  rider?: {
    _id: string
    name: string
    email?: string
    phone?: string
  } | null
}

async function getQuotation(id: string): Promise<Quotation | null> {
  try {
    if (!ObjectId.isValid(id)) return null

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const quotations = db.collection("quotations")
    const products = db.collection("products")
    const users = db.collection("users")

    const quotation = await quotations.findOne({ _id: new ObjectId(id) })
    if (!quotation) return null

    const quotationNo = await ensureQuotationNumber(db, {
      _id: quotation._id,
      createdAt: quotation.createdAt,
      quotationNo: quotation.quotationNo,
    })
    const showPrices = quotationShowsPrices(quotation.showPrices)

    const itemsWithDetails = await Promise.all(
      quotation.items.map(async (item: {
        productId: ObjectId
        quantity: number
        price: number
        productImage?: string
        productImages?: string[]
        sentQuantity?: number
      }) => {
        try {
          const product = await products.findOne({ _id: new ObjectId(item.productId) })
          const productImages = resolveStoredProductImages(item, product)
          const catalogId = product?.productId || "N/A"

          return {
            productId: catalogId,
            quantity: item.quantity,
            price: showPrices ? item.price : 0,
            productName: product?.name || "Unknown Product",
            productImage: productImages[0] || null,
            productImages,
            sentQuantity: item.sentQuantity,
            ...classificationFromProduct(product),
          }
        } catch {
          return {
            productId: "N/A",
            quantity: item.quantity,
            price: showPrices ? item.price : 0,
            productName: "Unknown Product",
            productImage: null,
            productImages: [],
            sentQuantity: item.sentQuantity,
            department: "",
            category: "",
            subCategory: "",
          }
        }
      }),
    )

    let rider = null
    if (quotation.riderId) {
      const riderDoc = await users.findOne({ _id: new ObjectId(quotation.riderId) })
      if (riderDoc) {
        rider = {
          _id: riderDoc._id.toString(),
          name: riderDoc.name,
          email: riderDoc.email,
          phone: riderDoc.contact,
        }
      }
    }

    return {
      _id: quotation._id.toString(),
      customerName: quotation.customerName,
      customerPhone: quotation.customerPhone,
      customerAddress: quotation.customerAddress,
      totalAmount: showPrices ? quotation.totalAmount : 0,
      status: quotation.status,
      createdAt: quotation.createdAt,
      showPrices,
      canRequestQuantities: quotation.status === "sent" || quotation.status === "returned",
      quotationNo,
      items: itemsWithDetails,
      rider,
    }
  } catch (error) {
    console.error("Error fetching quotation:", error)
    return null
  }
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const quotation = await getQuotation(params.id)

  if (!quotation) {
    return { title: { absolute: `Quotation not found · ${COMPANY.name}` } }
  }

  const ref = quotationRefDisplay(quotation)
  return {
    title: { absolute: `${ref} · ${quotation.customerName}` },
    description: quotation.showPrices
      ? `${ref} — Total: PKR ${quotation.totalAmount.toLocaleString()}`
      : `${ref} from ${COMPANY.name}`,
  }
}

export default async function PublicQuotationPage({ params }: { params: { id: string } }) {
  const quotation = await getQuotation(params.id)

  if (!quotation) {
    notFound()
  }

  return <PublicQuotationView quotation={quotation} />
}
