"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, Package, Tag, Layers, Hash, DollarSign, ShoppingCart, AlertTriangle } from "lucide-react"
import ImageSlider from "@/components/ui/image-slider"
import { useSession } from "next-auth/react"

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

interface ProductViewModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
}

export default function ProductViewModal({ product, isOpen, onClose }: ProductViewModalProps) {
  const { data: session } = useSession()
  const isManager = session?.user?.role === "manager"

  if (!product) return null

  // Handle both new imagePaths array and old imagePath string for backward compatibility
  const images =
    product.imagePaths && product.imagePaths.length > 0
      ? product.imagePaths
      : product.imagePath
        ? [product.imagePath]
        : []

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto custom-scrollbar p-0 sm:p-6">
        {/* Mobile Header */}
        <DialogHeader className="sticky top-0 bg-white z-10 p-4 sm:p-0 border-b sm:border-b-0 rounded-t-lg">
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-bold text-secondary">Product Details</span>
                <p className="text-sm text-muted-foreground">#{product.productId}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 sm:p-0 space-y-6">
          {/* Product Images Slider */}
          <ImageSlider images={images} productName={product.name} className="w-full h-64 sm:h-80" />

          {/* Product Header */}
          <div className="text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-secondary mb-3">{product.name}</h2>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
                {product.group}
              </Badge>
              <Badge variant="outline" className="border-secondary/30 text-secondary bg-secondary/5">
                {product.subGroup}
              </Badge>
              <Badge className={`${product.isOutOfStock ? "status-cancelled" : "status-sent"} text-xs font-semibold`}>
                {product.isOutOfStock ? "Out of Stock" : "In Stock"}
              </Badge>
              {images.length > 1 && (
                <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">
                  {images.length} Images
                </Badge>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="card-modern mobile-card bg-muted/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Tag className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Product Group</p>
                    <p className="text-lg font-semibold text-secondary">{product.group}</p>
                  </div>
                </div>
              </div>

              <div className="card-modern mobile-card bg-muted/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                    <Layers className="h-6 w-6 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Sub-Group</p>
                    <p className="text-lg font-semibold text-secondary">{product.subGroup}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div
                className={`card-modern mobile-card ${product.isOutOfStock ? "bg-red/5 border-red/20" : "bg-success/5 border-success/20"}`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${product.isOutOfStock ? "bg-red/10" : "bg-success/10"}`}
                  >
                    {product.isOutOfStock ? (
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    ) : (
                      <Package className="h-6 w-6 text-success" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Stock Status</p>
                    <p className={`text-lg font-semibold ${product.isOutOfStock ? "text-red-600" : "text-success"}`}>
                      {product.isOutOfStock ? "Out of Stock" : "In Stock"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card-modern mobile-card bg-primary/5 border-primary/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Selling Price</p>
                    <p className="text-lg font-semibold text-primary">PKR {product.price.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Purchase Rate - Only visible to managers */}
              {isManager && product.purchaseRate && (
                <div className="card-modern mobile-card bg-orange/5 border-orange/20">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange/10 rounded-xl flex items-center justify-center">
                      <ShoppingCart className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        Purchase Rate
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                          Manager Only
                        </span>
                      </p>
                      <p className="text-lg font-semibold text-orange-600">
                        PKR {product.purchaseRate.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Profit Analysis - Only visible to managers */}
          {isManager && product.purchaseRate && (
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-200">
              <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-orange-600" />
                </div>
                Profit Analysis
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">Manager Only</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white/50 rounded-lg border border-orange-100">
                  <p className="text-sm text-muted-foreground mb-1">Profit per Unit</p>
                  <p className="text-xl font-bold text-green-600">
                    PKR {(product.price - product.purchaseRate).toLocaleString()}
                  </p>
                </div>

                <div className="text-center p-4 bg-white/50 rounded-lg border border-orange-100">
                  <p className="text-sm text-muted-foreground mb-1">Profit Margin</p>
                  <p className="text-xl font-bold text-blue-600">
                    {(((product.price - product.purchaseRate) / product.price) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Product Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-xl border">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Hash className="h-5 w-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">Product ID</p>
              <p className="font-mono font-semibold text-secondary text-sm">{product.productId}</p>
            </div>

            <div className="text-center p-4 bg-muted/30 rounded-xl border">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 ${product.isOutOfStock ? "bg-red/10" : "bg-success/10"}`}
              >
                {product.isOutOfStock ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                ) : (
                  <Package className="h-5 w-5 text-success" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">Stock Status</p>
              <p className={`font-semibold text-sm ${product.isOutOfStock ? "text-red-600" : "text-success"}`}>
                {product.isOutOfStock ? "Out of Stock" : "Available"}
              </p>
            </div>

            <div className="text-center p-4 bg-muted/30 rounded-xl border">
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Tag className="h-5 w-5 text-secondary" />
              </div>
              <p className="text-xs text-muted-foreground">Category</p>
              <p className="font-semibold text-secondary text-sm">{product.group}</p>
            </div>

            <div className="text-center p-4 bg-muted/30 rounded-xl border">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="font-semibold text-primary text-sm">PKR {product.price}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
