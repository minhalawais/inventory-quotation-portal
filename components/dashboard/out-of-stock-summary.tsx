"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PackageX, ArrowRight } from "lucide-react"

import { Panel, PanelBody, PanelHeader } from "@/components/shared/panel"
import { ProductThumb } from "@/components/shared/product-thumb"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface OutOfStockProduct {
  _id: string
  name: string
  productId: string
  imagePaths?: string[]
  imagePath?: string
}

export default function OutOfStockSummary() {
  const [outOfStockProducts, setOutOfStockProducts] = useState<OutOfStockProduct[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    void fetchOutOfStockProducts()
  }, [])

  const fetchOutOfStockProducts = async () => {
    try {
      const response = await fetch("/api/products/out-of-stock")
      if (response.ok) setOutOfStockProducts(await response.json())
    } catch (error) {
      console.error("Failed to fetch out of stock products:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Panel className="h-full">
      <PanelHeader className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Stock exceptions</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Products marked out of stock</p>
        </div>
        <PackageX className="h-4 w-4 text-destructive" aria-hidden />
      </PanelHeader>
      <PanelBody>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-md" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        ) : outOfStockProducts.length > 0 ? (
          <div className="space-y-1">
            {outOfStockProducts.slice(0, 4).map((product) => {
              const image = product.imagePaths?.[0] ?? product.imagePath
              return (
                <div key={product._id} className="flex items-center gap-3 rounded-md px-1 py-2">
                  <ProductThumb src={image} alt={product.name} className="h-10 w-10" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{product.name}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">#{product.productId}</p>
                  </div>
                  <StatusBadge tone="danger">Out of stock</StatusBadge>
                </div>
              )
            })}
            {outOfStockProducts.length > 4 && (
              <p className="pt-1 text-center text-xs text-muted-foreground">
                +{outOfStockProducts.length - 4} more
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 h-9 w-full"
              onClick={() => router.push("/out-of-stock")}
            >
              Manage stock exceptions
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <EmptyState
            icon={PackageX}
            title="All products in stock"
            description="No stock exceptions at this time."
            className="py-8"
          />
        )}
      </PanelBody>
    </Panel>
  )
}
