import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { ArrowLeft, FolderTree } from "lucide-react"

export const metadata: Metadata = {
  title: "Classifications",
}
import Link from "next/link"

import { authOptions } from "@/lib/auth"
import { PageHeading } from "@/components/layout/page-heading"
import { Button } from "@/components/ui/button"
import ClassificationManager from "@/components/products/classification-manager"

export default async function ProductClassificationsPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== "manager" && session.user.role !== "product_manager")) {
    redirect("/auth/signin")
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Classifications"
        description="Departments, categories, and subcategories used on products."
        icon={FolderTree}
        actions={
          <Button variant="outline" asChild>
            <Link href="/products">
              <ArrowLeft className="h-4 w-4" /> Back to products
            </Link>
          </Button>
        }
      />
      <ClassificationManager />
    </div>
  )
}
