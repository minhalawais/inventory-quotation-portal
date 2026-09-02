"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Check, X } from "lucide-react"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { logActivity } from "@/lib/logger"
import MultipleImageUpload from "@/components/ui/multiple-image-upload"
import { FormSection, FormActions } from "@/components/shared/form-section"
import { ProductEditorShell } from "@/components/products/product-editor-shell"
import { ClassificationFields, type ClassificationFormValue } from "@/components/products/classification-fields"
import { useTaxonomy } from "@/components/products/use-taxonomy"

export default function ProductForm() {
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
  const [images, setImages] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [lastProductId, setLastProductId] = useState("")
  const [isProductIdUnique, setIsProductIdUnique] = useState<boolean | null>(null)
  const [checkingId, setCheckingId] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()
  const { tree, loading: taxonomyLoading } = useTaxonomy()

  const isManager = session?.user?.role === "manager" || session?.user?.role === "product_manager"

  useEffect(() => {
    fetchLastProductId()
  }, [])

  useEffect(() => {
    if (formData.productId) {
      checkProductIdUniqueness()
    } else {
      setIsProductIdUnique(null)
    }
  }, [formData.productId])

  useEffect(() => {
    if (images[0]) {
      const url = URL.createObjectURL(images[0])
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    setPreviewUrl(null)
  }, [images])

  const fetchLastProductId = async () => {
    try {
      const response = await fetch("/api/products/last-id")
      if (response.ok) {
        const data = await response.json()
        setLastProductId(data.lastId || "No products yet")
      }
    } catch (error) {
      console.error("Failed to fetch last product ID:", error)
    }
  }

  const checkProductIdUniqueness = async () => {
    if (!formData.productId) return

    setCheckingId(true)
    try {
      const response = await fetch(`/api/products/check-id?id=${formData.productId}`)
      if (response.ok) {
        const data = await response.json()
        setIsProductIdUnique(data.isUnique)
      } else {
        setIsProductIdUnique(null)
      }
    } catch (error) {
      console.error("Failed to check product ID uniqueness:", error)
      setIsProductIdUnique(null)
    } finally {
      setCheckingId(false)
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

    if (isProductIdUnique === false) {
      toast({
        title: "Error",
        description: "Product ID must be unique",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      let imagePaths: string[] = []

      if (images.length > 0) {
        const uploadPromises = images.map(async (image) => {
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
        imagePaths = results.filter((path) => path !== null)
      }

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          price: Number.parseFloat(formData.price),
          purchaseRate: formData.purchaseRate ? Number.parseFloat(formData.purchaseRate) : undefined,
          imagePaths,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        if (session) {
          await logActivity({
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: "CREATE",
            resource: "Product",
            details: `Created new product: ${formData.name}`,
            status: "success",
          })
        }

        toast({
          title: "Success",
          description: "Product added successfully",
        })
        router.push("/products")
      } else {
        throw new Error(data.error || "Failed to add product")
      }
    } catch (error) {
      if (session) {
        await logActivity({
          userId: session.user.id,
          userName: session.user.name,
          userRole: session.user.role,
          action: "CREATE",
          resource: "Product",
          details: `Failed to create product: ${formData.name}`,
          status: "error",
        })
      }

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add product",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <ProductEditorShell
        title="Add product"
        description="Create a complete catalog record."
        summary={{
          name: formData.name,
          productId: formData.productId,
          department: formData.department,
          category: formData.category,
          subCategory: formData.subCategory,
          price: formData.price,
          purchaseRate: formData.purchaseRate,
          isOutOfStock: formData.isOutOfStock,
          imageSrc: previewUrl,
          showPurchaseRate: isManager,
        }}
        footer={
          <FormActions className="border-0 pt-0">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || isProductIdUnique === false}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create product"
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
              <div className="relative">
                <Input
                  id="productId"
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  required
                  className="h-10 pr-10 font-mono"
                  placeholder="Unique product ID"
                  aria-invalid={isProductIdUnique === false}
                />
                {checkingId ? (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                ) : isProductIdUnique === true ? (
                  <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-600" aria-label="Available" />
                ) : isProductIdUnique === false ? (
                  <X className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive" aria-label="Taken" />
                ) : null}
              </div>
              {lastProductId && (
                <p className="text-xs text-muted-foreground">
                  Last ID: <span className="font-mono font-medium text-foreground">{lastProductId}</span>
                </p>
              )}
              {isProductIdUnique === false && (
                <p className="text-xs text-destructive">This product ID is already in use.</p>
              )}
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
                placeholder="0.00"
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
          <MultipleImageUpload images={images} onImagesChange={setImages} maxImages={6} />
        </FormSection>
      </ProductEditorShell>
    </form>
  )
}
