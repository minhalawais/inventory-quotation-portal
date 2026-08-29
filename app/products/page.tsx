import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import ProductList from "@/components/products/product-list"
import { Button } from "@/components/ui/button"
import { Plus, Package, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { PageHeading } from "@/components/layout/page-heading"

export default async function ProductsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Product catalog"
        description="Search, review, and maintain inventory records."
        icon={Package}
        actions={<>
            <Link href="/out-of-stock" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">
                <AlertTriangle className="h-4 w-4 text-amber-600" /> Stock exceptions
              </Button>
            </Link>
            {(session.user.role === "manager" || session.user.role === "product_manager") && (
              <Link href="/products/add" className="w-full sm:w-auto">
                <Button className="w-full">
                  <Plus className="h-4 w-4" /> Add product
                </Button>
              </Link>
            )}
        </>}
      />

      <ProductList userRole={session.user.role} />
    </div>
  )
}
