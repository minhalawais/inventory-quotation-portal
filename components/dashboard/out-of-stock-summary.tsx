"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Package, XCircle, ArrowRight } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface OutOfStockProduct {
  _id: string
  name: string
  productId: string
  imagePaths?: string[]
  imagePath?: string // Keep for backward compatibility
}

export default function OutOfStockSummary() {
  const [outOfStockProducts, setOutOfStockProducts] = useState<OutOfStockProduct[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchOutOfStockProducts()
  }, [])

  const fetchOutOfStockProducts = async () => {
    try {
      const response = await fetch("/api/products/out-of-stock")
      if (response.ok) {
        const data = await response.json()
        setOutOfStockProducts(data)
      }
    } catch (error) {
      console.error("Failed to fetch out of stock products:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewAllClick = () => {
    router.push("/out-of-stock")
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
      onClick={handleViewAllClick}
    >
      <CardHeader>
        <CardTitle className="flex items-center">
          <XCircle className="mr-2 h-5 w-5 text-red-500" />
          Out of Stock Products
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
        ) : outOfStockProducts.length > 0 ? (
          <div className="space-y-3">
            {outOfStockProducts.slice(0, 3).map((product) => (
              <Alert key={product._id} className="border-red-200 bg-red-50">
                <Package className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-600">ID: {product.productId}</p>
                    </div>
                    {product.imagePaths && product.imagePaths.length > 0 && (
                      <img
                        src={product.imagePaths[0] || "/placeholder.svg"}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded-md ml-2"
                      />
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ))}
            {outOfStockProducts.length > 3 && (
              <div className="text-center text-sm text-gray-500 mt-2">
                +{outOfStockProducts.length - 3} more items are out of stock
              </div>
            )}
            <Button variant="outline" className="w-full mt-4" onClick={handleViewAllClick}>
              View All Out of Stock <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Package className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p>Great! No products are currently out of stock.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
