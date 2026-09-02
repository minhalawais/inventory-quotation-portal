"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Plus, Minus, FileText, Search, Trash2, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"
import { Panel, PanelBody, PanelHeader } from "@/components/shared/panel"
import { FormActions } from "@/components/shared/form-section"
import { ProductThumb } from "@/components/shared/product-thumb"
import { EmptyState } from "@/components/shared/empty-state"
import { QuotationItemImagePicker } from "@/components/quotations/quotation-item-image-picker"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { classifyProduct, formatClassification } from "@/lib/product-classification"
import { collectProductImages } from "@/lib/product-images"

interface Product {
  _id: string
  name: string
  price: number
  quantity: number
  productId: string
  department?: string
  category?: string
  subCategory?: string
  group?: string
  subGroup?: string
  imagePaths?: string[]
  imagePath?: string
}

interface QuotationItem {
  productId: string
  quantity: number
  price: number
  productImage?: string
  productImages?: string[]
}

interface QuotationFormProps {
  userId: string
}

function productMainImage(product: Product) {
  if (product.imagePaths && product.imagePaths.length > 0) return product.imagePaths[0]
  return product.imagePath || ""
}

export default function QuotationForm({ userId }: QuotationFormProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [customerData, setCustomerData] = useState({
    name: "",
    phone: "+92 ",
    address: "",
  })
  const [items, setItems] = useState<QuotationItem[]>([])
  const [showPrices, setShowPrices] = useState(true)
  const [loading, setLoading] = useState(false)
  const [productsLoading, setProductsLoading] = useState(true)
  const [searchOpen, setSearchOpen] = useState<number | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const isMobile = useIsMobile()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setProductsLoading(true)
      const response = await fetch("/api/products")
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      })
    } finally {
      setProductsLoading(false)
    }
  }

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/[^\d+]/g, "")
    if (!cleaned.startsWith("+92")) {
      return "+92 "
    }
    const digits = cleaned.slice(3)
    if (digits.length <= 3) {
      return `+92 ${digits}`
    } else if (digits.length <= 10) {
      return `+92 ${digits.slice(0, 3)} ${digits.slice(3)}`
    } else {
      return `+92 ${digits.slice(0, 3)} ${digits.slice(3, 10)}`
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerData({ ...customerData, phone: formatPhoneNumber(e.target.value) })
  }

  const addItem = () => {
    setItems([...items, { productId: "", quantity: 1, price: 0, productImage: "", productImages: [] }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof QuotationItem, value: string | number) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    if (field === "productId") {
      const product = products.find((p) => p._id === value)
      if (product) {
        const images = collectProductImages(product)
        updatedItems[index].price = product.price
        updatedItems[index].productImage = images[0] || ""
        updatedItems[index].productImages = images
      }
    }

    setItems(updatedItems)
  }

  const updateItemImages = (index: number, images: string[]) => {
    const updatedItems = [...items]
    updatedItems[index] = {
      ...updatedItems[index],
      productImages: images,
      productImage: images[0] || "",
    }
    setItems(updatedItems)
  }

  const calculateTotal = () => items.reduce((total, item) => total + item.quantity * item.price, 0)

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()

    const phoneRegex = /^\+92 \d{3} \d{7}$/
    if (!phoneRegex.test(customerData.phone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter phone number in format: +92 XXX XXXXXXX",
        variant: "destructive",
      })
      return
    }

    if (!customerData.name.trim() || !customerData.address.trim()) {
      toast({
        title: "Missing customer details",
        description: "Name, phone, and address are required.",
        variant: "destructive",
      })
      return
    }

    if (items.length === 0 || items.some((item) => !item.productId)) {
      toast({
        title: "Incomplete items",
        description: "Add at least one product before creating the quotation.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          riderId: userId,
          customerName: customerData.name,
          customerPhone: customerData.phone,
          customerAddress: customerData.address,
          items,
          totalAmount: calculateTotal(),
          showPrices,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Quotation created successfully",
        })
        router.push("/quotations")
      } else {
        throw new Error("Failed to create quotation")
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to create quotation",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const ProductSearchCombobox = ({
    index,
    value,
    onSelect,
  }: {
    index: number
    value: string
    onSelect: (value: string) => void
  }) => {
    const [searchTerm, setSearchTerm] = useState("")
    const open = searchOpen === index

    const filteredProducts = useMemo(() => {
      if (!searchTerm) return products.slice(0, 10)
      const term = searchTerm.toLowerCase()
      return products
        .filter((product) => {
          const classification = classifyProduct(product)
          return (
            product.name.toLowerCase().includes(term) ||
            product.productId?.toLowerCase().includes(term) ||
            classification.department.toLowerCase().includes(term) ||
            classification.category.toLowerCase().includes(term) ||
            classification.subCategory.toLowerCase().includes(term)
          )
        })
        .slice(0, 20)
    }, [searchTerm, products])

    const selectedProduct = products.find((p) => p._id === value)

    const searchList = (
      <Command
        filter={(itemValue, search) => {
          const product = products.find((p) => p._id === itemValue)
          if (!product) return 0
          const searchLower = search.toLowerCase()
          const classification = classifyProduct(product)
          const match =
            product.name.toLowerCase().includes(searchLower) ||
            product.productId?.toLowerCase().includes(searchLower) ||
            classification.department.toLowerCase().includes(searchLower) ||
            classification.category.toLowerCase().includes(searchLower) ||
            classification.subCategory.toLowerCase().includes(searchLower)
          return match ? 1 : 0
        }}
      >
        <CommandInput
          placeholder="Search by name, ID, or classification..."
          value={searchTerm}
          onValueChange={setSearchTerm}
        />
        <CommandList>
          <CommandEmpty>{productsLoading ? "Loading products…" : "No products found."}</CommandEmpty>
          <CommandGroup>
            {filteredProducts.map((product) => {
              const mainImage = productMainImage(product)
              return (
                <CommandItem
                  key={product._id}
                  value={product._id}
                  onSelect={() => {
                    onSelect(product._id)
                    setSearchOpen(null)
                    setSearchTerm("")
                  }}
                >
                  <div className="flex w-full items-center gap-3">
                    <ProductThumb src={mainImage || null} alt={product.name} className="h-10 w-10" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{product.name}</span>
                        <span className="shrink-0 text-xs font-semibold tabular-nums">
                          PKR {product.price.toLocaleString()}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        #{product.productId} · {formatClassification(classifyProduct(product)) || "Unclassified"}
                      </p>
                    </div>
                  </div>
                </CommandItem>
              )
            })}
          </CommandGroup>
        </CommandList>
      </Command>
    )

    const trigger = (
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="h-10 w-full justify-between font-normal"
        onClick={() => setSearchOpen(open ? null : index)}
      >
        {selectedProduct ? (
          <span className="truncate">
            {selectedProduct.name} (PKR {selectedProduct.price.toLocaleString()})
          </span>
        ) : (
          <span className="text-muted-foreground">Select product…</span>
        )}
        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    )

    if (isMobile) {
      return (
        <>
          {trigger}
          <Dialog open={open} onOpenChange={(next) => setSearchOpen(next ? index : null)}>
            <DialogContent className="flex h-[85vh] max-w-lg flex-col gap-0 p-0">
              <DialogHeader className="border-b border-border px-4 py-3">
                <DialogTitle className="text-base">Search products</DialogTitle>
              </DialogHeader>
              <div className="min-h-0 flex-1 overflow-hidden">{searchList}</div>
            </DialogContent>
          </Dialog>
        </>
      )
    }

    return (
      <Popover open={open} onOpenChange={(next) => setSearchOpen(next ? index : null)}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          {searchList}
        </PopoverContent>
      </Popover>
    )
  }

  const summary = (
    <div className="space-y-4">
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Customer</dt>
          <dd className="truncate font-medium text-right">{customerData.name || "—"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Phone</dt>
          <dd className="font-mono text-xs text-right">{customerData.phone.trim() || "—"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Items</dt>
          <dd className="tabular-nums font-medium">{items.filter((i) => i.productId).length}</dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-border pt-3">
          <dt className="font-semibold text-foreground">Total</dt>
          <dd className="text-base font-bold tabular-nums">PKR {calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Customer copy</dt>
          <dd className="text-right font-medium">{showPrices ? "With price" : "Without price"}</dd>
        </div>
      </dl>
      <Button
        type="button"
        className="w-full"
        disabled={loading || items.length === 0}
        onClick={() => void handleSubmit()}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating…
          </>
        ) : (
          <>
            <FileText className="mr-2 h-4 w-4" />
            Create quotation
          </>
        )}
      </Button>
      <Button type="button" variant="outline" className="w-full" onClick={() => router.back()} disabled={loading}>
        Cancel
      </Button>
    </div>
  )

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className={cn("space-y-4", items.length > 0 && "pb-24 lg:pb-0")}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        <div className="space-y-4">
          <Panel>
            <PanelHeader>
              <h2 className="text-sm font-semibold">Customer details</h2>
            </PanelHeader>
            <PanelBody>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer name</Label>
                  <Input
                    id="customerName"
                    value={customerData.name}
                    onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                    required
                    className="h-10"
                    placeholder="Customer name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone number</Label>
                  <Input
                    id="customerPhone"
                    value={customerData.phone}
                    onChange={handlePhoneChange}
                    required
                    className="h-10 font-mono"
                    placeholder="+92 XXX XXXXXXX"
                    maxLength={15}
                  />
                  <p className="text-xs text-muted-foreground">Format: +92 XXX XXXXXXX</p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="customerAddress">Address</Label>
                  <Input
                    id="customerAddress"
                    value={customerData.address}
                    onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                    required
                    className="h-10"
                    placeholder="Customer address"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Customer copy</Label>
                  <RadioGroup
                    value={showPrices ? "with" : "without"}
                    onValueChange={(value) => setShowPrices(value === "with")}
                    className="grid gap-2 sm:grid-cols-2"
                  >
                    <label
                      htmlFor="quote-with-price"
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2.5 text-sm"
                    >
                      <RadioGroupItem value="with" id="quote-with-price" />
                      With price
                    </label>
                    <label
                      htmlFor="quote-without-price"
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2.5 text-sm"
                    >
                      <RadioGroupItem value="without" id="quote-without-price" />
                      Without price
                    </label>
                  </RadioGroup>
                </div>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">Line items</h2>
              <Button type="button" variant="outline" size="sm" className="h-9" onClick={addItem}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add item
              </Button>
            </PanelHeader>
            <PanelBody className="space-y-3">
              {items.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Tap a product image to choose photos for the customer copy. All images are selected by default.
                </p>
              )}
              {items.length === 0 && (
                <EmptyState
                  icon={FileText}
                  title="No items yet"
                  description="Add a product to build this quotation."
                  actionLabel="Add item"
                  onAction={addItem}
                  className="py-8"
                />
              )}

              {/* Desktop editable table */}
              {items.length > 0 && (
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
                        <th className="pb-2 pr-3 font-semibold">Product</th>
                        <th className="pb-2 pr-3 font-semibold">Qty</th>
                        <th className="pb-2 pr-3 font-semibold">Unit price</th>
                        <th className="pb-2 pr-3 font-semibold">Line total</th>
                        <th className="pb-2 font-semibold"><span className="sr-only">Remove</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => {
                        const selectedProduct = products.find((p) => p._id === item.productId)
                        return (
                          <tr key={index} className="border-b border-border last:border-0">
                            <td className="py-3 pr-3 align-middle">
                              <div className="flex min-w-[240px] items-center gap-3">
                                <QuotationItemImagePicker
                                  images={selectedProduct ? collectProductImages(selectedProduct) : []}
                                  selected={item.productImages || []}
                                  alt={selectedProduct?.name || "Product"}
                                  onChange={(next) => updateItemImages(index, next)}
                                />
                                <div className="min-w-0 flex-1">
                                  <ProductSearchCombobox
                                    index={index}
                                    value={item.productId}
                                    onSelect={(value) => updateItem(index, "productId", value)}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3 pr-3 align-middle">
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9"
                                  onClick={() =>
                                    updateItem(index, "quantity", Math.max(1, item.quantity - 1))
                                  }
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </Button>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateItem(index, "quantity", Number.parseInt(e.target.value) || 1)
                                  }
                                  className="h-9 w-16 text-center tabular-nums"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9"
                                  onClick={() => updateItem(index, "quantity", item.quantity + 1)}
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                            <td className="py-3 pr-3 align-middle">
                              <Input
                                type="number"
                                step="0.01"
                                value={item.price}
                                onChange={(e) =>
                                  updateItem(index, "price", Number.parseFloat(e.target.value) || 0)
                                }
                                className="h-9 w-28 tabular-nums"
                              />
                            </td>
                            <td className="py-3 pr-3 align-middle">
                              <span className="font-medium tabular-nums">
                                PKR {(item.quantity * item.price).toLocaleString()}
                              </span>
                            </td>
                            <td className="py-3 align-middle">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-destructive hover:text-destructive"
                                onClick={() => removeItem(index)}
                                aria-label="Remove item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Mobile editable cards */}
              <div className="space-y-3 md:hidden">
                {items.map((item, index) => {
                  const selectedProduct = products.find((p) => p._id === item.productId)
                  return (
                    <div key={index} className="rounded-lg border border-border p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Item {index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive"
                          onClick={() => removeItem(index)}
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <ProductSearchCombobox
                        index={index}
                        value={item.productId}
                        onSelect={(value) => updateItem(index, "productId", value)}
                      />
                      {selectedProduct && (
                        <div className="flex items-center gap-3 rounded-md border border-border bg-muted/40 p-2">
                          <QuotationItemImagePicker
                            images={collectProductImages(selectedProduct)}
                            selected={item.productImages || []}
                            alt={selectedProduct.name}
                            onChange={(next) => updateItemImages(index, next)}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{selectedProduct.name}</p>
                            <p className="text-xs text-muted-foreground">#{selectedProduct.productId}</p>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(index, "quantity", Number.parseInt(e.target.value) || 1)
                            }
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Unit price (PKR)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.price}
                            onChange={(e) =>
                              updateItem(index, "price", Number.parseFloat(e.target.value) || 0)
                            }
                            className="h-10"
                          />
                        </div>
                      </div>
                      {item.productId && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Line total</span>
                          <span className="font-semibold tabular-nums">
                            PKR {(item.quantity * item.price).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </PanelBody>
          </Panel>

          <FormActions className="hidden lg:flex">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || items.length === 0}>
              {loading ? "Creating…" : "Create quotation"}
            </Button>
          </FormActions>
        </div>

        <aside className="hidden lg:block">
          <Panel className="sticky top-20">
            <PanelHeader>
              <h2 className="text-sm font-semibold">Quote summary</h2>
            </PanelHeader>
            <PanelBody>{summary}</PanelBody>
          </Panel>
        </aside>
      </div>

      {/* Mobile sticky total / action */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur lg:hidden supports-[padding:max(0px)]:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-base font-bold tabular-nums">PKR {calculateTotal().toLocaleString()}</p>
          </div>
          <Button
            type="button"
            disabled={loading || items.length === 0}
            onClick={() => void handleSubmit()}
            className="h-10"
          >
            {loading ? "Creating…" : "Create quotation"}
          </Button>
        </div>
      </div>
    </form>
  )
}
