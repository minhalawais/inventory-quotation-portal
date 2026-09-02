"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FileText, ArrowRight } from "lucide-react"

import { Panel, PanelBody, PanelHeader } from "@/components/shared/panel"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { quotationStatusLabel, quotationStatusTone } from "@/lib/quotation"
import { quotationLabel } from "@/lib/quotation-number"

interface RecentQuotation {
  _id: string
  customerName: string
  totalAmount: number
  status: string
  createdAt: string
  quotationNo?: string | null
}

function statusTone(status: string): "success" | "warning" | "info" | "danger" | "neutral" {
  return quotationStatusTone(status)
}

export default function RecentQuotations() {
  const [quotations, setQuotations] = useState<RecentQuotation[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    void fetchRecentQuotations()
  }, [])

  const fetchRecentQuotations = async () => {
    try {
      const response = await fetch("/api/quotations?limit=5")
      if (response.ok) setQuotations(await response.json())
    } catch (error) {
      console.error("Failed to fetch recent quotations:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Panel>
      <PanelHeader className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Recent quotations</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Last 5 customer quotes</p>
        </div>
        <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => router.push("/quotations")}>
          View all
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </PanelHeader>
      <PanelBody className="p-0">
        {loading ? (
          <div className="space-y-0 divide-y divide-border px-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex h-14 items-center gap-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="ml-auto h-5 w-16" />
              </div>
            ))}
          </div>
        ) : quotations.length > 0 ? (
          <div className="divide-y divide-border">
            {quotations.map((quotation) => (
              <button
                key={quotation._id}
                type="button"
                onClick={() => router.push(`/quotations/${quotation._id}`)}
                className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{quotation.customerName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {quotationLabel(quotation)} · PKR {quotation.totalAmount.toLocaleString()} ·{" "}
                    {new Date(quotation.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <StatusBadge tone={statusTone(quotation.status)} className="shrink-0">
                  {quotationStatusLabel(quotation.status)}
                </StatusBadge>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No quotations yet"
            description="Create your first quotation to see it here."
            className="py-10"
          />
        )}
      </PanelBody>
    </Panel>
  )
}
