import type { Metadata } from "next"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Quotations",
}
import QuotationList from "@/components/quotations/quotation-list"

export default async function QuotationsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return <QuotationList userRole={session.user.role} />
}
