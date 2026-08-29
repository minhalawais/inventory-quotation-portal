"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Package, XCircle, ArrowRight } from "lucide-react"

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

  useEffect(() => { fetchOutOfStockProducts() }, [])

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
    <div className="rounded-xl border border-gray-200 bg-white" style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Stock Exceptions</h3>
          <p className="text-xs text-gray-500 mt-0.5">Products marked out of stock</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
          <XCircle className="h-4 w-4 text-red-500" />
        </div>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex animate-pulse items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-32 rounded bg-gray-100" />
                  <div className="h-2.5 w-20 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : outOfStockProducts.length > 0 ? (
          <div className="space-y-1">
            {outOfStockProducts.slice(0, 4).map((product) => {
              const image = product.imagePaths?.[0] ?? product.imagePath
              return (
                <div
                  key={product._id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50"
                >
                  {/* Thumbnail or icon */}
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                    {image ? (
                      <img src={image} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-[11px] font-medium text-gray-400">#{product.productId}</p>
                  </div>

                  <span className="shrink-0 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                    Out of stock
                  </span>
                </div>
              )
            })}

            {outOfStockProducts.length > 4 && (
              <p className="mt-2 text-center text-xs text-gray-400">
                +{outOfStockProducts.length - 4} more items
              </p>
            )}

            <button
              onClick={() => router.push("/out-of-stock")}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
            >
              Manage stock exceptions
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <Package className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-gray-700">All products in stock</p>
            <p className="text-xs text-gray-400">No stock exceptions at this time</p>
          </div>
        )}
      </div>
    </div>
  )
}
