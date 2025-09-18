"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { logActivity } from "@/lib/logger"
import {
  AlertTriangle,
  RefreshCw,
  Save,
  DollarSign,
  Hash,
  Calendar,
  CheckCircle2,
  XCircle,
  Package,
} from "lucide-react"
import ImageSliderCompact from "@/components/ui/image-slider-compact"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  createdAt: string
  updatedAt: string
  isOutOfStock: boolean
}

interface ProductUpdate {
  id: string
  isOutOfStock: boolean
  originalStatus: boolean
}

interface OutOfStockManagerProps {
  userRole: string
}

export default function OutOfStockManager({ userRole }: OutOfStockManagerProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [updates, setUpdates] = useState<Map<string, ProductUpdate>>(new Map())
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  const { data: session } = useSession()

  const fetchOutOfStockProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/products/out-of-stock")
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
        // Initialize updates map
        const initialUpdates = new Map<string, ProductUpdate>()
        data.forEach((product: Product) => {
          initialUpdates.set(product._id, {
            id: product._id,
            isOutOfStock: product.isOutOfStock || false,
            originalStatus: product.isOutOfStock || false,
          })
        })
        setUpdates(initialUpdates)
      } else {
        throw new Error("Failed to fetch products")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch out of stock products",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOutOfStockProducts()
  }, [])

  const updateOutOfStockStatus = (productId: string, isOutOfStock: boolean) => {
    const currentUpdates = new Map(updates)
    const existingUpdate = currentUpdates.get(productId)

    if (existingUpdate) {
      currentUpdates.set(productId, {
        ...existingUpdate,
        isOutOfStock: isOutOfStock,
      })
    }

    setUpdates(currentUpdates)
  }

  const hasChanges = () => {
    return Array.from(updates.values()).some((update) => update.isOutOfStock !== update.originalStatus)
  }

  const getChangedProducts = () => {
    return Array.from(updates.values()).filter((update) => update.isOutOfStock !== update.originalStatus)
  }

  const saveChanges = async () => {
    if (!hasChanges()) {
      toast({
        title: "No Changes",
        description: "No status changes to save",
        variant: "default",
      })
      return
    }

    try {
      setUpdating(true)
      const changedProducts = getChangedProducts()

      const response = await fetch("/api/products/bulk-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          updates: changedProducts.map((update) => ({
            id: update.id,
            isOutOfStock: update.isOutOfStock,
          })),
        }),
      })

      if (response.ok) {
        const result = await response.json()

        // Log activity
        if (session) {
          await logActivity({
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: "BULK_UPDATE",
            resource: "Product",
            resourceId: "multiple",
            details: `Updated out of stock status for ${result.modifiedCount} products`,
            status: "success",
          })
        }

        toast({
          title: "Success",
          description: `Updated ${result.modifiedCount} products successfully`,
        })

        // Refresh the data
        await fetchOutOfStockProducts()
      } else {
        throw new Error("Failed to update products")
      }
    } catch (error) {
      if (session) {
        await logActivity({
          userId: session.user.id,
          userName: session.user.name,
          userRole: session.user.role,
          action: "BULK_UPDATE",
          resource: "Product",
          resourceId: "multiple",
          details: "Failed to update product out of stock status",
          status: "error",
        })
      }

      toast({
        title: "Error",
        description: "Failed to update products",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const resetChanges = () => {
    const resetUpdates = new Map<string, ProductUpdate>()
    products.forEach((product) => {
      resetUpdates.set(product._id, {
        id: product._id,
        isOutOfStock: product.isOutOfStock || false,
        originalStatus: product.isOutOfStock || false,
      })
    })
    setUpdates(resetUpdates)

    toast({
      title: "Changes Reset",
      description: "All status changes have been reset",
    })
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.group.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.subGroup.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="card-modern animate-pulse overflow-hidden">
              <div className="h-48 bg-gray-200"></div>
              <CardContent className="mobile-card">
                <div className="h-4 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats and Actions Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-modern">
          <CardContent className="mobile-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{products.length}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="mobile-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">To Restock</p>
                <p className="text-2xl font-bold text-orange-600">
                  {getChangedProducts().filter((p) => !p.isOutOfStock).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardContent className="mobile-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Changes</p>
                <p className="text-2xl font-bold text-green-600">{getChangedProducts().length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <Label htmlFor="search" className="sr-only">
            Search products
          </Label>
          <Input
            id="search"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={fetchOutOfStockProducts}
            variant="outline"
            className="flex-1 sm:flex-none mobile-button bg-transparent"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {hasChanges() && (
            <>
              <Button
                onClick={resetChanges}
                variant="outline"
                className="flex-1 sm:flex-none mobile-button bg-transparent"
                disabled={updating}
              >
                Reset
              </Button>

              <Button
                onClick={saveChanges}
                className="flex-1 sm:flex-none btn-primary mobile-button"
                disabled={updating || !userRole || userRole !== "manager"}
              >
                <Save className={`h-4 w-4 mr-2 ${updating ? "animate-spin" : ""}`} />
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Alert for pending changes */}
      {hasChanges() && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {getChangedProducts().length} unsaved changes. Don't forget to save your updates!
          </AlertDescription>
        </Alert>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => {
          const images =
            product.imagePaths && product.imagePaths.length > 0
              ? product.imagePaths
              : product.imagePath
                ? [product.imagePath]
                : []

          const currentUpdate = updates.get(product._id)
          const currentStatus = currentUpdate?.isOutOfStock || false
          const hasChanged = currentUpdate && currentUpdate.isOutOfStock !== currentUpdate.originalStatus

          return (
            <Card
              key={product._id}
              className={`card-modern group hover:shadow-lg transition-all duration-300 overflow-hidden ${
                hasChanged ? "ring-2 ring-orange-200 bg-orange-50/30" : ""
              }`}
            >
              <div className="relative h-48 overflow-hidden">
                <ImageSliderCompact
                  images={images}
                  productName={product.name}
                  className="w-full h-full"
                  showViewButton={false}
                />

                {/* Status badges */}
                <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-40 pointer-events-none">
                  <Badge
                    variant="secondary"
                    className="bg-white/90 text-secondary font-mono text-xs font-semibold pointer-events-auto"
                  >
                    #{product.productId}
                  </Badge>
                  <div className="flex gap-2">
                    <Badge className="status-cancelled text-xs font-semibold pointer-events-auto">Out of Stock</Badge>
                    {hasChanged && (
                      <Badge className="bg-orange-500 text-white text-xs font-semibold pointer-events-auto">
                        Modified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <CardContent className="mobile-card mt-4">
                <div className="space-y-4">
                  {/* Product Info */}
                  <div>
                    <h3 className="font-semibold text-secondary line-clamp-2 text-base leading-tight mb-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-xs">
                        {product.group}
                      </Badge>
                      <Badge variant="outline" className="border-secondary/30 text-secondary bg-secondary/5 text-xs">
                        {product.subGroup}
                      </Badge>
                    </div>
                  </div>

                  {/* Price Info */}
                  <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-3 border border-primary/10">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-muted-foreground">Price</span>
                      </div>
                      <span className="text-lg font-bold text-primary">PKR {product.price.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Added: {new Date(product.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        <span>ID: {product.productId}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stock Status Controls */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Stock Status</Label>
                    <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg border">
                      <Checkbox
                        id={`out-of-stock-${product._id}`}
                        checked={currentStatus}
                        onCheckedChange={(checked) => updateOutOfStockStatus(product._id, checked as boolean)}
                        disabled={userRole !== "manager"}
                      />
                      <Label
                        htmlFor={`out-of-stock-${product._id}`}
                        className="text-sm font-medium cursor-pointer flex-1"
                      >
                        Mark as Out of Stock
                      </Label>
                    </div>

                    {hasChanged && (
                      <div className="text-center">
                        <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-50">
                          Status will change to: {currentStatus ? "Out of Stock" : "In Stock"}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {filteredProducts.length === 0 && !loading && (
          <div className="col-span-full">
            <Card className="card-modern text-center py-12 border-2 border-dashed border-gray-300">
              <CardContent className="mobile-card">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-secondary mb-3">
                  {searchTerm ? "No matching products found" : "Great! No products are out of stock"}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {searchTerm
                    ? "Try adjusting your search terms to find the products you're looking for."
                    : "All your products are currently in stock. Keep up the good work!"}
                </p>
                {searchTerm && (
                  <Button onClick={() => setSearchTerm("")} variant="outline" className="mobile-button">
                    Clear Search
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
