import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import DashboardStats from "@/components/dashboard/dashboard-stats"
import SalesChart from "@/components/dashboard/sales-chart"
import RecentQuotations from "@/components/dashboard/recent-quotations"
import OutOfStockSummary from "@/components/dashboard/out-of-stock-summary"

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
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-1 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Operations Overview
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-950 tracking-tight">
            Welcome back, {session.user.name?.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{today}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-emerald-700">Live data</span>
        </div>
      </div>

      <DashboardStats />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SalesChart />
        <OutOfStockSummary />
      </div>

      <RecentQuotations />
    </div>
  )
}
