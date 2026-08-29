import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import QuotationList from "@/components/quotations/quotation-list"
import { Button } from "@/components/ui/button"
import { Plus, FileText } from "lucide-react"
import Link from "next/link"
import { PageHeading } from "@/components/layout/page-heading"

export default async function QuotationsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="space-y-6">
      <PageHeading title="Quotations" description="Prepare, send, and track customer quotations." icon={FileText} actions={
        <Button asChild><Link href="/quotations/create"><Plus className="h-4 w-4" /> Create quotation</Link></Button>
      } />

      <QuotationList userRole={session.user.role} />
    </div>
  )
}
