"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  X,
  Download,
  Send,
  Eye,
  Phone,
  MapPin,
  Calendar,
  FileText,
  MessageCircle,
  Share2,
  User,
  Clock,
  Package,
  DollarSign,
  Mail 
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatPhoneForWhatsApp, generateWhatsAppMessage } from "@/lib/phone-utils"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface QuotationItem {
  productId: string
  quantity: number
  price: number
  productName?: string
  productImage?: string
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
  items: QuotationItem[]
  riderId?: string
  rider?: RiderInfo // Add rider information
}
interface QuotationViewModalProps {
  quotation: Quotation | null
  isOpen: boolean
  onClose: () => void
}

export default function QuotationViewModal({ quotation, isOpen, onClose }: QuotationViewModalProps) {
  const router = useRouter()
  const { toast } = useToast()

  if (!quotation) return null
  console.log("quotation", quotation);
  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "status-sent"
      case "pending":
        return "status-pending"
      case "completed":
        return "status-completed" // You'll need to add this CSS class
      case "cancelled":
        return "status-cancelled"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }
  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/quotations/${quotation._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })
  
      if (response.ok) {
        // Update local state if needed
        toast({
          title: "Success",
          description: `Status updated to ${newStatus}`,
        })
        onClose() // Close the modal to reflect changes
      } else {
        throw new Error("Failed to update status")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
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
      a.download = `quotation-${quotation._id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: "PDF downloaded successfully",
      })
    } catch (error) {
      console.error("Error downloading PDF:", error)
      toast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive",
      })
    }
  }

  const handleWhatsAppShare = async () => {
    try {
      const formattedPhone = formatPhoneForWhatsApp(quotation.customerPhone)
      const quotationUrl = `${window.location.origin}/quotations/${quotation._id}`
      const message = generateWhatsAppMessage(quotation, quotationUrl)
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`

      const response = await fetch(`/api/quotations/${quotation._id}/send`, {
        method: "POST",
      })

      if (response.ok) {
        window.open(whatsappUrl, "_blank")
        toast({
          title: "Success",
          description: "WhatsApp opened with quotation link and status updated to sent",
        })
      } else {
        throw new Error("Failed to update quotation status")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to open WhatsApp",
        variant: "destructive",
      })
    }
  }

  const handleCopyLink = async () => {
    try {
      const quotationUrl = `${window.location.origin}/quotations/${quotation._id}`
      await navigator.clipboard.writeText(quotationUrl)

      const response = await fetch(`/api/quotations/${quotation._id}/send`, {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Quotation link copied to clipboard and status updated to sent",
        })
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

  const handleSend = async () => {
    try {
      const response = await fetch(`/api/quotations/${quotation._id}/send`, {
        method: "POST",
      })

      if (response.ok) {
        if (navigator.share) {
          const quotationUrl = `${window.location.origin}/quotations/${quotation._id}`
          await navigator.share({
            title: `Quotation for ${quotation.customerName}`,
            text: `Please review your quotation from Inventory Portal: ${quotationUrl}`,
            url: quotationUrl,
          })
        } else {
          const quotationUrl = `${window.location.origin}/quotations/${quotation._id}`
          await navigator.clipboard.writeText(quotationUrl)
          toast({
            title: "Link Copied",
            description: "Quotation link copied to clipboard. You can now share it anywhere.",
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
      console.error("Error sending quotation:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send quotation",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto custom-scrollbar p-0 sm:p-6">
        {/* Mobile Header */}
        <DialogHeader className="sticky top-0 bg-white z-10 p-4 sm:p-0 border-b sm:border-b-0 rounded-t-lg">
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-bold text-secondary">Quotation Details</span>
                <p className="text-sm text-muted-foreground">#{quotation._id.slice(-8).toUpperCase()}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
              <Button
                onClick={handlePreview}
                size="sm"
                variant="outline"
                className="mobile-button flex-shrink-0 hover:bg-primary/5 hover:border-primary/30 hover:text-primary bg-transparent"
              >
                <Eye className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Preview</span>
                <span className="sm:hidden">Preview</span>
              </Button>

              <Button onClick={handleDownload} size="sm" className="btn-primary mobile-button flex-shrink-0">
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Download</span>
                <span className="sm:hidden">PDF</span>
              </Button>

              <Button onClick={handleWhatsAppShare} size="sm" className="btn-success mobile-button flex-shrink-0">
                <MessageCircle className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">WhatsApp</span>
                <span className="sm:hidden">WA</span>
              </Button>

              <Button
                onClick={handleCopyLink}
                size="sm"
                variant="outline"
                className="mobile-button flex-shrink-0 hover:bg-gray-50 hover:border-gray-300 bg-transparent"
              >
                <Share2 className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Copy Link</span>
                <span className="sm:hidden">Link</span>
              </Button>

              {quotation.status === "pending" && (
                <Button onClick={handleSend} size="sm" className="btn-success mobile-button flex-shrink-0">
                  <Send className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Send</span>
                  <span className="sm:hidden">Send</span>
                </Button>
              )}

              {/* Close Button - Always visible and properly positioned for mobile */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="flex-shrink-0 ml-auto sm:ml-0 bg-white/90 sm:bg-transparent rounded-full p-2 sm:p-0"
              >
                <X className="h-5 w-5 text-gray-600 sm:text-current" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Rest of the content */}
        <div className="p-4 sm:p-0 space-y-6">
          {/* Header Info Card */}
          <div className="gradient-primary rounded-xl p-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-3 text-white">
                  Quotation #{quotation._id.slice(-8).toUpperCase()}
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    <Select value={quotation.status} onValueChange={handleStatusChange}>
                      <SelectTrigger className={`${getStatusColor(quotation.status)} px-4 py-2 font-semibold`}>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">PENDING</SelectItem>
                        <SelectItem value="sent">SENT</SelectItem>
                        <SelectItem value="completed">COMPLETED</SelectItem>
                        <SelectItem value="cancelled">CANCELLED</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2 text-primary-foreground/80">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">Created: {new Date(quotation.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-primary-foreground/80">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Created: {new Date(quotation.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-primary-foreground/80 mb-1">Total Amount</p>
                <p className="text-2xl sm:text-3xl font-bold">PKR {quotation.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Customer and Quotation Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Information */}
            <div className="card-modern mobile-card">
              <h3 className="text-lg font-bold text-secondary mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                Customer Information
              </h3>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Customer Name</p>
                    <p className="font-semibold text-secondary text-lg">{quotation.customerName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Phone Number</p>
                    <p className="font-semibold text-secondary text-lg">{quotation.customerPhone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Address</p>
                    <p className="font-semibold text-secondary break-words">{quotation.customerAddress}</p>
                  </div>
                </div>
              </div>
            </div>
            {quotation.rider && (
              <div className="card-modern mobile-card">
                <h3 className="text-lg font-bold text-secondary mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  Prepared By
                </h3>
                
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Rider Name</p>
                      <p className="font-semibold text-secondary text-lg">{quotation.rider.name}</p>
                    </div>
                  </div>
                  
                  {quotation.rider.phone && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Contact Number</p>
                        <p className="font-semibold text-secondary text-lg">{quotation.rider.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {quotation.rider.email && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                        <p className="font-semibold text-secondary break-words">{quotation.rider.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quotation Details */}
            <div className="card-modern mobile-card bg-primary/5 border-primary/20">
              <h3 className="text-lg font-bold text-secondary mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                Quotation Details
              </h3>

              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Created Date</p>
                    <p className="font-semibold text-secondary text-lg">
                      {new Date(quotation.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Valid Until</p>
                    <p className="font-semibold text-secondary text-lg">
                      {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Items Count</p>
                    <p className="font-semibold text-secondary text-lg">{quotation.items.length} items</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="card-modern overflow-hidden">
            <div className="gradient-primary p-6 text-center">
              <h3 className="text-xl font-bold text-white flex items-center justify-center gap-3">
                <Package className="h-6 w-6" />
                Quotation Items
              </h3>
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="table-modern">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left w-16">Image</th>
                    <th className="text-left">Product ID</th>
                    <th className="text-left">Product Name</th>
                    <th className="text-center">Quantity</th>
                    <th className="text-right">Unit Price</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.items.map((item, index) => (
                    <tr key={index} className="hover:bg-muted/30">
                      <td>
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                          <Image
                            src={item.productImage || "/placeholder.svg?height=48&width=48"}
                            alt={item.productName || "Product"}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="font-mono text-sm font-bold text-primary">{item.productId}</td>
                      <td className="font-medium text-secondary">{item.productName || "Product"}</td>
                      <td className="text-center font-semibold">{item.quantity}</td>
                      <td className="text-right font-semibold text-primary">PKR {item.price.toLocaleString()}</td>
                      <td className="text-right font-bold text-primary">
                        PKR {(item.quantity * item.price).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden divide-y">
              {quotation.items.map((item, index) => (
                <div key={index} className="p-6">
                  <div className="flex gap-4 mb-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.productImage || "/placeholder.svg?height=64&width=64"}
                        alt={item.productName || "Product"}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-bold text-primary mb-1">{item.productId}</p>
                      <p className="font-semibold text-secondary text-lg">{item.productName || "Product"}</p>
                      <div className="text-right mt-2">
                        <p className="text-sm text-muted-foreground">Quantity</p>
                        <p className="font-bold text-xl text-secondary">{item.quantity}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Unit Price</p>
                      <p className="font-semibold text-primary text-lg">PKR {item.price.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Total</p>
                      <p className="font-bold text-primary text-xl">
                        PKR {(item.quantity * item.price).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Summary */}
          <div className="gradient-primary rounded-xl p-6 text-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-primary-foreground/80 text-sm">Grand Total</p>
                  <p className="text-3xl font-bold">PKR {quotation.totalAmount.toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right text-sm text-primary-foreground/80 space-y-1">
                <p>Subtotal: PKR {quotation.totalAmount.toLocaleString()}</p>
                <p>Tax: PKR 0</p>
                <p className="font-semibold text-white">Total: PKR {quotation.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
