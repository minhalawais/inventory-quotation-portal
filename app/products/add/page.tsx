import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import ProductForm from "@/components/products/product-form"

export default async function AddProductPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== "manager" && session.user.role !== "product_manager")) {
    redirect("/auth/signin")
  }

  return (
    <div className="space-y-6">
      <ProductForm />
    </div>
  )
}
