"use client"
import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Plus, Minus, FileText, Search, User, Phone, MapPin, Package } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Image from "next/image"

interface Product {
  _id: string
  name: string
  price: number
  quantity: number
  productId: string
  group: string
  imagePaths?: string[]
  imagePath?: string // Keep for backward compatibility
}

interface QuotationItem {
  productId: string
  quantity: number
  price: number
  productImage?: string
}

interface QuotationFormProps {
  userId: string
}

export default function QuotationForm({ userId }: QuotationFormProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [customerData, setCustomerData] = useState({
    name: "",
    phone: "+92 ",
    address: "",
  })
  const [items, setItems] = useState<QuotationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchOpen, setSearchOpen] = useState<number | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products")
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error("Failed to fetch products:", error)
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      })
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
    const formatted = formatPhoneNumber(e.target.value)
    setCustomerData({ ...customerData, phone: formatted })
  }

  const addItem = () => {
    setItems([...items, { productId: "", quantity: 1, price: 0, productImage: "" }])
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
        updatedItems[index].price = product.price
        // Get the main product image (first image from imagePaths or fallback to imagePath)
        const mainImage =
          product.imagePaths && product.imagePaths.length > 0 ? product.imagePaths[0] : product.imagePath || ""
        updatedItems[index].productImage = mainImage
      }
    }

    setItems(updatedItems)
  }

  const calculateTotal = () => {
    return items.reduce((total, item) => total + item.quantity * item.price, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const phoneRegex = /^\+92 \d{3} \d{7}$/
    if (!phoneRegex.test(customerData.phone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter phone number in format: +92 XXX XXXXXXX",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          riderId: userId,
          customerName: customerData.name,
          customerPhone: customerData.phone,
          customerAddress: customerData.address,
          items,
          totalAmount: calculateTotal(),
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
    } catch (error) {
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
  }: { index: number; value: string; onSelect: (value: string) => void }) => {
    const [searchTerm, setSearchTerm] = useState("")
  
    const filteredProducts = useMemo(() => {
      if (!searchTerm) return products.slice(0, 10)
  
      const term = searchTerm.toLowerCase()
      return products
        .filter(
          (product) =>
            product.name.toLowerCase().includes(term) ||
            product.productId?.toLowerCase().includes(term) ||
            product.group?.toLowerCase().includes(term),
        )
        .slice(0, 20)
    }, [searchTerm, products])
  
    const selectedProduct = products.find((p) => p._id === value)
  
    return (
      <Popover open={searchOpen === index} onOpenChange={(open) => setSearchOpen(open ? index : null)}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={searchOpen === index}
            className="w-full justify-between text-left font-normal input-modern mobile-input bg-transparent"
          >
            {selectedProduct ? (
              <span className="truncate">
                {selectedProduct.name} (PKR{selectedProduct.price})
              </span>
            ) : (
              <span className="text-muted-foreground">Select product...</span>
            )}
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command filter={(value, search) => {
            // Custom filter function to search across multiple fields
            const product = products.find(p => p._id === value);
            if (!product) return 0;
            
            const searchLower = search.toLowerCase();
            const inName = product.name.toLowerCase().includes(searchLower);
            const inProductId = product.productId?.toLowerCase().includes(searchLower);
            const inGroup = product.group?.toLowerCase().includes(searchLower);
            
            return (inName || inProductId || inGroup) ? 1 : 0;
          }}>
            <CommandInput 
              placeholder="Search products by name, ID, or group..." 
              value={searchTerm} 
              onValueChange={setSearchTerm} 
            />
            <CommandList>
              <CommandEmpty>No products found.</CommandEmpty>
              <CommandGroup>
                {filteredProducts.map((product) => {
                  const mainImage =
                    product.imagePaths && product.imagePaths.length > 0
                      ? product.imagePaths[0]
                      : product.imagePath || ""
  
                  return (
                    <CommandItem
                      key={product._id}
                      value={product._id} // Use the ID as the value
                      onSelect={() => {
                        onSelect(product._id)
                        setSearchOpen(false)
                        setSearchTerm("")
                      }}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={mainImage || "/placeholder.svg?height=48&width=48"}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="font-medium truncate">{product.name}</span>
                            <span className="text-sm text-primary font-semibold">PKR{product.price}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>ID: {product.productId}</span>
                            <span>Group: {product.group}</span>
                            <span>Stock: {product.quantity}</span>
                          </div>
                        </div>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <div className="space-y-6">
      {/* Customer Information Card */}
      <Card className="card-modern">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-secondary">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent className="mobile-spacing">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Label htmlFor="customerName" className="text-sm font-medium text-secondary flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Name
              </Label>
              <Input
                id="customerName"
                value={customerData.name}
                onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                required
                className="input-modern mobile-input"
                placeholder="Enter customer name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone" className="text-sm font-medium text-secondary flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="customerPhone"
                value={customerData.phone}
                onChange={handlePhoneChange}
                required
                className="input-modern mobile-input"
                placeholder="+92 XXX XXXXXXX"
                maxLength={15}
              />
              <p className="text-xs text-muted-foreground">Format: +92 XXX XXXXXXX</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerAddress" className="text-sm font-medium text-secondary flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </Label>
              <Input
                id="customerAddress"
                value={customerData.address}
                onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                required
                className="input-modern mobile-input"
                placeholder="Enter customer address"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Card */}
      <Card className="card-modern">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-secondary">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-primary" />
            </div>
            Products & Services
          </CardTitle>
        </CardHeader>
        <CardContent className="mobile-spacing">
          {items.map((item, index) => {
            const selectedProduct = products.find((p) => p._id === item.productId)

            return (
              <div key={index} className="bg-muted/30 rounded-xl p-4 sm:p-6 space-y-4 border">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-secondary">Item #{index + 1}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 mobile-button"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-secondary">Product</Label>
                    <ProductSearchCombobox
                      index={index}
                      value={item.productId}
                      onSelect={(value) => updateItem(index, "productId", value)}
                    />
                  </div>

                  {/* Show selected product with image */}
                  {selectedProduct && (
                    <div className="bg-white rounded-lg p-4 border border-primary/20">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={item.productImage || "/placeholder.svg?height=64&width=64"}
                            alt={selectedProduct.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-secondary truncate">{selectedProduct.name}</h4>
                          <p className="text-sm text-muted-foreground">ID: {selectedProduct.productId}</p>
                          <p className="text-sm text-primary font-semibold">
                            PKR {selectedProduct.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-secondary">Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", Number.parseInt(e.target.value))}
                        className="input-modern mobile-input"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-secondary">Price (PKR)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateItem(index, "price", Number.parseFloat(e.target.value))}
                        className="input-modern mobile-input"
                      />
                    </div>
                  </div>

                  {item.productId && item.quantity > 0 && item.price > 0 && (
                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-secondary">Item Total:</span>
                        <span className="text-lg font-bold text-primary">
                          PKR {(item.quantity * item.price).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {items.length === 0 && (
            <div className="text-center py-12 bg-muted/30 rounded-xl border-2 border-dashed border-gray-300">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-secondary mb-2">No items added</h3>
              <p className="text-sm text-muted-foreground">Click "Add Item" to start building your quotation.</p>
            </div>
          )}

          <div className="flex justify-center mt-4">
            <Button onClick={addItem} className="btn-primary mobile-button">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>

          {items.length > 0 && (
            <div className="gradient-primary p-6 rounded-xl text-white mt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Grand Total:</span>
                <span className="text-3xl font-bold">PKR {calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pb-6">
        <Button
          onClick={handleSubmit}
          className="btn-primary mobile-button flex-1 sm:flex-none"
          disabled={loading || items.length === 0}
        >
          <FileText className="mr-2 h-4 w-4" />
          {loading ? "Creating..." : "Create Quotation"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="mobile-button flex-1 sm:flex-none"
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
