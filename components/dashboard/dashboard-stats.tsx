"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Package, FileText, Users, TrendingUp, ArrowUpRight } from "lucide-react"

interface Stats {
  totalProducts: number
  totalQuotations: number
  totalUsers: number
  totalRevenue: number
}

const STAT_CONFIG = [
  {
    key: "totalProducts" as keyof Stats,
    title: "Total Products",
    icon: Package,
    route: "/products",
    accent: "#4f46e5",       // indigo
    bg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    borderColor: "border-l-indigo-500",
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "totalQuotations" as keyof Stats,
    title: "Quotations",
    icon: FileText,
    route: "/quotations",
    accent: "#059669",       // emerald
    bg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    borderColor: "border-l-emerald-500",
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "totalUsers" as keyof Stats,
    title: "Active Users",
    icon: Users,
    route: "/users",
    accent: "#0284c7",       // sky
    bg: "bg-sky-50",
    iconColor: "text-sky-600",
    borderColor: "border-l-sky-500",
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "totalRevenue" as keyof Stats,
    title: "Total Revenue",
    icon: TrendingUp,
    route: "/quotations",
    accent: "#d97706",       // amber
    bg: "bg-amber-50",
    iconColor: "text-amber-600",
    borderColor: "border-l-amber-500",
    format: (v: number) => `PKR ${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toLocaleString()}`,
  },
]

export default function DashboardStats() {
  const [stats, setStats] = useState<Stats>({ totalProducts: 0, totalQuotations: 0, totalUsers: 0, totalRevenue: 0 })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats")
      if (response.ok) setStats(await response.json())
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 border-l-4 border-l-gray-200"
          >
            <div className="mb-4 h-3 w-24 rounded bg-gray-200" />
            <div className="h-8 w-16 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {STAT_CONFIG.map((stat) => (
        <button
          key={stat.key}
          onClick={() => router.push(stat.route)}
          className={`group relative overflow-hidden rounded-xl border border-gray-200 border-l-4 ${stat.borderColor} bg-white p-5 text-left transition-all duration-200 hover:border-gray-300 hover:shadow-md`}
          style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {stat.title}
              </p>
              <p className="mt-2.5 text-2xl font-bold text-gray-950 tracking-tight">
                {stat.format(stats[stat.key] as number)}
              </p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-gray-400 group-hover:text-indigo-600 transition-colors">
            <span>View details</span>
            <ArrowUpRight className="h-3 w-3" />
          </div>
        </button>
      ))}
    </div>
  )
}
