import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { LayoutDashboard } from "lucide-react"

import { authOptions } from "@/lib/auth"
import DashboardStats from "@/components/dashboard/dashboard-stats"
import SalesChart from "@/components/dashboard/sales-chart"
import RecentQuotations from "@/components/dashboard/recent-quotations"
import OutOfStockSummary from "@/components/dashboard/out-of-stock-summary"
import { PageHeading } from "@/components/layout/page-heading"

export const metadata: Metadata = {
  title: "Dashboard",
}

export default async function Dashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "manager") {
    redirect("/auth/signin")
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="space-y-5">
      <PageHeading
        title={`Welcome back, ${session.user.name?.split(" ")[0] || "Manager"}`}
        description={today}
        icon={LayoutDashboard}
        actions={
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-[hsl(var(--kk-teal))]" aria-hidden />
            <span className="text-xs font-medium text-muted-foreground">Live data</span>
          </div>
        }
      />

      <DashboardStats />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <SalesChart />
        </div>
        <div className="lg:col-span-4">
          <OutOfStockSummary />
        </div>
      </div>

      <RecentQuotations />
    </div>
  )
}
