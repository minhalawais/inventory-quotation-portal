import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import DashboardStats from "@/components/dashboard/dashboard-stats"
import SalesChart from "@/components/dashboard/sales-chart"
import RecentQuotations from "@/components/dashboard/recent-quotations"
import OutOfStockSummary from "@/components/dashboard/out-of-stock-summary" // New import

export default async function Dashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "manager") {
    redirect("/auth/signin")
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Welcome Section - Mobile Optimized */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-4 lg:p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold mb-1 text-white">Welcome back, {session.user.name}!</h1>
            <p className="text-blue-100 text-sm lg:text-base">Here's what's happening with your business today.</p>
          </div>
          <div className="hidden sm:block">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="text-2xl lg:text-3xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      <DashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <SalesChart />
        <OutOfStockSummary /> {/* Replaced LowStockAlert with OutOfStockSummary */}
      </div>

      <RecentQuotations />
    </div>
  )
}
