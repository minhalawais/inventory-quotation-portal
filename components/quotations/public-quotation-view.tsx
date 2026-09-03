"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, Loader2, Send } from "lucide-react"

import { BrandMark } from "@/components/brand-mark"
import { QuotationDocument } from "@/components/quotations/quotation-document"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { quotationPdfFilename } from "@/lib/quotation-number"

interface QuotationItem {
  productId: string
  quantity: number
  price: number
  productName?: string
  productImage?: string | null
  productImages?: string[]
  sentQuantity?: number
  department?: string
  category?: string
  subCategory?: string
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

interface PublicQuotationViewProps {
  quotation: Quotation
}

export default function PublicQuotationView({ quotation }: PublicQuotationViewProps) {
  const [downloading, setDownloading] = useState(false)
  const [sending, setSending] = useState(false)
  const [quantities, setQuantities] = useState(() => quotation.items.map((item) => item.quantity))
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    setQuantities(quotation.items.map((item) => item.quantity))
  }, [quotation])

  const dirty = useMemo(
    () => quotation.items.some((item, index) => (quantities[index] ?? item.quantity) !== item.quantity),
    [quotation.items, quantities],
  )

  const canEdit = quotation.canRequestQuantities

  const handleQuantityChange = (index: number, quantity: number) => {
    setQuantities((current) => current.map((value, i) => (i === index ? Math.max(1, quantity) : value)))
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const response = await fetch(`/api/public/quotations/${quotation._id}/pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = quotationPdfFilename(quotation)
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "PDF downloaded",
          description: "Quotation PDF saved successfully.",
        })
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || "Failed to download PDF")
      }
    } catch (error) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download PDF",
        variant: "destructive",
      })
    } finally {
      setDownloading(false)
    }
  }

  const handleReturn = async () => {
    if (!dirty) return
    setSending(true)
    try {
      const response = await fetch(`/api/public/quotations/${quotation._id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: quotation.items.map((item, index) => ({
            productId: item.productId,
            quantity: quantities[index] ?? item.quantity,
          })),
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || "Failed to send quantity request")
      }
      toast({
        title: "Request sent",
        description: "Updated quantities were sent back to KK Sports.",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Could not send request",
        description: error instanceof Error ? error.message : "Failed to send quantity request",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/60 print:bg-white">
      <div className="border-b border-border bg-card print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => router.back()} aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <BrandMark compact />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant={canEdit ? "outline" : "default"}
              onClick={() => void handleDownload()}
              disabled={downloading}
              className="h-9"
            >
              {downloading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-1.5 h-3.5 w-3.5" />}
              Download PDF
            </Button>
            {canEdit && (
              <Button type="button" onClick={() => void handleReturn()} disabled={!dirty || sending} className="h-9">
                {sending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
                Send quantity request
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 print:px-0 print:py-0">
        {canEdit && (
          <p className="mb-3 text-sm text-muted-foreground print:hidden">
            Change product quantities if you need different stock, then send the request back.
          </p>
        )}
        <QuotationDocument
          quotation={quotation}
          showPrices={quotation.showPrices}
          quantityEditor={
            canEdit
              ? {
                  quantities,
                  onChange: handleQuantityChange,
                }
              : undefined
          }
        />
      </div>
    </div>
  )
}
