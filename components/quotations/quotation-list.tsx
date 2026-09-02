"use client"

import { useState, useEffect, useMemo } from "react"
import {
  FileText,
  Download,
  Send,
  Eye,
  Link2,
  MoreHorizontal,
  Search,
  ExternalLink,
  Plus,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { logActivity } from "@/lib/logger"
import { buildWhatsAppShareUrl, formatPhoneForWhatsApp, openWhatsAppShare } from "@/lib/phone-utils"
import QuotationViewModal from "./quotation-view-modal"
import { EmptyState, ErrorState } from "@/components/shared/empty-state"
import { RecordActions } from "@/components/shared/record-actions"
import { RecordOpenLink } from "@/components/shared/record-open-link"
import { WhatsAppIcon } from "@/components/shared/whatsapp-icon"
import { ResponsiveRecordList } from "@/components/shared/responsive-record-list"
import { StatusBadge } from "@/components/shared/status-badge"
import { Toolbar, ToolbarGroup } from "@/components/shared/toolbar"
import { Panel } from "@/components/shared/panel"
import { PageHeading } from "@/components/layout/page-heading"
import { QuotationPeriodSwitch, QUOTATION_MONTHS } from "@/components/quotations/quotation-period-switch"
import { QuotationStats } from "@/components/quotations/quotation-stats"
import { quotationStatusLabel, quotationStatusTone } from "@/lib/quotation"
import { quotationLabel, quotationPdfFilename } from "@/lib/quotation-number"
import { isInteractiveTarget } from "@/lib/utils"

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
    productName?: string
    productImage?: string
    productImages?: string[]
    sentQuantity?: number
  }>
  showPrices?: boolean
  quotationNo?: string | null
  rider?: {
    _id: string
    name: string
    email: string
    phone?: string
  } | null
}

interface QuotationListProps {
  userRole: string
}

function statusTone(status: string): "success" | "warning" | "info" | "danger" | "neutral" {
  return quotationStatusTone(status)
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function quotationPeriod(createdAt: string) {
  const date = new Date(createdAt)
  return { year: date.getFullYear(), month: date.getMonth() }
}

function itemPreview(items: Quotation["items"]) {
  if (items.length === 0) {
    return { title: "No items", detail: "" }
  }

  const first = items[0]?.productName || "Product"
  const qtyChanged = items.some(
    (item) => item.sentQuantity != null && item.sentQuantity !== item.quantity,
  )
  const detailParts = [
    items.length === 1 ? `Qty ${items[0].quantity}` : `${items.length} items`,
    qtyChanged ? "qty updated" : null,
  ].filter(Boolean)

  return { title: first, detail: detailParts.join(" · ") }
}

function WhatsAppShareButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      onClick={onClick}
      className="h-9 bg-[#25D366] px-3 text-white hover:bg-[#1ebe57] hover:text-white"
    >
      <WhatsAppIcon />
      WhatsApp
    </Button>
  )
}

function CopyLinkButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="outline" onClick={onClick} className="h-9 px-3">
      <Link2 className="h-4 w-4" />
      Copy link
    </Button>
  )
}

