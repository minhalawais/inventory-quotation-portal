"use client"

import { useState, useEffect } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp } from "lucide-react"

interface SalesData {
  month: string
  sales: number
  revenue: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-900 mb-1.5">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-gray-500 capitalize">{entry.name === "sales" ? "Orders" : "Revenue"}:</span>
          <span className="font-medium text-gray-900">
            {entry.name === "sales"
              ? `${entry.value}`
              : `PKR ${(entry.value / 1000).toFixed(1)}K`}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function SalesChart() {
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchSalesData() }, [])

  const fetchSalesData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/dashboard/sales")
      if (response.ok) setSalesData(await response.json())
      else setSalesData([])
    } catch {
      setSalesData([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white" style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Sales Trends</h3>
          <p className="text-xs text-gray-500 mt-0.5">Orders and revenue over time</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
          <TrendingUp className="h-4 w-4 text-indigo-600" />
        </div>
      </div>

      {/* Chart */}
      <div className="p-5">
        {loading ? (
          <div className="flex h-56 items-center justify-center">
            <div className="space-y-3 w-full">
              {[80, 60, 90, 40, 75, 55].map((w, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="h-2 animate-pulse rounded bg-gray-100" style={{ width: `${w}%` }} />
                </div>
              ))}
            </div>
          </div>
        ) : salesData.length > 0 ? (
          <>
            {/* Legend */}
            <div className="mb-4 flex items-center gap-5">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />
                <span className="text-xs font-medium text-gray-500">Orders</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                <span className="text-xs font-medium text-gray-500">Revenue</span>
              </div>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData} margin={{ top: 2, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#salesGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="flex h-56 flex-col items-center justify-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">No sales data yet</p>
            <p className="text-xs text-gray-400">Create quotations to see trends here</p>
          </div>
        )}
      </div>
    </div>
  )
}
