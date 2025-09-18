"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ArrowLeft, Tag, Hash, DollarSign, ImageIcon, Edit, ShoppingCart, AlertTriangle } from "lucide-react"
import { useSession } from "next-auth/react"
import { logActivity } from "@/lib/logger"
import MultipleImageUpload from "@/components/ui/multiple-image-upload"

interface Product {
  _id: string
  group: string
  subGroup: string
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
    group: "",
    subGroup: "",
    productId: "",
    name: "",
    price: "",
    purchaseRate: "",
    isOutOfStock: false,
  })
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()

  // Check if user is manager to show purchase rate field
  const isManager = session?.user?.role === "manager" || session?.user?.role === "product_manager"

  useEffect(() => {
    fetchProduct()
  }, [productId])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`)
      if (response.ok) {
        const product: Product = await response.json()
        setFormData({
          group: product.group,
          subGroup: product.subGroup,
          productId: product.productId,
          name: product.name,
          price: product.price.toString(),
          purchaseRate: product.purchaseRate ? product.purchaseRate.toString() : "",
          isOutOfStock: product.isOutOfStock || false,
        })

        // Handle both new imagePaths array and old imagePath string for backward compatibility
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
    } catch (error) {
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
    setLoading(true)

    try {
      let newImagePaths: string[] = []

      // Upload new images
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

      // Combine existing images with new uploaded images
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

      if (response.ok) {
        // Log activity
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
        throw new Error("Failed to update product")
      }
    } catch (error) {
      // Log error activity
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
        description: "Failed to update product",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="mobile-container">
        <Card className="card-modern">
          <CardContent className="mobile-card">
            <div className="animate-pulse space-y-6">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mobile-container space-y-6">
      <Card className="card-modern">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-secondary">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="mobile-button hover:bg-muted">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Edit className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="text-xl font-bold">Edit Product</span>
              <p className="text-sm text-muted-foreground font-normal">Update product information and details</p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="mobile-spacing">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Categories */}
            <div className="bg-muted/30 rounded-xl p-6 border">
              <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Tag className="h-4 w-4 text-secondary" />
                </div>
                Product Categories
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="group" className="text-sm font-medium text-secondary">
                    Product Group
                  </Label>
                  <Select value={formData.group} onValueChange={(value) => setFormData({ ...formData, group: value })}>
                    <SelectTrigger className="input-modern mobile-input">
                      <SelectValue placeholder="Select product group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hosiery">Hosiery</SelectItem>
                      <SelectItem value="garments">Garments</SelectItem>
                      <SelectItem value="accessories">Accessories</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subGroup" className="text-sm font-medium text-secondary">
                    Sub-Group
                  </Label>
                  <Input
                    id="subGroup"
                    value={formData.subGroup}
                    onChange={(e) => setFormData({ ...formData, subGroup: e.target.value })}
                    required
                    className="input-modern mobile-input"
                    placeholder="Enter sub-group"
                  />
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="bg-primary/5 rounded-xl p-6 border border-primary/20">
              <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Hash className="h-4 w-4 text-primary" />
                </div>
                Product Details
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="productId" className="text-sm font-medium text-secondary">
                      Product ID
                    </Label>
                    <Input
                      id="productId"
                      value={formData.productId}
                      onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                      required
                      className="input-modern mobile-input font-mono"
                      placeholder="Enter unique product ID"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-secondary">
                      Product Name
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="input-modern mobile-input"
                      placeholder="Enter descriptive product name"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stock Status */}
            <div className="bg-orange/5 rounded-xl p-6 border border-orange/20">
              <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-orange/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                </div>
                Stock Status
              </h3>

              <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border">
                <Checkbox
                  id="isOutOfStock"
                  checked={formData.isOutOfStock}
                  onCheckedChange={(checked) => setFormData({ ...formData, isOutOfStock: checked as boolean })}
                  disabled={!isManager}
                />
                <div className="flex-1">
                  <Label htmlFor="isOutOfStock" className="text-sm font-medium cursor-pointer">
                    Mark as Out of Stock
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Check this box if the product is currently out of stock
                  </p>
                </div>
                {!isManager && (
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">Manager Only</span>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-success/5 rounded-xl p-6 border border-success/20">
              <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-success" />
                </div>
                Pricing Information
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-medium text-secondary">
                    Selling Price (PKR)
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className="input-modern mobile-input"
                    placeholder="Enter selling price per unit"
                  />
                </div>

                {/* Purchase Rate - Only visible to managers */}
                {isManager && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="purchaseRate"
                      className="text-sm font-medium text-secondary flex items-center gap-2"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Purchase Rate (PKR)
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">Manager Only</span>
                    </Label>
                    <Input
                      id="purchaseRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.purchaseRate}
                      onChange={(e) => setFormData({ ...formData, purchaseRate: e.target.value })}
                      className="input-modern mobile-input"
                      placeholder="Enter purchase rate per unit"
                    />
                    <p className="text-xs text-muted-foreground">
                      Cost price at which this product was purchased (optional)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Product Images */}
            <div className="bg-muted/30 rounded-xl p-6 border">
              <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-4 w-4 text-gray-600" />
                </div>
                Product Images
              </h3>

              <MultipleImageUpload
                images={newImages}
                onImagesChange={setNewImages}
                existingImages={existingImages}
                onExistingImagesChange={setExistingImages}
                maxImages={6}
              />
            </div>

            {/* Summary Card */}
            {formData.name && formData.price && (
              <div className="gradient-primary rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-4">Updated Product Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-primary-foreground/80">Product Name</p>
                    <p className="font-semibold">{formData.name}</p>
                  </div>
                  <div>
                    <p className="text-primary-foreground/80">Stock Status</p>
                    <p className="font-semibold">{formData.isOutOfStock ? "Out of Stock" : "In Stock"}</p>
                  </div>
                  <div>
                    <p className="text-primary-foreground/80">Selling Price</p>
                    <p className="font-semibold">PKR {Number.parseFloat(formData.price || "0").toLocaleString()}</p>
                  </div>
                </div>

                {/* Show profit margin if both prices are available and user is manager */}
                {isManager && formData.purchaseRate && formData.price && (
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-primary-foreground/80">Purchase Rate</p>
                        <p className="font-semibold">PKR {Number.parseFloat(formData.purchaseRate).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-primary-foreground/80">Profit Margin</p>
                        <p className="font-semibold">
                          {(
                            ((Number.parseFloat(formData.price) - Number.parseFloat(formData.purchaseRate)) /
                              Number.parseFloat(formData.price)) *
                            100
                          ).toFixed(1)}
                          %
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button type="submit" className="btn-primary mobile-button flex-1 sm:flex-none" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Product...
                  </>
                ) : (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    Update Product
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="mobile-button flex-1 sm:flex-none"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
