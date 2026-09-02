"use client"

import { useState, useEffect } from "react"
import {
  AlertTriangle,
  RefreshCw,
  Save,
  CheckCircle2,
  Search,
  PackageX,
} from "lucide-react"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { logActivity } from "@/lib/logger"
import { EmptyState, ErrorState } from "@/components/shared/empty-state"
import { ProductThumb } from "@/components/shared/product-thumb"
import { ResponsiveRecordList } from "@/components/shared/responsive-record-list"
import { StatusBadge } from "@/components/shared/status-badge"
import { Toolbar, ToolbarGroup } from "@/components/shared/toolbar"
import { Panel } from "@/components/shared/panel"
import { Metric } from "@/components/shared/metric"
import { classifyProduct, formatClassification } from "@/lib/product-classification"

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

function getImages(product: Product): string[] {
  if (product.imagePaths && product.imagePaths.length > 0) return product.imagePaths
  if (product.imagePath) return [product.imagePath]
  return []
}

export default function OutOfStockManager({ userRole }: OutOfStockManagerProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [updates, setUpdates] = useState<Map<string, ProductUpdate>>(new Map())
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  const { data: session } = useSession()

  // Preserve current UI behavior: only managers can edit/save on this page
  const canEdit = userRole === "manager"

  const fetchOutOfStockProducts = async () => {
    try {
      setLoading(true)
      setFetchError(false)
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
        setFetchError(true)
        throw new Error("Failed to fetch products")
      }
    } catch {
      setFetchError(true)
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
        isOutOfStock,
      })
    }

    setUpdates(currentUpdates)
  }

  const hasChanges = () => Array.from(updates.values()).some((u) => u.isOutOfStock !== u.originalStatus)

  const getChangedProducts = () =>
    Array.from(updates.values()).filter((u) => u.isOutOfStock !== u.originalStatus)

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
        headers: { "Content-Type": "application/json" },
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

  const filteredProducts = products.filter((product) => {
    const term = searchTerm.toLowerCase()
    const classification = classifyProduct(product)
    return (
      product.name.toLowerCase().includes(term) ||
      product.productId.toLowerCase().includes(term) ||
      classification.department.toLowerCase().includes(term) ||
      classification.category.toLowerCase().includes(term) ||
      classification.subCategory.toLowerCase().includes(term)
    )
  })

  const changedCount = getChangedProducts().length
  const restockCount = getChangedProducts().filter((p) => !p.isOutOfStock).length

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-[72px] rounded-lg" />
          <Skeleton className="h-[72px] rounded-lg" />
          <Skeleton className="h-[72px] rounded-lg" />
        </div>
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  if (fetchError) {
    return (
      <Panel>
        <ErrorState
          icon={PackageX}
          title="Could not load stock exceptions"
          description="Check your connection and try again."
          actionLabel="Retry"
          onAction={() => void fetchOutOfStockProducts()}
        />
      </Panel>
    )
  }

  const table = (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[40%]">Product</TableHead>
          <TableHead>ID</TableHead>
          <TableHead>Classification</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Mark in stock</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredProducts.map((product) => {
          const images = getImages(product)
          const currentUpdate = updates.get(product._id)
          const currentStatus = currentUpdate?.isOutOfStock ?? false
          const pending = currentUpdate && currentUpdate.isOutOfStock !== currentUpdate.originalStatus

          return (
            <TableRow key={product._id} className={pending ? "bg-amber-50/50" : undefined}>
              <TableCell>
                <div className="flex min-w-0 items-center gap-3">
                  <ProductThumb src={images[0]} alt={product.name} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{product.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {classifyProduct(product).category || "Unclassified"}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-mono text-xs text-muted-foreground">#{product.productId}</span>
              </TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground">
                  {formatClassification(classifyProduct(product)) || "Unclassified"}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm tabular-nums">PKR {product.price.toLocaleString()}</span>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <StatusBadge tone={currentStatus ? "danger" : "success"}>
                    {currentStatus ? "Out of stock" : "In stock"}
                  </StatusBadge>
                  {pending && (
                    <p className="text-[11px] font-medium text-amber-800">
                      Pending → {currentStatus ? "out of stock" : "in stock"}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="inline-flex items-center justify-end gap-2">
                  <Switch
                    id={`stock-${product._id}`}
                    checked={!currentStatus}
                    onCheckedChange={(checked) => updateOutOfStockStatus(product._id, !checked)}
                    disabled={!canEdit}
                    aria-label={`Mark ${product.name} in stock`}
                  />
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )

  const cards = filteredProducts.map((product) => {
    const images = getImages(product)
    const currentUpdate = updates.get(product._id)
    const currentStatus = currentUpdate?.isOutOfStock ?? false
    const pending = currentUpdate && currentUpdate.isOutOfStock !== currentUpdate.originalStatus

    return (
      <div
        key={product._id}
        className={`rounded-lg border bg-card p-3 ${pending ? "border-amber-300" : "border-border"}`}
      >
        <div className="flex gap-3">
          <ProductThumb src={images[0]} alt={product.name} className="h-16 w-16" />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-medium">{product.name}</p>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">#{product.productId}</p>
            <p className="mt-1 text-sm font-semibold tabular-nums">PKR {product.price.toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
          <div>
            <StatusBadge tone={currentStatus ? "danger" : "success"}>
              {currentStatus ? "Out of stock" : "In stock"}
            </StatusBadge>
            {pending && (
              <p className="mt-1 text-[11px] font-medium text-amber-800">
                Pending → {currentStatus ? "out of stock" : "in stock"}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor={`mobile-stock-${product._id}`} className="text-xs text-muted-foreground">
              In stock
            </Label>
            <Switch
              id={`mobile-stock-${product._id}`}
              checked={!currentStatus}
              onCheckedChange={(checked) => updateOutOfStockStatus(product._id, !checked)}
              disabled={!canEdit}
            />
          </div>
        </div>
      </div>
    )
  })

  return (
    <div className={`space-y-4 ${hasChanges() ? "pb-24" : ""}`}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Metric label="Out of stock" value={products.length} icon={PackageX} />
        <Metric label="Marked for restock" value={restockCount} icon={CheckCircle2} />
        <Metric label="Unsaved changes" value={changedCount} icon={AlertTriangle} />
      </div>

      <Toolbar>
        <ToolbarGroup className="w-full flex-1">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              placeholder="Search stock exceptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 pl-9"
              aria-label="Search stock exceptions"
            />
          </div>
        </ToolbarGroup>
        <ToolbarGroup>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => void fetchOutOfStockProducts()}
            disabled={loading}
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </ToolbarGroup>
      </Toolbar>

      {!canEdit && (
        <Alert className="border-border bg-muted/40">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Stock status on this page is read-only for your role. Ask a manager to save restock changes.
          </AlertDescription>
        </Alert>
      )}

      {filteredProducts.length === 0 ? (
        <Panel>
          <EmptyState
            icon={CheckCircle2}
            title={searchTerm ? "No matching products" : "No stock exceptions"}
            description={
              searchTerm ? "Try adjusting your search." : "All products are currently marked in stock."
            }
            actionLabel={searchTerm ? "Clear search" : undefined}
            onAction={searchTerm ? () => setSearchTerm("") : undefined}
          />
        </Panel>
      ) : (
        <ResponsiveRecordList table={table} cards={cards} />
      )}

      {hasChanges() && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[padding:max(0px)]:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm text-foreground">
              <span className="font-semibold tabular-nums">{changedCount}</span> unsaved change
              {changedCount === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={resetChanges} disabled={updating} className="h-9">
                Reset
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void saveChanges()}
                disabled={updating || !canEdit}
                className="h-9"
              >
                <Save className={`mr-1.5 h-3.5 w-3.5 ${updating ? "animate-spin" : ""}`} />
                Save changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
