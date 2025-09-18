"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Package } from "lucide-react"

interface LowStockProduct {
  _id: string
  name: string
  quantity: number
  productId: string
}

export default function LowStockAlert() {
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchLowStockProducts()
  }, [])

  const fetchLowStockProducts = async () => {
    try {
      const response = await fetch("/api/products?lowStock=true")
      if (response.ok) {
        const data = await response.json()
        setLowStockProducts(data)
      }
    } catch (error) {
      console.error("Failed to fetch low stock products:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCardClick = () => {
    router.push("/products")
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
      onClick={handleCardClick}
    >
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
          Low Stock Alert
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : lowStockProducts.length > 0 ? (
          <div className="space-y-3">
            {lowStockProducts.slice(0, 3).map((product) => (
              <Alert key={product._id} className="border-orange-200 bg-orange-50">
                <Package className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-600">ID: {product.productId}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-orange-600">{product.quantity} left</span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
            {lowStockProducts.length > 3 && (
              <div className="text-center text-sm text-gray-500 mt-2">
                +{lowStockProducts.length - 3} more items need attention
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Package className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p>All products are well stocked!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