export default function QuotationList({ userRole }: QuotationListProps) {
  const router = useRouter()
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [filterMonth, setFilterMonth] = useState(() => String(new Date().getMonth()))
  const [filterYear, setFilterYear] = useState(() => String(new Date().getFullYear()))
  const { toast } = useToast()
  const { data: session } = useSession()
  const isManager = userRole === "manager"

  useEffect(() => {
    fetchQuotations()
  }, [])

  const fetchQuotations = async () => {
    try {
      setFetchError(false)
      const response = await fetch("/api/quotations")
      if (response.ok) {
        const data = await response.json()
        setQuotations(data)
      } else {
        setFetchError(true)
      }
    } catch {
      setFetchError(true)
      toast({
        title: "Error",
        description: "Failed to fetch quotations",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const yearOptions = useMemo(() => {
    const years = new Set<number>([new Date().getFullYear()])
    for (const quotation of quotations) {
      years.add(quotationPeriod(quotation.createdAt).year)
    }
    return [...years].sort((a, b) => b - a)
  }, [quotations])

  const filteredQuotations = useMemo(() => {
    let results = [...quotations]
    const searching = Boolean(searchTerm.trim())

    if (statusFilter !== "all") {
      results = results.filter((q) => q.status === statusFilter)
    }

    if (searching) {
      const term = searchTerm.toLowerCase()
      results = results.filter((q) => {
        const inCustomer = q.customerName.toLowerCase().includes(term)
        const inPhone = q.customerPhone.toLowerCase().includes(term)
        const inId = q._id.toLowerCase().includes(term)
        const inNo = (q.quotationNo || "").toLowerCase().includes(term)
        const inProducts = q.items.some(
          (item) =>
            (item.productName || "").toLowerCase().includes(term) ||
            String(item.productId).toLowerCase().includes(term),
        )
        return inCustomer || inPhone || inId || inNo || inProducts
      })
      return results
    }

    const year = Number.parseInt(filterYear, 10)
    results = results.filter((q) => {
      const period = quotationPeriod(q.createdAt)
      if (period.year !== year) return false
      if (filterMonth === "all") return true
      return period.month === Number.parseInt(filterMonth, 10)
    })

    return results
  }, [quotations, searchTerm, statusFilter, filterMonth, filterYear])

  const periodQuotations = useMemo(() => {
    const year = Number.parseInt(filterYear, 10)
    return quotations.filter((quotation) => {
      const period = quotationPeriod(quotation.createdAt)
      if (period.year !== year) return false
      if (filterMonth === "all") return true
      return period.month === Number.parseInt(filterMonth, 10)
    })
  }, [quotations, filterMonth, filterYear])

  const periodLabel =
    filterMonth === "all"
      ? `in ${filterYear}`
      : `in ${QUOTATION_MONTHS[Number.parseInt(filterMonth, 10)]?.label} ${filterYear}`

  const periodStats = useMemo(
    () => ({
      total: periodQuotations.length,
      pending: periodQuotations.filter((quotation) => quotation.status === "pending").length,
      returned: periodQuotations.filter((quotation) => quotation.status === "returned").length,
    }),
    [periodQuotations],
  )

  const handleStatSelect = (status: "all" | "pending" | "returned") => {
    setStatusFilter(status)
    setSearchTerm("")
  }

  const handleStatusChange = async (quotationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/quotations/${quotationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setQuotations((prev) => prev.map((q) => (q._id === quotationId ? { ...q, status: newStatus } : q)))

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
    } catch {
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
        a.download = quotationPdfFilename(quotation)
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
    } catch {
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
      const response = await fetch(`/api/quotations/${quotation._id}/send`, { method: "POST" })

      if (response.ok) {
        setQuotations((prev) => prev.map((q) => (q._id === quotation._id ? { ...q, status: "sent" } : q)))

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
    } catch {
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

      const response = await fetch(`/api/quotations/${quotation._id}/send`, { method: "POST" })

      if (response.ok) {
        setQuotations((prev) => prev.map((q) => (q._id === quotation._id ? { ...q, status: "sent" } : q)))

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
      const response = await fetch(`/api/quotations/${quotation._id}/send`, { method: "POST" })

      if (response.ok) {
        setQuotations((prev) => prev.map((q) => (q._id === quotation._id ? { ...q, status: "sent" } : q)))

        if (navigator.share) {
          const quotationUrl = `${window.location.origin}/quotations/${quotation._id}`
          await navigator.share({
            title: `Quotation for ${quotation.customerName}`,
            text: `Please review your quotation from KK Sports: ${quotationUrl}`,
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
      void logActivity({
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

  const overflowActions = (quotation: Quotation) => (
    <DropdownMenuContent align="end" className="w-52">
      <DropdownMenuItem onClick={() => void handleView(quotation)}>
        <Eye className="mr-2 h-3.5 w-3.5" />
        Open quotation
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => handlePreview(quotation)}>
        <ExternalLink className="mr-2 h-3.5 w-3.5" />
        Preview public link
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => void handleDownload(quotation)}>
        <Download className="mr-2 h-3.5 w-3.5" />
        Download PDF
      </DropdownMenuItem>
      {quotation.status === "pending" && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => void handleSendQuotation(quotation)}>
            <Send className="mr-2 h-3.5 w-3.5" />
            Send quotation
          </DropdownMenuItem>
        </>
      )}
      <DropdownMenuSeparator />
      <div className="px-2 py-1.5">
        <p className="mb-1 text-[11px] font-medium text-muted-foreground">Status</p>
        <Select value={quotation.status} onValueChange={(value) => void handleStatusChange(quotation._id, value)}>
          <SelectTrigger className="h-8 text-xs">
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
      </div>
    </DropdownMenuContent>
  )

  const heading = (
    <PageHeading
      title="Quotations"
      description="Prepare, send, and track customer quotations."
      icon={FileText}
      actions={
        <>
          <QuotationPeriodSwitch
            month={filterMonth}
            year={filterYear}
            years={yearOptions}
            onMonthChange={setFilterMonth}
            onYearChange={setFilterYear}
          />
          <Button asChild>
            <Link href="/quotations/create">
              <Plus className="h-4 w-4" /> Create quotation
            </Link>
          </Button>
        </>
      }
    />
  )

  if (loading) {
    return (
      <div className="space-y-6">
        {heading}
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-[88px] rounded-lg" />
          <Skeleton className="h-[88px] rounded-lg" />
          <Skeleton className="h-[88px] rounded-lg" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-72 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="space-y-6">
        {heading}
        <Panel>
          <ErrorState
            icon={FileText}
            title="Could not load quotations"
            description="Check your connection and try again."
            actionLabel="Retry"
            onAction={() => {
              setLoading(true)
              void fetchQuotations()
            }}
          />
        </Panel>
      </div>
    )
  }

  const table = (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[148px]">Quotation</TableHead>
          <TableHead className="w-[200px]">Customer</TableHead>
          {isManager && <TableHead className="w-[120px]">Rider</TableHead>}
          <TableHead>Items</TableHead>
          <TableHead className="w-[120px]">Total</TableHead>
          <TableHead className="w-[112px]">Status</TableHead>
          <TableHead className="w-[1%] text-right"><span className="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredQuotations.map((quotation) => {
          const preview = itemPreview(quotation.items)
          return (
          <TableRow
            key={quotation._id}
            className="cursor-pointer"
            onClick={(event) => {
              if (isInteractiveTarget(event.target)) return
              void handleView(quotation)
            }}
          >
            <TableCell>
              <div>
                <RecordOpenLink
                  onClick={() => void handleView(quotation)}
                  className="font-mono text-sm"
                  aria-label={`Open quotation ${quotationLabel(quotation)}`}
                >
                  {quotationLabel(quotation)}
                </RecordOpenLink>
                <p className="text-xs text-muted-foreground">{formatDate(quotation.createdAt)}</p>
              </div>
            </TableCell>
            <TableCell>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{quotation.customerName}</p>
                <p className="truncate text-xs text-muted-foreground">{quotation.customerPhone}</p>
              </div>
            </TableCell>
            {isManager && (
              <TableCell>
                <span className="text-xs text-muted-foreground">{quotation.rider?.name || "—"}</span>
              </TableCell>
            )}
            <TableCell className="min-w-0">
              <div className="min-w-0">
                <p className="truncate text-sm">{preview.title}</p>
                {preview.detail && (
                  <p className="truncate text-xs text-muted-foreground">{preview.detail}</p>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div>
                <span className="text-sm font-semibold tabular-nums">
                  PKR {quotation.totalAmount.toLocaleString()}
                </span>
                {quotation.showPrices === false && (
                  <p className="text-xs text-muted-foreground">No price on customer copy</p>
                )}
              </div>
            </TableCell>
            <TableCell>
              <StatusBadge tone={statusTone(quotation.status)}>
                {quotationStatusLabel(quotation.status)}
              </StatusBadge>
            </TableCell>
            <TableCell className="text-right" data-no-row-click>
              <RecordActions className="gap-1.5 whitespace-nowrap">
                <WhatsAppShareButton onClick={() => void handleWhatsAppShare(quotation)} />
                <CopyLinkButton onClick={() => void handleCopyLink(quotation)} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9" aria-label="More actions">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  {overflowActions(quotation)}
                </DropdownMenu>
              </RecordActions>
            </TableCell>
          </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )

  const cards = filteredQuotations.map((quotation) => (
    <div
      key={quotation._id}
      className="cursor-pointer rounded-lg border border-border bg-card p-3"
      onClick={(event) => {
        if (isInteractiveTarget(event.target)) return
        void handleView(quotation)
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <RecordOpenLink onClick={() => void handleView(quotation)} className="truncate text-sm font-semibold">
            {quotation.customerName}
          </RecordOpenLink>
          <p className="text-xs text-muted-foreground">{quotation.customerPhone}</p>
        </div>
        <StatusBadge tone={statusTone(quotation.status)} className="shrink-0">
          {quotationStatusLabel(quotation.status)}
        </StatusBadge>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <RecordOpenLink
          onClick={() => void handleView(quotation)}
          className="font-mono text-xs font-medium text-muted-foreground"
        >
          {quotationLabel(quotation)}
        </RecordOpenLink>
        <span>{formatDate(quotation.createdAt)}</span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <div>
          <p className="text-sm font-semibold tabular-nums">PKR {quotation.totalAmount.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">
            {itemPreview(quotation.items).detail || `${quotation.items.length} items`}
            {isManager && quotation.rider?.name ? ` · ${quotation.rider.name}` : ""}
            {quotation.showPrices === false ? " · no price" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5" data-no-row-click>
          <WhatsAppShareButton onClick={() => void handleWhatsAppShare(quotation)} />
          <CopyLinkButton onClick={() => void handleCopyLink(quotation)} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9" aria-label="More actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            {overflowActions(quotation)}
          </DropdownMenu>
        </div>
      </div>
    </div>
  ))

  return (
    <div className="space-y-6">
      {heading}
      <QuotationStats
        total={periodStats.total}
        pending={periodStats.pending}
        returned={periodStats.returned}
        periodLabel={periodLabel}
        activeStatus={statusFilter}
        onSelect={handleStatSelect}
      />
      <div className="space-y-4">
      <Toolbar>
        <ToolbarGroup className="w-full flex-1">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              placeholder="Search all quotations…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 pl-9"
              aria-label="Search all quotations"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-full sm:w-[150px]" aria-label="Filter by status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </ToolbarGroup>
        <ToolbarGroup>
          <span className="text-xs tabular-nums text-muted-foreground">
            {searchTerm.trim()
              ? `${filteredQuotations.length} results · all time`
              : filterMonth === "all"
                ? `${filteredQuotations.length} in ${filterYear}`
                : `${filteredQuotations.length} in ${QUOTATION_MONTHS[Number.parseInt(filterMonth, 10)]?.label} ${filterYear}`}
          </span>
        </ToolbarGroup>
      </Toolbar>

      {filteredQuotations.length === 0 ? (
        <Panel>
          <EmptyState
            icon={FileText}
            title={
              quotations.length === 0
                ? "No quotations yet"
                : searchTerm.trim()
                  ? "No matching quotations"
                  : "No quotations this month"
            }
            description={
              quotations.length === 0
                ? "Create your first quotation to start managing customer quotes."
                : searchTerm.trim()
                  ? "Try a different search. Search looks across all quotations."
                  : "Search to look across all quotations, or pick another month."
            }
            actionLabel={quotations.length === 0 ? "Create quotation" : undefined}
            onAction={quotations.length === 0 ? () => router.push("/quotations/create") : undefined}
          />
        </Panel>
      ) : (
        <ResponsiveRecordList table={table} cards={cards} />
      )}
      </div>

      <QuotationViewModal
        quotation={selectedQuotation}
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
      />
    </div>
  )
}
