export interface WhatsAppQuotation {
  _id: string
  customerName: string
  totalAmount: number
  createdAt: string | Date
  items: Array<unknown>
}

const DEFAULT_COUNTRY_CODE = "92"

export function formatPhoneForWhatsApp(phone: string): string {
  const input = phone.trim()

  if (!input) {
    throw new Error("Customer phone number is required")
  }

  const digits = input.replace(/\D/g, "")
  let normalized: string

  if (input.startsWith("+")) {
    normalized = digits
  } else if (digits.startsWith("00")) {
    normalized = digits.slice(2)
  } else if (digits.startsWith(DEFAULT_COUNTRY_CODE)) {
    normalized = digits
  } else if (digits.startsWith("0")) {
    normalized = `${DEFAULT_COUNTRY_CODE}${digits.slice(1)}`
  } else if (digits.length === 10) {
    normalized = `${DEFAULT_COUNTRY_CODE}${digits}`
  } else {
    normalized = digits
  }

  if (!/^\d{8,15}$/.test(normalized)) {
    throw new Error("Enter a valid WhatsApp number with country code")
  }

  return normalized
}

function cleanInlineText(value: string): string {
  return value.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim()
}

function formatQuotationDate(value: string | Date): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Not specified"
  }

  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date)
}

function formatQuotationAmount(value: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    currencyDisplay: "code",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

export function generateWhatsAppMessage(quotation: WhatsAppQuotation, quotationUrl: string): string {
  const customerName = cleanInlineText(quotation.customerName) || "Customer"
  const reference = quotation._id.slice(-8).toUpperCase()
  const itemCount = quotation.items.length
  const itemLabel = itemCount === 1 ? "item" : "items"

  return `Hello ${customerName},

Thank you for your interest. Your quotation is ready for review.

*Quotation details*
Reference: *#${reference}*
Issued: ${formatQuotationDate(quotation.createdAt)}
Items: ${itemCount} ${itemLabel}
Total: *${formatQuotationAmount(quotation.totalAmount)}*

*View quotation*
${quotationUrl}

The link includes the complete quotation and a downloadable PDF.

Please contact us if you need any changes or assistance.

Regards,
*InventoryOS*
Inventory & quotation operations`
}

export function buildWhatsAppShareUrl(
  phone: string,
  quotation: WhatsAppQuotation,
  quotationUrl: string,
): string {
  const recipient = formatPhoneForWhatsApp(phone)
  const message = generateWhatsAppMessage(quotation, quotationUrl)

  return `https://wa.me/${recipient}?text=${encodeURIComponent(message)}`
}

export function openWhatsAppShare(whatsappUrl: string): void {
  const popup = window.open(whatsappUrl, "_blank")

  if (popup) {
    popup.opener = null
    return
  }

  window.location.assign(whatsappUrl)
}
