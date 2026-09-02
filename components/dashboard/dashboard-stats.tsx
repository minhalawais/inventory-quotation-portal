"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Package, FileText, Users, TrendingUp } from "lucide-react"

import { Metric } from "@/components/shared/metric"
import { Skeleton } from "@/components/ui/skeleton"

interface Stats {
  totalProducts: number
  totalQuotations: number
  totalUsers: number
  totalRevenue: number
}

const STAT_CONFIG = [
  {
    key: "totalProducts" as keyof Stats,
    title: "Total products",
    icon: Package,
    route: "/products",
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "totalQuotations" as keyof Stats,
    title: "Quotations",
    icon: FileText,
    route: "/quotations",
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "totalUsers" as keyof Stats,
    title: "Active users",
    icon: Users,
    route: "/users",
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "totalRevenue" as keyof Stats,
    title: "Total revenue",
    icon: TrendingUp,
    route: "/quotations",
    format: (v: number) => `PKR ${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toLocaleString()}`,
  },
]

export default function DashboardStats() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalQuotations: 0,
    totalUsers: 0,
    totalRevenue: 0,
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    void fetchStats()
  }, [])

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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {STAT_CONFIG.map((stat) => (
        <button
          key={stat.key}
          type="button"
          onClick={() => router.push(stat.route)}
          className="text-left transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Metric
            label={stat.title}
            value={stat.format(stats[stat.key] as number)}
            detail="View details"
            icon={stat.icon}
          />
        </button>
      ))}
    </div>
  )
}
