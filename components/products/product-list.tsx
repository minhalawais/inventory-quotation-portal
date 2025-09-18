"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Eye, Package, DollarSign, Hash } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { logActivity } from "@/lib/logger"
import ProductViewModal from "./product-view-modal"
import ProductFilters from "./product-filters"
import ImageSliderCompact from "@/components/ui/image-slider-compact"

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

interface SubGroup {
  group: string
  name: string
}

interface ProductListProps {
  userRole: string
}

export default function ProductList({ userRole }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [filters, setFilters] = useState({
    searchTerm: "",
    selectedGroup: "all",
    selectedSubGroup: "all",
  })
  const [groups, setGroups] = useState<string[]>([])
  const [subGroups, setSubGroups] = useState<SubGroup[]>([])
  const { toast } = useToast()
  const { data: session } = useSession()
  const router = useRouter()
  const allowedRoles = ["manager", "product_manager"]

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/products")
      if (response.ok) {
        const data = await response.json()
        setProducts(data)

        // Extract unique groups
        const uniqueGroups = [...new Set(data.map((product: Product) => product.group))]
        setGroups(uniqueGroups.sort())

        // Extract sub-groups with their groups
        const subGroupsData = data.map((product: Product) => ({
          group: product.group,
          name: product.subGroup,
        }))
        setSubGroups(subGroupsData)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = useCallback(() => {
    let results = [...products]

    // Apply group filter if selected and not "all"
    if (filters.selectedGroup && filters.selectedGroup !== "all") {
      results = results.filter((product) => product.group === filters.selectedGroup)
    }

    // Apply sub-group filter if selected and not "all"
    if (filters.selectedSubGroup && filters.selectedSubGroup !== "all") {
      results = results.filter((product) => product.subGroup === filters.selectedSubGroup)
    }

    // Apply search term to the filtered results
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase()
      results = results.filter(
        (product) =>
          product.name.toLowerCase().includes(term) ||
          (product.productId && product.productId.toLowerCase().includes(term)),
      )
    }

    setFilteredProducts(results)
  }, [filters, products])

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    if (products.length > 0) {
      applyFilters()
    }
  }, [filters, products, applyFilters])

  const handleFilterChange = useCallback(
    (newFilters: {
      searchTerm: string
      selectedGroup: string
      selectedSubGroup: string
    }) => {
      setFilters(newFilters)
    },
    [],
  )

  const handleView = async (product: Product) => {
    setSelectedProduct(product)
    setViewModalOpen(true)

    if (session) {
      await logActivity({
        userId: session.user.id,
        userName: session.user.name,
        userRole: session.user.role,
        action: "VIEW",
        resource: "Product",
        resourceId: product._id,
        details: `Viewed product: ${product.name}`,
        status: "success",
      })
    }
  }

  const handleEdit = (productId: string) => {
    router.push(`/products/edit/${productId}`)
  }

  const deleteProduct = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return

    try {
      const response = await fetch(`/api/products/${product._id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Update both products and filteredProducts state
        setProducts(products.filter((p) => p._id !== product._id))
        setFilteredProducts(filteredProducts.filter((p) => p._id !== product._id))

        if (session) {
          await logActivity({
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: "DELETE",
            resource: "Product",
            resourceId: product._id,
            details: `Deleted product: ${product.name}`,
            status: "success",
          })
        }

        toast({
          title: "Success",
          description: "Product deleted successfully",
        })
      }
    } catch (error) {
      if (session) {
        await logActivity({
          userId: session.user.id,
          userName: session.user.name,
          userRole: session.user.role,
          action: "DELETE",
          resource: "Product",
          resourceId: product._id,
          details: `Failed to delete product: ${product.name}`,
          status: "error",
        })
      }

      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card-modern mobile-card animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-3"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <div className="mobile-grid">
          {[...Array(8)].map((_, i) => (
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
      <ProductFilters
        onFilterChange={handleFilterChange}
        groups={groups}
        subGroups={subGroups}
        currentFilters={filters}
      />

      <div className="mobile-grid">
        {filteredProducts.map((product) => {
          // Handle both new imagePaths array and old imagePath string for backward compatibility
          const images =
            product.imagePaths && product.imagePaths.length > 0
              ? product.imagePaths
              : product.imagePath
                ? [product.imagePath]
                : []

          return (
            <Card
              key={product._id}
              className="card-modern group hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <div className="relative h-48 overflow-hidden">
                <ImageSliderCompact
                  images={images}
                  productName={product.name}
                  className="w-full h-full"
                  onViewDetails={() => handleView(product)}
                  showViewButton={true}
                />

                {/* Top badges */}
                <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-40 pointer-events-none">
                  <Badge
                    variant="secondary"
                    className="bg-white/90 text-secondary font-mono text-xs font-semibold pointer-events-auto"
                  >
                    #{product.productId}
                  </Badge>
                  <Badge
                    className={`${
                      product.isOutOfStock ? "status-cancelled" : "status-sent"
                    } text-xs font-semibold pointer-events-auto`}
                  >
                    {product.isOutOfStock ? "Out of Stock" : "In Stock"}
                  </Badge>
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
                      {images.length > 1 && (
                        <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50 text-xs">
                          {images.length} pics
                        </Badge>
                      )}
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
                        <Package className="h-3 w-3" />
                        <span>Status: {product.isOutOfStock ? "Out of Stock" : "Available"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        <span>ID: {product.productId}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleView(product)}
                      className="w-full mobile-button hover:bg-primary/5 hover:border-primary/30 hover:text-primary"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>

                    {(userRole === "manager"||userRole === "product_manager") && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(product._id)}
                          className="mobile-button hover:bg-success/5 hover:border-success/30 hover:text-success"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteProduct(product)}
                          className="mobile-button hover:bg-destructive/5 hover:border-destructive/30 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {filteredProducts.length === 0 && (
          <div className="col-span-full">
            <Card className="card-modern text-center py-12 border-2 border-dashed border-gray-300">
              <CardContent className="mobile-card">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Package className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-secondary mb-3">No products found</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {products.length === 0
                    ? "Get started by adding your first product to the inventory."
                    : "No products match your filters. Try adjusting your search criteria."}
                </p>
                {allowedRoles.includes(userRole) && (
                  <Button
                    onClick={() => router.push("/products/add")}
                    className="btn-primary mobile-button"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    {products.length === 0 ? "Add Your First Product" : "Add New Product"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <ProductViewModal product={selectedProduct} isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} />
    </div>
  )
}
