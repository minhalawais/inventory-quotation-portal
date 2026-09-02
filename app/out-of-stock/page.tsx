import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Stock exceptions",
}
import OutOfStockManager from "@/components/out-of-stock/out-of-stock-manager"
import { PackageX } from "lucide-react"
import { PageHeading } from "@/components/layout/page-heading"

export default async function OutOfStockPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="space-y-6">
      <PageHeading title="Stock exceptions" description="Review unavailable products and prepare restock changes." icon={PackageX} />

      <OutOfStockManager userRole={session.user.role} />
    </div>
  )
}
