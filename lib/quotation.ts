import { collectProductImages } from "@/lib/product-images"

export const QUOTATION_STATUSES = ["pending", "sent", "returned", "completed", "cancelled"] as const
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number]

export function isQuotationStatus(value: string): value is QuotationStatus {
  return (QUOTATION_STATUSES as readonly string[]).includes(value)
}

export function quotationStatusLabel(status: string) {
  switch (status) {
    case "pending":
      return "Pending"
    case "sent":
      return "Sent"
    case "returned":
      return "Returned"
    case "completed":
      return "Completed"
    case "cancelled":
      return "Cancelled"
    default:
      return status
  }
}

export function quotationStatusTone(status: string): "success" | "warning" | "info" | "danger" | "neutral" {
  switch (status) {
    case "sent":
      return "success"
    case "pending":
      return "warning"
    case "returned":
      return "warning"
    case "completed":
      return "info"
    case "cancelled":
      return "danger"
    default:
      return "neutral"
  }
}

export function resolveStoredProductImages(
  item: { productImages?: string[] | null; productImage?: string | null },
  product?: { imagePaths?: string[] | null; imagePath?: string | null } | null,
) {
  const available = collectProductImages(product, item.productImage)
  if (Array.isArray(item.productImages)) {
    return item.productImages.filter(Boolean)
  }
  return available
}

export function quotationShowsPrices(showPrices: unknown) {
  return showPrices !== false
}
