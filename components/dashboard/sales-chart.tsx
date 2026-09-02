"use client"

import { useState, useEffect } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { TrendingUp } from "lucide-react"

import { Panel, PanelBody, PanelHeader } from "@/components/shared/panel"
import { EmptyState } from "@/components/shared/empty-state"
import { Skeleton } from "@/components/ui/skeleton"

interface SalesData {
  month: string
  sales: number
  revenue: number
}

const GOLD = "hsl(43 74% 38%)"
const TEAL = "hsl(174 58% 32%)"

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border bg-card p-3 text-xs shadow-sm">
      <p className="mb-1.5 font-semibold text-foreground">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-sm" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name === "sales" ? "Orders" : "Revenue"}:</span>
          <span className="font-medium tabular-nums text-foreground">
            {entry.name === "sales" ? `${entry.value}` : `PKR ${entry.value.toLocaleString()}`}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function SalesChart() {
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetchSalesData()
  }, [])

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
    <Panel className="h-full">
      <PanelHeader className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Sales trends</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Orders and revenue over time</p>
        </div>
        <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden />
      </PanelHeader>
      <PanelBody>
        {loading ? (
          <Skeleton className="h-56 w-full rounded-md" />
        ) : salesData.length > 0 ? (
          <div className="h-56" role="img" aria-label="Sales and revenue area chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                <defs>
                  <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={GOLD} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={TEAL} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="orders" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="revenue" orientation="right" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} hide />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={28}
                  formatter={(value) => (value === "sales" ? "Orders" : "Revenue")}
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Area
                  yAxisId="orders"
                  type="monotone"
                  dataKey="sales"
                  stroke={GOLD}
                  strokeWidth={2}
                  fill="url(#ordersGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: GOLD, strokeWidth: 0 }}
                />
                <Area
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  stroke={TEAL}
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: TEAL, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            icon={TrendingUp}
            title="No sales data yet"
            description="Create quotations to see trends here."
            className="h-56 py-8"
          />
        )}
      </PanelBody>
    </Panel>
  )
}
