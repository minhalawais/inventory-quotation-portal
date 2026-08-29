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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
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
      <div className="space-y-5">
        <div className="h-20 animate-pulse rounded-xl border border-gray-200 bg-white" />
        <div className="mobile-grid">
          {[...Array(8)].map((_, i) => (
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
            <div
              key={product._id}
              className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:border-gray-300 hover:shadow-md"
              style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}
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
                  <span className="rounded-full bg-black/50 px-2 py-0.5 font-mono text-[11px] font-semibold text-white pointer-events-auto backdrop-blur-sm">
                    #{product.productId}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold pointer-events-auto ${
                      product.isOutOfStock
                        ? "bg-red-500/90 text-white"
                        : "bg-emerald-500/90 text-white"
                    }`}
                  >
                    {product.isOutOfStock ? "Out of stock" : "In stock"}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {/* Name + badges */}
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
                    {images.length > 1 && (
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-600">
                        {images.length} photos
                      </span>
                    )}
                  </div>
                </div>

                {/* Price block */}
                <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <span className="text-xs font-medium text-gray-500">Sale price</span>
                  <span className="text-base font-bold text-gray-950">
                    PKR {product.price.toLocaleString()}
                  </span>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleView(product)}
                    className="h-9 w-full rounded-lg text-xs font-medium hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    View details
                  </Button>

                  {(userRole === "manager" || userRole === "product_manager") && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(product._id)}
                        className="h-9 rounded-lg text-xs font-medium hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        <Edit className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteTarget(product)}
                        className="h-9 rounded-lg text-xs font-medium hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {filteredProducts.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <Package className="h-7 w-7 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {products.length === 0 ? "No products yet" : "No matching products"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {products.length === 0
                  ? "Add your first product to the inventory."
                  : "Try adjusting your search or filter criteria."}
              </p>
            </div>
            {allowedRoles.includes(userRole) && (
              <Button onClick={() => router.push("/products/add")} size="sm" className="mt-1 h-9 rounded-lg">
                <Package className="mr-2 h-3.5 w-3.5" />
                Add product
              </Button>
            )}
          </div>
        )}
      </div>

      <ProductViewModal product={selectedProduct} isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} />
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.name} will be permanently removed from the catalog. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                if (deleteTarget) void deleteProduct(deleteTarget)
                setDeleteTarget(null)
              }}
            >
              Delete product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
