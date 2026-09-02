"use client"

import { Package, Edit } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

import ImageSlider from "@/components/ui/image-slider"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { StatusBadge } from "@/components/shared/status-badge"
import { useIsMobile } from "@/hooks/use-mobile"
import { classifyProduct } from "@/lib/product-classification"
import { collectProductImages } from "@/lib/product-images"

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

interface ProductViewModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (productId: string) => void
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium tabular-nums text-foreground break-words">{value}</dd>
    </div>
  )
}

function ProductDetailBody({
  product,
  images,
  isManager,
}: {
  product: Product
  images: string[]
  isManager: boolean
}) {
  const classification = classifyProduct(product)
  const profit =
    isManager && typeof product.purchaseRate === "number" ? product.price - product.purchaseRate : null
  const margin =
    profit != null && product.price > 0 ? ((profit / product.price) * 100).toFixed(1) : null

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)] lg:items-start">
      <ImageSlider images={images} productName={product.name} />

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-6 text-foreground break-words">{product.name}</h2>
            <p className="mt-1 font-mono text-xs text-muted-foreground">#{product.productId}</p>
          </div>
          <StatusBadge
            tone={product.isOutOfStock ? "danger" : "success"}
            className="shrink-0"
          >
            {product.isOutOfStock ? "Out of stock" : "In stock"}
          </StatusBadge>
        </div>

        <p className="mt-4 text-xl font-semibold tabular-nums">PKR {product.price.toLocaleString()}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Sale price</p>

        <dl className="mt-4 divide-y divide-border border-y border-border">
          {isManager && typeof product.purchaseRate === "number" && (
            <>
              <SpecRow label="Purchase rate" value={`PKR ${product.purchaseRate.toLocaleString()}`} />
              {profit != null && <SpecRow label="Profit / unit" value={`PKR ${profit.toLocaleString()}`} />}
              {margin != null && <SpecRow label="Margin" value={`${margin}%`} />}
            </>
          )}
          <SpecRow label="Department" value={classification.department || "—"} />
          <SpecRow label="Category" value={classification.category || "—"} />
          <SpecRow label="Subcategory" value={classification.subCategory || "—"} />
        </dl>
      </div>
    </div>
  )
}

export default function ProductViewModal({ product, isOpen, onClose, onEdit }: ProductViewModalProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const isMobile = useIsMobile()
  const isManager = session?.user?.role === "manager"

  if (!product) return null

  const images = collectProductImages(product)
  const canEdit = Boolean(onEdit)

  const handleEdit = () => {
    onClose()
    if (onEdit) {
      onEdit(product._id)
    } else {
      router.push(`/products/edit/${product._id}`)
    }
  }

  const footer = (
    <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button type="button" variant="outline" onClick={onClose}>
        Close
      </Button>
      {canEdit && (
        <Button type="button" onClick={handleEdit}>
          <Edit className="mr-1.5 h-3.5 w-3.5" />
          Edit
        </Button>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[96vh]">
          <DrawerHeader className="border-b border-border text-left">
            <DrawerTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-muted-foreground" aria-hidden />
              Product details
            </DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 py-4">
            <ProductDetailBody product={product} images={images} isManager={isManager} />
          </div>
          <DrawerFooter className="border-t border-border">{footer}</DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[92vh] w-full max-w-[920px] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-3">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Package className="h-4 w-4 text-muted-foreground" aria-hidden />
            Product details
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <ProductDetailBody product={product} images={images} isManager={isManager} />
        </div>
        <DialogFooter className="shrink-0 border-t border-border px-5 py-3 sm:justify-end">{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
