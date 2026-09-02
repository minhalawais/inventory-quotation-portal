"use client"

import { Download, Send, X } from "lucide-react"

import { QuotationDocument } from "@/components/quotations/quotation-document"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { quotationRefDisplay } from "@/lib/company"

interface QuotationItem {
  productId: string
  quantity: number
  price: number
  productName?: string
    productImage?: string
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
  items: QuotationItem[]
  quotationNo?: string | null
  rider?: {
    name: string
    email?: string
    phone?: string
  } | null
}

interface QuotationPreviewProps {
  quotation: Quotation
  isOpen: boolean
  onClose: () => void
  onDownload: () => void
  onSend?: () => void
}

/** Authenticated preview dialog sharing the same document language as public/PDF. */
export default function QuotationPreview({
  quotation,
  isOpen,
  onClose,
  onDownload,
  onSend,
}: QuotationPreviewProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[92vh] w-full max-w-[1040px] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-base font-semibold">
              Preview · {quotationRefDisplay(quotation)}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="h-9" onClick={onDownload}>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Download
              </Button>
              {onSend && quotation.status === "pending" && (
                <Button type="button" size="sm" className="h-9" onClick={onSend}>
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  Send
                </Button>
              )}
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={onClose} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto bg-muted/40 p-4 sm:p-5">
          <QuotationDocument quotation={quotation} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
