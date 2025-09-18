export function formatPhoneForWhatsApp(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, "")

  // If it starts with 92, use as is
  if (digits.startsWith("92")) {
    return digits
  }

  // If it starts with 0, replace with 92
  if (digits.startsWith("0")) {
    return "92" + digits.substring(1)
  }

  // If it's just the number without country code, add 92
  if (digits.length === 10) {
    return "92" + digits
  }

  // Default: assume it needs 92 prefix
  return "92" + digits
}

export function generateWhatsAppMessage(quotation: any, quotationUrl: string): string {
  const message = `🔔 *Quotation Ready* 🔔

Hello ${quotation.customerName}!

Your quotation is ready for review:

📋 *Quotation #${quotation._id.slice(-8).toUpperCase()}*
💰 *Total Amount: PKR ${quotation.totalAmount.toLocaleString()}*
📅 *Date: ${new Date(quotation.createdAt).toLocaleDateString()}*
📦 *Items: ${quotation.items.length} item(s)*

🔗 *View & Download:*
${quotationUrl}

✅ Click the link above to:
• View complete quotation details
• Download PDF copy
• Review terms & conditions

📞 For any questions, feel free to contact us.

Thank you for choosing Inventory Portal! 🙏

---
*Inventory Portal*
Professional Inventory & Quotation Management`

  return message
}
