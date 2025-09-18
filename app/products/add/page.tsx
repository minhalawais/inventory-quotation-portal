import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import ProductForm from "@/components/products/product-form"
import { ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AddProductPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== "manager" && session.user.role !== "product_manager")) {
    redirect("/auth/signin")
  }

  return (
    <div className="mobile-container space-y-6">

      {/* Form */}
      <ProductForm />
    </div>
  )
}
