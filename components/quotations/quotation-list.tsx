"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Download,
  Send,
  Eye,
  MessageCircle,
  Phone,
  MapPin,
  Share2,
  Calendar,
  DollarSign,
  Package,
  ChevronDown,
  Hash,
  User,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { logActivity } from "@/lib/logger"
import { buildWhatsAppShareUrl, formatPhoneForWhatsApp, openWhatsAppShare } from "@/lib/phone-utils"
import QuotationViewModal from "./quotation-view-modal"
import QuotationPreview from "./quotation-preview"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Quotation {
  _id: string
  customerName: string
  customerPhone: string
  customerAddress: string
  totalAmount: number
  status: string
  createdAt: string
  items: Array<{
    productId: string
    quantity: number
    price: number
  }>
}

interface QuotationListProps {
  userRole: string
}

export default function QuotationList({ userRole }: QuotationListProps) {
  const router = useRouter()
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const { toast } = useToast()
  const { data: session } = useSession()

  useEffect(() => {
    fetchQuotations()
  }, [])

  const fetchQuotations = async () => {
    try {
      const response = await fetch("/api/quotations")
      if (response.ok) {
        const data = await response.json()
        setQuotations(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch quotations",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (quotationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/quotations/${quotationId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setQuotations(quotations.map(q => 
          q._id === quotationId ? { ...q, status: newStatus } : q
        ))

        if (session) {
          await logActivity({
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: "UPDATE_STATUS",
            resource: "Quotation",
            resourceId: quotationId,
            details: `Changed quotation status to ${newStatus}`,
            status: "success",
          })
        }

        toast({
          title: "Success",
          description: `Quotation status updated to ${newStatus}`,
        })
      } else {
        throw new Error("Failed to update status")
      }
    } catch (error) {
      if (session) {
        await logActivity({
          userId: session.user.id,
          userName: session.user.name,
          userRole: session.user.role,
          action: "UPDATE_STATUS",
          resource: "Quotation",
          resourceId: quotationId,
          details: `Failed to change quotation status to ${newStatus}`,
          status: "error",
        })
      }

      toast({
        title: "Error",
        description: "Failed to update quotation status",
        variant: "destructive",
      })
    }
  }

  const handleView = async (quotation: Quotation) => {
    setSelectedQuotation(quotation)
    setViewModalOpen(true)

    if (session) {
      await logActivity({
        userId: session.user.id,
        userName: session.user.name,
        userRole: session.user.role,
        action: "VIEW",
        resource: "Quotation",
        resourceId: quotation._id,
        details: `Viewed quotation for ${quotation.customerName}`,
        status: "success",
      })
    }
  }

  const handleDownload = async (quotation: Quotation) => {
    try {
      const response = await fetch(`/api/quotations/${quotation._id}/pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `quotation-${quotation.customerName.replace(/\s+/g, "-")}-${quotation._id.slice(-6)}.pdf`
        a.click()
        window.URL.revokeObjectURL(url)

        if (session) {
          await logActivity({
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: "DOWNLOAD",
            resource: "Quotation",
            resourceId: quotation._id,
            details: `Downloaded PDF for quotation: ${quotation.customerName}`,
            status: "success",
          })
        }

        toast({
          title: "Success",
          description: "Quotation PDF downloaded successfully",
        })
      } else {
        throw new Error("Failed to download PDF")
      }
    } catch (error) {
      if (session) {
        await logActivity({
          userId: session.user.id,
          userName: session.user.name,
          userRole: session.user.role,
          action: "DOWNLOAD",
          resource: "Quotation",
          resourceId: quotation._id,
          details: `Failed to download PDF for quotation: ${quotation.customerName}`,
          status: "error",
        })
      }

      toast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive",
      })
    }
  }

  const handleWhatsAppShare = async (quotation: Quotation) => {
    let formattedPhone: string

    try {
      formattedPhone = formatPhoneForWhatsApp(quotation.customerPhone)
      const quotationUrl = `${window.location.origin}/quotations/${quotation._id}`
      const whatsappUrl = buildWhatsAppShareUrl(formattedPhone, quotation, quotationUrl)

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
      const response = await fetch(`/api/quotations/${quotation._id}/send`, {
        method: "POST",
      })

      if (response.ok) {
        setQuotations(quotations.map((q) => (q._id === quotation._id ? { ...q, status: "sent" } : q)))

        if (session) {
          await logActivity({
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: "SHARE",
            resource: "Quotation",
            resourceId: quotation._id,
            details: `Shared quotation via WhatsApp to ${quotation.customerName} (${formattedPhone})`,
            status: "success",
          })
        }

        toast({
          title: "WhatsApp message ready",
          description: "The quotation message opened and the status was updated to sent",
        })
      } else {
        throw new Error("Failed to update quotation status")
      }
    } catch (error) {
      if (session) {
        await logActivity({
          userId: session.user.id,
          userName: session.user.name,
          userRole: session.user.role,
          action: "SHARE",
          resource: "Quotation",
          resourceId: quotation._id,
          details: `Failed to share quotation via WhatsApp to ${quotation.customerName}`,
          status: "error",
        })
      }

      toast({
        title: "WhatsApp message ready",
        description: "The message opened, but the quotation status could not be updated",
      })
    }
  }

  const handleCopyLink = async (quotation: Quotation) => {
    try {
      const quotationUrl = `${window.location.origin}/quotations/${quotation._id}`
      await navigator.clipboard.writeText(quotationUrl)

      const response = await fetch(`/api/quotations/${quotation._id}/send`, {
        method: "POST",
      })

      if (response.ok) {
        setQuotations(quotations.map((q) => (q._id === quotation._id ? { ...q, status: "sent" } : q)))

        toast({
          title: "Success",
          description: "Quotation link copied to clipboard and status updated to sent",
        })

        if (session) {
          await logActivity({
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: "COPY_LINK",
            resource: "Quotation",
            resourceId: quotation._id,
            details: `Copied quotation link for ${quotation.customerName}`,
            status: "success",
          })
        }
      } else {
        throw new Error("Failed to update quotation status")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to copy link",
        variant: "destructive",
      })
    }
  }

  const handleSendQuotation = async (quotation: Quotation) => {
    try {
      const response = await fetch(`/api/quotations/${quotation._id}/send`, {
        method: "POST",
      })

      if (response.ok) {
        setQuotations(quotations.map((q) => (q._id === quotation._id ? { ...q, status: "sent" } : q)))

        if (navigator.share) {
          const quotationUrl = `${window.location.origin}/quotations/${quotation._id}`
          await navigator.share({
            title: `Quotation for ${quotation.customerName}`,
            text: `Please review your quotation from Inventory Portal: ${quotationUrl}`,
            url: quotationUrl,
          });
        } else {
          const quotationUrl = `${window.location.origin}/quotations/${quotation._id}`
          await navigator.clipboard.writeText(quotationUrl)
          toast({
            title: "Link Copied",
            description: "Quotation link copied to clipboard. You can now share it anywhere.",
          })
        }

        if (session) {
          await logActivity({
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: "SEND",
            resource: "Quotation",
            resourceId: quotation._id,
            details: `Sent quotation to ${quotation.customerName}`,
            status: "success",
          })
        }

        toast({
          title: "Success",
          description: "Quotation sent successfully and marked as sent",
        })
      } else {
        throw new Error("Failed to send quotation")
      }
    } catch (error) {
      if (session) {
        await logActivity({
          userId: session.user.id,
          userName: session.user.name,
          userRole: session.user.role,
          action: "SEND",
          resource: "Quotation",
          resourceId: quotation._id,
          details: `Failed to send quotation to ${quotation.customerName}`,
          status: "error",
        })
      }

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send quotation",
        variant: "destructive",
      })
    }
  }

  const handlePreview = (quotation: Quotation) => {
    router.push(`/quotations/${quotation._id}`)

    if (session) {
      logActivity({
        userId: session.user.id,
        userName: session.user.name,
        userRole: session.user.role,
        action: "VIEW",
        resource: "Quotation",
        resourceId: quotation._id,
        details: `Previewed quotation for ${quotation.customerName}`,
        status: "success",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-50 text-green-700 border-green-200"
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "completed":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const getStatusDot = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-500"
      case "pending":
        return "bg-yellow-500"
      case "completed":
        return "bg-blue-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 bg-gray-50 p-4">
              <div className="mb-3 h-4 w-32 rounded bg-gray-200" />
              <div className="h-3 w-24 rounded bg-gray-200" />
            </div>
            <div className="p-4 space-y-3">
              <div className="h-3 w-full rounded bg-gray-100" />
              <div className="h-3 w-4/5 rounded bg-gray-100" />
              <div className="h-16 rounded-lg bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {quotations.map((quotation) => (
          <div
            key={quotation._id}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:border-gray-300 hover:shadow-md"
            style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}
          >
            {/* Document header */}
            <div className="border-b border-gray-100 bg-gray-50/80 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                    <FileText className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Quotation</p>
                    <p className="text-sm font-bold text-gray-900">#{quotation._id.slice(-6).toUpperCase()}</p>
                  </div>
                </div>

                {/* Status selector */}
                <Select
                  value={quotation.status}
                  onValueChange={(value) => handleStatusChange(quotation._id, value)}
                >
                  <SelectTrigger
                    className={`h-7 w-auto rounded-full border px-2.5 text-[11px] font-semibold ${
                      getStatusColor(quotation.status)
                    }`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-2.5 flex items-center gap-1 text-xs text-gray-400">
                <Calendar className="h-3 w-3" />
                <span>
                  {new Date(quotation.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Card body */}
            <div className="p-4 space-y-3">
              {/* Customer */}
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Customer</p>
                <p className="text-sm font-semibold text-gray-900">{quotation.customerName}</p>
                <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                  <Phone className="h-3 w-3" />
                  <span>{quotation.customerPhone}</span>
                </div>
                {quotation.customerAddress && (
                  <div className="mt-0.5 flex items-start gap-1 text-xs text-gray-500">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                    <span className="line-clamp-1">{quotation.customerAddress}</span>
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Package className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500">{quotation.items.length} items</span>
                </div>
                <span className="text-base font-bold text-gray-950">
                  PKR {quotation.totalAmount.toLocaleString()}
                </span>
              </div>

              {/* Primary actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleView(quotation)}
                  className="h-9 rounded-lg text-xs font-medium hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePreview(quotation)}
                  className="h-9 rounded-lg text-xs font-medium hover:border-gray-300"
                >
                  <FileText className="mr-1.5 h-3.5 w-3.5" />
                  Preview
                </Button>
              </div>

              {/* Secondary actions */}
              <div className="grid grid-cols-3 gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(quotation)}
                  className="h-8 rounded-lg text-[11px] font-medium hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                  title="Download PDF"
                >
                  <Download className="mr-1 h-3 w-3" />
                  PDF
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleWhatsAppShare(quotation)}
                  className="h-8 rounded-lg text-[11px] font-medium hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                  title="Share via WhatsApp"
                >
                  <MessageCircle className="mr-1 h-3 w-3" />
                  WA
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyLink(quotation)}
                  className="h-8 rounded-lg text-[11px] font-medium hover:border-gray-300"
                  title="Copy link"
                >
                  <Share2 className="mr-1 h-3 w-3" />
                  Copy
                </Button>
              </div>

              {/* Send button for pending */}
              {quotation.status === "pending" && (
                <Button
                  size="sm"
                  onClick={() => handleSendQuotation(quotation)}
                  className="h-9 w-full rounded-lg text-xs font-semibold"
                  style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
                >
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  Send quotation
                </Button>
              )}
            </div>
          </div>
        ))}

        {quotations.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <FileText className="h-7 w-7 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">No quotations yet</p>
              <p className="mt-1 text-xs text-gray-500">
                Create your first quotation to start managing customer quotes.
              </p>
            </div>
            <Button
              onClick={() => (window.location.href = "/quotations/create")}
              size="sm"
              className="mt-1 h-9 rounded-lg"
            >
              <FileText className="mr-2 h-3.5 w-3.5" />
              Create quotation
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      <QuotationViewModal
        quotation={selectedQuotation}
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
      />
    </>
  )
}
