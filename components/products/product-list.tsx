"use client"

import { useState, useEffect, useCallback } from "react"
import { Edit, Trash2, Eye, Package, MoreHorizontal, Images } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { logActivity } from "@/lib/logger"
import ProductViewModal from "./product-view-modal"
import ProductFilters, { type ProductFilterState } from "./product-filters"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { EmptyState, ErrorState } from "@/components/shared/empty-state"
import { ProductThumb } from "@/components/shared/product-thumb"
import { RecordActions } from "@/components/shared/record-actions"
import { RecordOpenLink } from "@/components/shared/record-open-link"
import { ResponsiveRecordList } from "@/components/shared/responsive-record-list"
import { Panel } from "@/components/shared/panel"
import { classifyProduct, formatClassification } from "@/lib/product-classification"
import { isInteractiveTarget } from "@/lib/utils"

interface Product {
  _id: string
  department?: string
  category?: string
  subCategory?: string
  group?: string
  subGroup?: string
  productId: string
  name: string
  price: number
  purchaseRate?: number
  imagePaths?: string[]
  imagePath?: string
  isOutOfStock?: boolean
}

interface CategoryOption {
  department: string
  name: string
}

interface SubCategoryOption {
  department: string
  category: string
  name: string
}

interface ProductListProps {
  userRole: string
}

function getProductImages(product: Product): string[] {
  if (product.imagePaths && product.imagePaths.length > 0) return product.imagePaths
  if (product.imagePath) return [product.imagePath]
  return []
}

