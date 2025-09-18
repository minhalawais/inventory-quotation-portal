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
import { formatPhoneForWhatsApp, generateWhatsAppMessage } from "@/lib/phone-utils"
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
    try {
      const formattedPhone = formatPhoneForWhatsApp(quotation.customerPhone)
      const quotationUrl = `${window.location.origin}/quotations/${quotation._id}`
      const message = generateWhatsAppMessage(quotation, quotationUrl)
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`

      const response = await fetch(`/api/quotations/${quotation._id}/send`, {
        method: "POST",
      })

      if (response.ok) {
        setQuotations(quotations.map((q) => (q._id === quotation._id ? { ...q, status: "sent" } : q)))
        window.open(whatsappUrl, "_blank")

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
          title: "Success",
          description: "WhatsApp opened with quotation link and status updated to sent",
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
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to open WhatsApp",
        variant: "destructive",
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="h-4 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {quotations.map((quotation) => (
          <div key={quotation._id} className="group relative">
            {/* Document-style card with paper effect */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative">
              
              {/* Document header with letterhead style */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 p-4 relative">
                {/* Document corner fold effect */}
                <div className="absolute top-0 right-0 w-6 h-6 bg-gray-100 transform rotate-45 translate-x-3 -translate-y-3 border-l border-b border-gray-200"></div>
                
                {/* Quotation ID and Status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-medium">QUOTATION</div>
                      <div className="text-sm font-semibold text-gray-800">#{quotation._id.slice(-6).toUpperCase()}</div>
                    </div>
                  </div>
                  
                  {/* Status indicator */}
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusDot(quotation.status)}`}></div>
                    <Select
                      value={quotation.status}
                      onValueChange={(value) => handleStatusChange(quotation._id, value)}
                    >
                      <SelectTrigger className={`${getStatusColor(quotation.status)} border h-7 px-2 text-xs font-medium min-w-[80px]`}>
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
                </div>

                {/* Date */}
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Calendar className="h-3 w-3" />
                  <span>Issued: {new Date(quotation.createdAt).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}</span>
                </div>
              </div>

              {/* Document body */}
              <div className="p-4 space-y-4">
                {/* Bill To Section */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 border-b border-gray-100 pb-1">
                    Bill To
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      <span className="font-semibold text-gray-800 text-sm">{quotation.customerName}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-600">{quotation.customerPhone}</span>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {quotation.customerAddress}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Items Summary</span>
                    </div>
                    <span className="text-xs bg-white px-2 py-1 rounded-full border text-gray-600">
                      {quotation.items.length} items
                    </span>
                  </div>
                  
                  {/* Total Amount */}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">Total Amount:</span>
                      <span className="text-lg font-bold text-blue-600">
                        PKR {quotation.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document footer with actions */}
              <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                {/* Primary Actions */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleView(quotation)}
                    className="text-xs h-8 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    View
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePreview(quotation)}
                    className="text-xs h-8 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200"
                  >
                    <FileText className="mr-1 h-3 w-3" />
                    Preview
                  </Button>
                </div>

                {/* Secondary Actions */}
                <div className="grid grid-cols-3 gap-1 mb-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownload(quotation)}
                    className="text-xs h-7 hover:bg-green-50 hover:text-green-700"
                  >
                    <Download className="h-3 w-3" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleWhatsAppShare(quotation)}
                    className="text-xs h-7 hover:bg-green-50 hover:text-green-700"
                  >
                    <MessageCircle className="h-3 w-3" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyLink(quotation)}
                    className="text-xs h-7 hover:bg-gray-100 hover:text-gray-700"
                  >
                    <Share2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Send Button */}
                {quotation.status === "pending" && (
                  <Button
                    size="sm"
                    onClick={() => handleSendQuotation(quotation)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                  >
                    <Send className="mr-1 h-3 w-3" />
                    Send Quotation
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}

        {quotations.length === 0 && (
          <div className="col-span-full">
            <Card className="text-center py-12 border-2 border-dashed border-gray-300">
              <CardContent>
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">No quotations found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Create your first quotation to get started with managing your business quotes and proposals.
                </p>
                <Button
                  onClick={() => (window.location.href = "/quotations/create")}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Create Your First Quotation
                </Button>
              </CardContent>
            </Card>
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