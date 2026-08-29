"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  CheckCircle2,
  XCircle,
  Package,
  Search,
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
    } catch {
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
          title: "Changes Saved",
          description: `Updated ${result.modifiedCount} products successfully`,
        })

        await fetchOutOfStockProducts()
      } else {
        throw new Error("Failed to update products")
      }
    } catch {
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
      description: "All status changes have been restored",
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
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-gray-200 bg-white" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="h-48 bg-gray-100" />
              <div className="p-4 space-y-3">
                <div className="h-4 rounded bg-gray-100" />
                <div className="h-3 w-2/3 rounded bg-gray-100" />
                <div className="h-10 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className="rounded-xl border border-gray-200 border-l-4 border-l-red-500 bg-white p-4"
          style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.04)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Out of Stock</p>
              <p className="mt-1 text-2xl font-bold text-gray-950">{products.length}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div
          className="rounded-xl border border-gray-200 border-l-4 border-l-amber-500 bg-white p-4"
          style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.04)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Marked to Restock</p>
              <p className="mt-1 text-2xl font-bold text-gray-950">
                {getChangedProducts().filter((p) => !p.isOutOfStock).length}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div
          className="rounded-xl border border-gray-200 border-l-4 border-l-emerald-500 bg-white p-4"
          style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.04)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Unsaved Changes</p>
              <p className="mt-1 text-2xl font-bold text-gray-950">{getChangedProducts().length}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Actions bar */}
      <div
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-gray-200 bg-white p-4"
        style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.04)" }}
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search stock exceptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 pl-9 rounded-lg text-sm border-gray-200"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={fetchOutOfStockProducts}
            variant="outline"
            size="sm"
            className="h-9 rounded-lg"
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {hasChanges() && (
            <>
              <Button
                onClick={resetChanges}
                variant="outline"
                size="sm"
                className="h-9 rounded-lg hover:bg-gray-100"
                disabled={updating}
              >
                Reset
              </Button>

              <Button
                onClick={saveChanges}
                size="sm"
                className="h-9 rounded-lg font-semibold"
                style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
                disabled={updating || userRole !== "manager"}
              >
                <Save className={`h-3.5 w-3.5 mr-1.5 ${updating ? "animate-spin" : ""}`} />
                Save Changes ({getChangedProducts().length})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Unsaved alert notification */}
      {hasChanges() && (
        <Alert className="rounded-xl border-amber-200 bg-amber-50/80 text-amber-900">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-xs font-medium">
            You have {getChangedProducts().length} unsaved stock status modifications. Click "Save Changes" to apply.
          </AlertDescription>
        </Alert>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
            <div
              key={product._id}
              className={`group overflow-hidden rounded-xl border bg-white transition-all duration-200 ${
                hasChanged ? "border-amber-300 ring-2 ring-amber-200" : "border-gray-200 hover:border-gray-300 hover:shadow-md"
              }`}
              style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}
            >
              <div className="relative h-48 overflow-hidden">
                <ImageSliderCompact
                  images={images}
                  productName={product.name}
                  className="w-full h-full"
                  showViewButton={false}
                />

                {/* Top badges */}
                <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-40 pointer-events-none">
                  <span className="rounded-full bg-black/50 px-2 py-0.5 font-mono text-[11px] font-semibold text-white pointer-events-auto backdrop-blur-sm">
                    #{product.productId}
                  </span>
                  <div className="flex items-center gap-1.5 pointer-events-auto">
                    <span className="rounded-full bg-red-500/90 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      Out of stock
                    </span>
                    {hasChanged && (
                      <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                        Modified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {/* Product info */}
                <div>
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-950 mb-2">
                    {product.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-medium text-indigo-700">
                      {product.group}
                    </span>
                    <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
                      {product.subGroup}
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <span className="text-xs font-medium text-gray-500">Price</span>
                  <span className="text-base font-bold text-gray-950">PKR {product.price.toLocaleString()}</span>
                </div>

                {/* Stock status toggle box */}
                <div className="rounded-lg border border-gray-200 p-3 space-y-2 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor={`out-of-stock-${product._id}`}
                      className="text-xs font-semibold text-gray-700 cursor-pointer"
                    >
                      Out of Stock Status
                    </Label>
                    <Checkbox
                      id={`out-of-stock-${product._id}`}
                      checked={currentStatus}
                      onCheckedChange={(checked) => updateOutOfStockStatus(product._id, checked as boolean)}
                      disabled={userRole !== "manager"}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>

                  <p className="text-[11px] text-gray-500">
                    {currentStatus
                      ? "Item is hidden from active sales list"
                      : "Item will be marked back in stock upon save"}
                  </p>

                  {hasChanged && (
                    <div className="pt-1.5 border-t border-gray-200">
                      <span className={`inline-block text-[11px] font-semibold ${
                        currentStatus ? "text-red-600" : "text-emerald-600"
                      }`}>
                        Will change to: {currentStatus ? "Out of stock" : "In stock"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {filteredProducts.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {searchTerm ? "No matching products" : "No stock exceptions"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {searchTerm
                  ? "Try adjusting your search criteria."
                  : "All products are currently marked in stock."}
              </p>
            </div>
            {searchTerm && (
              <Button onClick={() => setSearchTerm("")} variant="outline" size="sm" className="h-9 rounded-lg">
                Clear search
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
