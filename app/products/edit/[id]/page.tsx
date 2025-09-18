import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import EditProductForm from "@/components/products/edit-product-form"
import { ArrowLeft, Edit } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const session = await getServerSession(authOptions)
  
  if (
    !session ||
    (session.user.role !== "manager" && session.user.role !== "product_manager")
  ) {
    redirect("/auth/signin")
  }
  

  const { id } = await params

  return (
    <div className="mobile-container space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/products">
            <Button variant="outline" size="sm" className="mobile-button">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Edit className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-secondary">Edit Product</h1>
            <p className="text-sm text-muted-foreground mt-1">Update product information and details</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <EditProductForm productId={id} />
    </div>
  )
}
