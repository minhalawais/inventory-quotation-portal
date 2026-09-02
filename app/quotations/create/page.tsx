import type { Metadata } from "next"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Create quotation",
}
import QuotationForm from "@/components/quotations/quotation-form"
import { ArrowLeft, FilePlus2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PageHeading } from "@/components/layout/page-heading"

export default async function CreateQuotationPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="space-y-6">
      <PageHeading title="Create quotation" description="Add customer details, choose a priced or unpriced customer copy, and build the item list." icon={FilePlus2} actions={
        <Button variant="outline" asChild><Link href="/quotations"><ArrowLeft className="h-4 w-4" /> Back to quotations</Link></Button>
      } />
      <QuotationForm userId={session.user.id} />
    </div>
  )
}
