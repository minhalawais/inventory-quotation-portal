import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import ProductList from "@/components/products/product-list"
import { Button } from "@/components/ui/button"
import { Plus, Package, BarChart3, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default async function ProductsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="mobile-container space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-secondary">Products</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage your inventory and product catalog</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link href="/out-of-stock" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full mobile-button">
                <AlertTriangle className="mr-2 h-4 w-4 text-yellow-600" />
                Out of Stock
              </Button>
            </Link>
            {(session.user.role === "manager" || session.user.role === "product_manager") && (
              <Link href="/products/add" className="w-full sm:w-auto">
                <Button className="btn-primary mobile-button w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Products List */}
      <ProductList userRole={session.user.role} />
    </div>
  )
}