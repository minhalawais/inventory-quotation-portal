"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Download,
  Send,
  Eye,
  MessageCircle,
  Share2,
  MoreHorizontal,
  FileText,
} from "lucide-react"

import { QuotationDocument } from "@/components/quotations/quotation-document"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { buildWhatsAppShareUrl, openWhatsAppShare } from "@/lib/phone-utils"
import { COMPANY, quotationRefDisplay } from "@/lib/company"
import { quotationPdfFilename } from "@/lib/quotation-number"

interface QuotationItem {
  productId: string
  quantity: number
  price: number
  productName?: string
  productImage?: string
  productImages?: string[]
  sentQuantity?: number
}

interface RiderInfo {
  _id: string
  name: string
  email?: string
  phone?: string
}

interface Quotation {
  _id: string
  customerName: string
  customerPhone: string
  customerAddress: string
  totalAmount: number
  status: string
  createdAt: string
  showPrices?: boolean
  quotationNo?: string | null
  items: QuotationItem[]
  riderId?: string
  rider?: RiderInfo | null
}

interface QuotationViewModalProps {
  quotation: Quotation | null
  isOpen: boolean
  onClose: () => void
}

export default function QuotationViewModal({ quotation, isOpen, onClose }: QuotationViewModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [status, setStatus] = useState(quotation?.status || "pending")

  useEffect(() => {
    if (quotation?.status) setStatus(quotation.status)
  }, [quotation?.status, quotation?._id])

  if (!quotation) return null

  const currentStatus = status || quotation.status

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/quotations/${quotation._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setStatus(newStatus)
        toast({
          title: "Status updated",
          description: `Quotation marked as ${newStatus}.`,
        })
        onClose()
      } else {
        throw new Error("Failed to update status")
      }
    } catch {
      toast({
        title: "Status update failed",
        description: "Could not update quotation status.",
        variant: "destructive",
      })
    }
  }

  const handlePreview = () => {
    router.push(`/quotations/${quotation._id}`)
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/quotations/${quotation._id}/pdf`)
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
    } catch {
      toast({
        title: "Download failed",
        description: "Failed to download PDF.",
        variant: "destructive",
      })
    }
  }

  const handleWhatsAppShare = async () => {
    try {
      const quotationUrl = `${window.location.origin}/quotations/${quotation._id}`
      const whatsappUrl = buildWhatsAppShareUrl(quotation.customerPhone, quotation, quotationUrl)
      openWhatsAppShare(whatsappUrl)
    } catch (error) {
      toast({
        title: "Unable to open WhatsApp",
        description: error instanceof Error ? error.message : "Check the customer's phone number and try again",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/quotations/${quotation._id}/send`, { method: "POST" })
      if (response.ok) {
        setStatus("sent")
        toast({
          title: "WhatsApp message ready",
          description: "The quotation message opened and the status was updated to sent",
        })
      } else {
        throw new Error("Failed to update quotation status")
      }
    } catch {
      toast({
        title: "WhatsApp message ready",
        description: "The message opened, but the quotation status could not be updated",
      })
    }
  }

  const handleCopyLink = async () => {
    try {
      const quotationUrl = `${window.location.origin}/quotations/${quotation._id}`
      await navigator.clipboard.writeText(quotationUrl)

      const response = await fetch(`/api/quotations/${quotation._id}/send`, { method: "POST" })
      if (response.ok) {
        setStatus("sent")
        toast({
          title: "Link copied",
          description: "Quotation link copied and status updated to sent.",
        })
      } else {
        throw new Error("Failed to update quotation status")
      }
    } catch (error) {
      toast({
        title: "Copy failed",
        description: error instanceof Error ? error.message : "Failed to copy link",
        variant: "destructive",
      })
    }
  }

  const handleSend = async () => {
    try {
      const response = await fetch(`/api/quotations/${quotation._id}/send`, { method: "POST" })

      if (response.ok) {
        setStatus("sent")
        if (navigator.share) {
          const quotationUrl = `${window.location.origin}/quotations/${quotation._id}`
          await navigator.share({
            title: `Quotation for ${quotation.customerName}`,
            text: `Please review your quotation from ${COMPANY.name}: ${quotationUrl}`,
            url: quotationUrl,
          })
        } else {
          const quotationUrl = `${window.location.origin}/quotations/${quotation._id}`
          await navigator.clipboard.writeText(quotationUrl)
          toast({
            title: "Link copied",
            description: "Quotation link copied to clipboard.",
          })
        }

        toast({
          title: "Quotation sent",
          description: "Quotation marked as sent.",
        })
      } else {
        throw new Error("Failed to send quotation")
      }
    } catch (error) {
      toast({
        title: "Send failed",
        description: error instanceof Error ? error.message : "Failed to send quotation",
        variant: "destructive",
      })
    }
  }

  const documentModel = { ...quotation, status: currentStatus }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[92vh] w-full max-w-[1040px] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
              Quotation {quotationRefDisplay(quotation)}
            </DialogTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={currentStatus} onValueChange={(v) => void handleStatusChange(v)}>
                <SelectTrigger className="h-9 w-[130px] capitalize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="sm" className="h-9" onClick={handlePreview}>
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                Preview
              </Button>
              <Button type="button" size="sm" className="h-9" onClick={() => void handleDownload()}>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Download
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="icon" className="h-9 w-9" aria-label="More actions">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => void handleWhatsAppShare()}>
                    <MessageCircle className="mr-2 h-3.5 w-3.5" />
                    WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void handleCopyLink()}>
                    <Share2 className="mr-2 h-3.5 w-3.5" />
                    Copy link
                  </DropdownMenuItem>
                  {currentStatus === "pending" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => void handleSend()}>
                        <Send className="mr-2 h-3.5 w-3.5" />
                        Send quotation
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto bg-muted/40 p-4 sm:p-5">
          <QuotationDocument quotation={documentModel} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