export default function ProductList({ userRole }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [filters, setFilters] = useState<ProductFilterState>({
    searchTerm: "",
    selectedDepartment: "all",
    selectedCategory: "all",
    selectedSubCategory: "all",
  })
  const [departments, setDepartments] = useState<string[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [subCategories, setSubCategories] = useState<SubCategoryOption[]>([])
  const { toast } = useToast()
  const { data: session } = useSession()
  const router = useRouter()
  const canMutate = userRole === "manager" || userRole === "product_manager"

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setFetchError(false)
      const response = await fetch("/api/products")
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
        const classified = data.map((product: Product) => classifyProduct(product))
        setDepartments(
          [...new Set(classified.map((item) => item.department).filter(Boolean))].sort() as string[],
        )
        setCategories(
          classified
            .filter((item) => item.category)
            .map((item) => ({ department: item.department, name: item.category })),
        )
        setSubCategories(
          classified
            .filter((item) => item.subCategory)
            .map((item) => ({
              department: item.department,
              category: item.category,
              name: item.subCategory,
            })),
        )
      } else {
        setFetchError(true)
      }
    } catch {
      setFetchError(true)
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
    let results = products.filter((product) => !product.isOutOfStock)

    if (filters.selectedDepartment && filters.selectedDepartment !== "all") {
      results = results.filter((product) => classifyProduct(product).department === filters.selectedDepartment)
    }

    if (filters.selectedCategory && filters.selectedCategory !== "all") {
      results = results.filter((product) => classifyProduct(product).category === filters.selectedCategory)
    }

    if (filters.selectedSubCategory && filters.selectedSubCategory !== "all") {
      results = results.filter((product) => classifyProduct(product).subCategory === filters.selectedSubCategory)
    }

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
    applyFilters()
  }, [filters, products, applyFilters])

  const handleFilterChange = useCallback((newFilters: ProductFilterState) => {
    setFilters(newFilters)
  }, [])

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
        setProducts((prev) => prev.filter((p) => p._id !== product._id))
        setFilteredProducts((prev) => prev.filter((p) => p._id !== product._id))

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
    } catch {
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
      <div className="space-y-4">
        <Skeleton className="h-[68px] w-full rounded-lg" />
        <Panel className="hidden overflow-hidden md:block">
          <div className="space-y-0 divide-y divide-border">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex h-14 items-center gap-4 px-4">
                <Skeleton className="h-12 w-12 rounded-md" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="ml-auto h-4 w-20" />
              </div>
            ))}
          </div>
        </Panel>
        <div className="space-y-3 md:hidden">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <Panel>
        <ErrorState
          icon={Package}
          title="Could not load products"
          description="Check your connection and try again."
          actionLabel="Retry"
          onAction={() => void fetchProducts()}
        />
      </Panel>
    )
  }

  const table = (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[52%]">Product</TableHead>
          <TableHead>ID</TableHead>
          <TableHead>Price</TableHead>
          <TableHead className="text-center">Images</TableHead>
          <TableHead className="text-right">{canMutate ? "Actions" : <span className="sr-only">Actions</span>}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredProducts.map((product) => {
          const images = getProductImages(product)
          return (
            <TableRow
              key={product._id}
              className="group cursor-pointer"
              onClick={(event) => {
                if (isInteractiveTarget(event.target)) return
                void handleView(product)
              }}
            >
              <TableCell>
                <div className="flex min-w-0 items-center gap-3">
                  <ProductThumb src={images[0]} alt={product.name} />
                  <div className="min-w-0">
                    <RecordOpenLink
                      onClick={() => void handleView(product)}
                      className="block truncate text-sm"
                    >
                      {product.name}
                    </RecordOpenLink>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatClassification(classifyProduct(product)) || "Unclassified"}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-mono text-xs text-muted-foreground">#{product.productId}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm font-medium tabular-nums">PKR {product.price.toLocaleString()}</span>
              </TableCell>
              <TableCell className="text-center">
                <span className="inline-flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
                  <Images className="h-3.5 w-3.5" aria-hidden />
                  {images.length}
                </span>
              </TableCell>
              <TableCell className="text-right" data-no-row-click>
                <RecordActions>
                  {canMutate && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9"
                      onClick={() => handleEdit(product._id)}
                    >
                      <Edit className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="h-9 w-9" aria-label="More actions">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => void handleView(product)}>
                        <Eye className="mr-2 h-3.5 w-3.5" />
                        Open product
                      </DropdownMenuItem>
                      {canMutate && (
                        <>
                          <DropdownMenuItem onClick={() => handleEdit(product._id)}>
                            <Edit className="mr-2 h-3.5 w-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(product)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </RecordActions>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )

  const cards = filteredProducts.map((product) => {
    const images = getProductImages(product)
    return (
      <div
        key={product._id}
        className="cursor-pointer rounded-lg border border-border bg-card p-3"
        onClick={(event) => {
          if (isInteractiveTarget(event.target)) return
          void handleView(product)
        }}
      >
        <div className="flex gap-3">
          <ProductThumb src={images[0]} alt={product.name} className="h-24 w-24" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <RecordOpenLink onClick={() => void handleView(product)} className="line-clamp-2 text-sm leading-5">
                  {product.name}
                </RecordOpenLink>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">#{product.productId}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" aria-label="Actions">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => void handleView(product)}>
                    <Eye className="mr-2 h-3.5 w-3.5" />
                    Open product
                  </DropdownMenuItem>
                  {canMutate && (
                    <>
                      <DropdownMenuItem onClick={() => handleEdit(product._id)}>
                        <Edit className="mr-2 h-3.5 w-3.5" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteTarget(product)}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="mt-2 text-sm font-semibold tabular-nums">PKR {product.price.toLocaleString()}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {formatClassification(classifyProduct(product)) || "Unclassified"} · {images.length} img
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  })

  return (
    <div className="space-y-4">
      <ProductFilters
        onFilterChange={handleFilterChange}
        departments={departments}
        categories={categories}
        subCategories={subCategories}
        currentFilters={filters}
        resultCount={filteredProducts.length}
      />

      {filteredProducts.length === 0 ? (
        <Panel>
          <EmptyState
            icon={Package}
            title={products.length === 0 ? "No products yet" : "No matching products"}
            description={
              products.length === 0
                ? "Add your first product to the catalog."
                : "Try adjusting your search or filters."
            }
            actionLabel={canMutate && products.length === 0 ? "Add product" : undefined}
            onAction={canMutate && products.length === 0 ? () => router.push("/products/add") : undefined}
          />
        </Panel>
      ) : (
        <ResponsiveRecordList table={table} cards={cards} />
      )}

      <ProductViewModal
        product={selectedProduct}
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        onEdit={canMutate ? handleEdit : undefined}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-[440px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.name} will be permanently removed from the catalog. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
