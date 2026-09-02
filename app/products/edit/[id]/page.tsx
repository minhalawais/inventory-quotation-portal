import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Edit product",
}
import EditProductForm from "@/components/products/edit-product-form"

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
    <div className="space-y-6">
      <EditProductForm productId={id} />
    </div>
  )
}
