"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FileText, ArrowRight, Clock } from "lucide-react"

interface RecentQuotation {
  _id: string
  customerName: string
  totalAmount: number
  status: string
  createdAt: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  sent: { label: "Sent", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700 border border-amber-200" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-700 border border-red-200" },
}

export default function RecentQuotations() {
  const [quotations, setQuotations] = useState<RecentQuotation[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => { fetchRecentQuotations() }, [])

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

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()

  const AVATAR_COLORS = [
    "border-blue-100 bg-blue-50 text-blue-700",
    "border-emerald-100 bg-emerald-50 text-emerald-700",
    "border-sky-100 bg-sky-50 text-sky-700",
    "border-amber-100 bg-amber-50 text-amber-700",
    "border-rose-100 bg-rose-50 text-rose-700",
  ]

  return (
    <div className="rounded-xl border border-gray-200 bg-white" style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Recent Quotations</h3>
          <p className="text-xs text-gray-500 mt-0.5">Last 5 customer quotes</p>
        </div>
        <button
          onClick={() => router.push("/quotations")}
          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div className="divide-y divide-gray-100">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="flex animate-pulse items-center gap-4 px-5 py-3.5">
              <div className="h-9 w-9 rounded-full bg-gray-100 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-36 rounded bg-gray-100" />
                <div className="h-2.5 w-24 rounded bg-gray-100" />
              </div>
              <div className="h-5 w-16 rounded-full bg-gray-100" />
            </div>
          ))
        ) : quotations.length > 0 ? (
          quotations.map((quotation, idx) => {
            const sc = statusConfig[quotation.status] ?? statusConfig.pending
            return (
              <button
                key={quotation._id}
                onClick={() => router.push(`/quotations/${quotation._id}`)}
                className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-gray-50/80"
              >
                {/* Avatar */}
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} text-[11px] font-bold`}
                >
                  {getInitials(quotation.customerName)}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {quotation.customerName}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs font-semibold text-gray-700">
                      PKR {quotation.totalAmount.toLocaleString()}
                    </p>
                    <span className="text-gray-300">·</span>
                    <div className="flex items-center gap-1 text-[11px] text-gray-400">
                      <Clock className="h-3 w-3" />
                      {new Date(quotation.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${sc.className}`}>
                  {sc.label}
                </span>
              </button>
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">No quotations yet</p>
            <p className="text-xs text-gray-400">Create your first quotation to see it here</p>
          </div>
        )}
      </div>
    </div>
  )
}
