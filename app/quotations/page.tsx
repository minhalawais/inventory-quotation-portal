import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import QuotationList from "@/components/quotations/quotation-list"
import { Button } from "@/components/ui/button"
import { Plus, FileText } from "lucide-react"
import Link from "next/link"

export default async function QuotationsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="mobile-container space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-secondary">Quotations</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage and track your quotations</p>
          </div>
        </div>

        <Link href="/quotations/create">
          <Button className="btn-primary mobile-button w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Quotation
          </Button>
        </Link>
      </div>

      {/* Quotations List */}
      <QuotationList userRole={session.user.role} />
    </div>
  )
}
