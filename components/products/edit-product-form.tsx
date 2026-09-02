"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { logActivity } from "@/lib/logger"
import MultipleImageUpload from "@/components/ui/multiple-image-upload"
import { FormSection, FormActions } from "@/components/shared/form-section"
import { Panel, PanelBody } from "@/components/shared/panel"
import { ProductEditorShell } from "@/components/products/product-editor-shell"
import { ClassificationFields, type ClassificationFormValue } from "@/components/products/classification-fields"
import { useTaxonomy } from "@/components/products/use-taxonomy"
import { classifyProduct } from "@/lib/product-classification"

interface Product {
  _id: string
  department?: string
  category?: string
  subCategory?: string
  departmentId?: string
  categoryId?: string
  subCategoryId?: string
  group?: string
  subGroup?: string
  productId: string
  name: string
  price: number
  purchaseRate?: number
  imagePaths?: string[]
  imagePath?: string
  isOutOfStock?: boolean
}

interface EditProductFormProps {
  productId: string
}

export default function EditProductForm({ productId }: EditProductFormProps) {
  const [formData, setFormData] = useState({
    department: "",
    category: "",
    subCategory: "",
    departmentId: "",
    categoryId: "",
    subCategoryId: "",
    productId: "",
    name: "",
    price: "",
    purchaseRate: "",
    isOutOfStock: false,
  })
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [newPreviewUrl, setNewPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()
  const { tree, loading: taxonomyLoading } = useTaxonomy()

  const isManager = session?.user?.role === "manager" || session?.user?.role === "product_manager"

  useEffect(() => {
    fetchProduct()
  }, [productId])

  useEffect(() => {
    if (newImages[0]) {
      const url = URL.createObjectURL(newImages[0])
      setNewPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    setNewPreviewUrl(null)
  }, [newImages])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`)
      if (response.ok) {
        const product: Product = await response.json()
        const classification = classifyProduct(product)

        setFormData({
          department: classification.department,
          category: classification.category,
          subCategory: classification.subCategory,
          departmentId: classification.departmentId || "",
          categoryId: classification.categoryId || "",
          subCategoryId: classification.subCategoryId || "",
          productId: product.productId,
          name: product.name,
          price: product.price.toString(),
          purchaseRate: product.purchaseRate ? product.purchaseRate.toString() : "",
          isOutOfStock: product.isOutOfStock || false,
        })

        const images =
          product.imagePaths && product.imagePaths.length > 0
            ? product.imagePaths
            : product.imagePath
              ? [product.imagePath]
              : []

        setExistingImages(images)
      } else {
        toast({
          title: "Error",
          description: "Product not found",
          variant: "destructive",
        })
        router.push("/products")
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch product",
        variant: "destructive",
      })
    } finally {
      setFetchLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.department || !formData.category) {
      toast({
        title: "Classification required",
        description: "Select a department and category.",
        variant: "destructive",
      })
      return
    }

    const selectedDepartment =
      tree.departments.find((item) => item._id === formData.departmentId) ||
      tree.departments.find((item) => item.name === formData.department)
    const selectedCategory =
      selectedDepartment?.categories.find((item) => item._id === formData.categoryId) ||
      selectedDepartment?.categories.find((item) => item.name === formData.category)
    if (selectedCategory && selectedCategory.subcategories.length > 0 && !formData.subCategory) {
      toast({
        title: "Subcategory required",
        description: "Select a subcategory for this category.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      let newImagePaths: string[] = []

      if (newImages.length > 0) {
        const uploadPromises = newImages.map(async (image) => {
          const imageFormData = new FormData()
          imageFormData.append("file", image)

          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            body: imageFormData,
          })

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json()
            return uploadData.path
          }
          return null
        })

        const results = await Promise.all(uploadPromises)
        newImagePaths = results.filter((path) => path !== null)
      }

      const allImagePaths = [...existingImages, ...newImagePaths]

      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          price: Number.parseFloat(formData.price),
          purchaseRate: formData.purchaseRate ? Number.parseFloat(formData.purchaseRate) : undefined,
          imagePaths: allImagePaths,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        if (session) {
          await logActivity({
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: "UPDATE",
            resource: "Product",
            resourceId: productId,
            details: `Updated product: ${formData.name}`,
            status: "success",
          })
        }

        toast({
          title: "Success",
          description: "Product updated successfully",
        })
        router.push("/products")
      } else {
        throw new Error(data.error || "Failed to update product")
      }
    } catch (error) {
      if (session) {
        await logActivity({
          userId: session.user.id,
          userName: session.user.name,
          userRole: session.user.role,
          action: "UPDATE",
          resource: "Product",
          resourceId: productId,
          details: `Failed to update product: ${formData.name}`,
          status: "error",
        })
      }

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update product",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="mx-auto max-w-[1120px] space-y-4">
        <Skeleton className="h-14 w-72" />
        <Panel>
          <PanelBody className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </PanelBody>
        </Panel>
      </div>
    )
  }

  const summaryImage = existingImages[0] || newPreviewUrl

  return (
    <form onSubmit={handleSubmit}>
      <ProductEditorShell
        title="Edit product"
        description="Update catalog, pricing, and availability details."
        summary={{
          name: formData.name,
          productId: formData.productId,
          department: formData.department,
          category: formData.category,
          subCategory: formData.subCategory,
          price: formData.price,
          purchaseRate: formData.purchaseRate,
          isOutOfStock: formData.isOutOfStock,
          imageSrc: summaryImage,
          showPurchaseRate: isManager,
        }}
        footer={
          <FormActions className="border-0 pt-0">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </FormActions>
        }
      >
        <FormSection title="Classification" description="Department, category, and subcategory.">
          <ClassificationFields
            value={formData}
            onChange={(next: ClassificationFormValue) => setFormData((prev) => ({ ...prev, ...next }))}
            tree={tree}
            loading={taxonomyLoading}
          />
        </FormSection>

        <FormSection title="Product identity" className="pt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="productId">Product ID</Label>
              <Input
                id="productId"
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                required
                className="h-10 font-mono"
                placeholder="Unique product ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Product name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="h-10"
                placeholder="Descriptive product name"
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Availability" className="pt-6">
          <div className="flex items-start gap-3 rounded-lg border border-border p-3">
            <Checkbox
              id="isOutOfStock"
              checked={formData.isOutOfStock}
              onCheckedChange={(checked) => setFormData({ ...formData, isOutOfStock: checked as boolean })}
              disabled={!isManager}
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <Label htmlFor="isOutOfStock" className="cursor-pointer text-sm font-medium">
                Mark as out of stock
              </Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Check if this product is currently unavailable for sale.
              </p>
              {!isManager && (
                <p className="mt-1 text-xs text-amber-800">Only managers can change availability.</p>
              )}
            </div>
          </div>
        </FormSection>

        <FormSection title="Pricing" className="pt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Sale price (PKR)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                className="h-10"
              />
            </div>
            {isManager && (
              <div className="space-y-2">
                <Label htmlFor="purchaseRate">Purchase rate (PKR)</Label>
                <Input
                  id="purchaseRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.purchaseRate}
                  onChange={(e) => setFormData({ ...formData, purchaseRate: e.target.value })}
                  className="h-10"
                  placeholder="Optional cost price"
                />
              </div>
            )}
          </div>
        </FormSection>

        <FormSection title="Images" description="Up to 6 images. First image is primary." className="pt-6">
          <MultipleImageUpload
            images={newImages}
            onImagesChange={setNewImages}
            existingImages={existingImages}
            onExistingImagesChange={setExistingImages}
            maxImages={6}
          />
        </FormSection>
      </ProductEditorShell>
    </form>
  )
}
