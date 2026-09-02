/** Approved KK Sports company identity for quotation documents and PDFs. */
export const COMPANY = {
  name: "KK Sports",
  legalName: "KK Sports",
  tagline: "Sports & fitness operations",
  operationsLabel: "KK Sports Operations",
  email: "Infokksports@gmail.com",
  phone: "03-111-192934",
  phoneDisplay: "03-111-192934",
  website: "www.kksports.com.pk",
  websiteUrl: "https://www.kksports.com.pk",
  address: "E-11, 1st Floor, Shah Alam Market, Lahore",
  /** Circular mark on black. Dark compact UI only. */
  logoPath: "/kk_logo.png",
  /** Circular stacked mark on white. Light UI, documents, PDF, favicon. */
  logoWhiteBgPath: "/kk_logo_white_bg.png",
  /** Icon + wordmark on black. Dark headers and login only. */
  logoHorizontalPath: "/kk_horizontal_logo.png",
} as const

export function quotationReference(
  idOrQuotation: string | { _id?: { toString(): string } | string; quotationNo?: string | null },
  quotationNo?: string | null,
): string {
  if (typeof idOrQuotation !== "string") {
    if (idOrQuotation.quotationNo) return idOrQuotation.quotationNo
    const id = typeof idOrQuotation._id === "string" ? idOrQuotation._id : idOrQuotation._id?.toString() || ""
    return id.slice(-8).toUpperCase()
  }
  if (quotationNo) return quotationNo
  if (idOrQuotation.startsWith("KQ-")) return idOrQuotation
  return idOrQuotation.slice(-8).toUpperCase()
}

export function quotationRefDisplay(
  idOrQuotation: string | { _id?: { toString(): string } | string; quotationNo?: string | null },
  quotationNo?: string | null,
): string {
  const ref = quotationReference(idOrQuotation, quotationNo)
  if (!ref) return "—"
  return ref.startsWith("KQ-") ? ref : `#${ref}`
}

export function formatPkr(amount: number): string {
  return `PKR ${formatAmount(amount)}`
}

export function formatAmount(amount: number): string {
  return amount.toLocaleString("en-PK", { maximumFractionDigits: 2 })
}

export function displayPersonName(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return value
  return trimmed.replace(/\S+/g, (word) => {
    if (word.includes("@") || /\d/.test(word)) return word
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  })
}

export function telHref(phone: string): string {
  const input = phone.trim()
  if (!input) return ""
  const digits = input.replace(/\D/g, "")
  if (!digits) return ""
  return input.startsWith("+") ? `tel:+${digits}` : `tel:${digits}`
}

export function formatQuotationDate(value: string | Date): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function validUntilDate(createdAt: string | Date, days = 30): string {
  const base = new Date(createdAt)
  if (Number.isNaN(base.getTime())) {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }
  base.setDate(base.getDate() + days)
  return base.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
