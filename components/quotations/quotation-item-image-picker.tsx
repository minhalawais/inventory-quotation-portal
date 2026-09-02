"use client"

import { useState } from "react"
import { Check, Images } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ProductThumb } from "@/components/shared/product-thumb"
import { cn } from "@/lib/utils"

interface QuotationItemImagePickerProps {
  images: string[]
  selected: string[]
  alt: string
  onChange: (next: string[]) => void
}

export function QuotationItemImagePicker({ images, selected, alt, onChange }: QuotationItemImagePickerProps) {
  const [open, setOpen] = useState(false)
  const selectedSet = new Set(selected)
  const preview = selected[0] || null

  const toggle = (src: string) => {
    const next = new Set(selected)
    if (next.has(src)) next.delete(src)
    else next.add(src)
    onChange(images.filter((image) => next.has(image)))
  }

  if (images.length === 0) {
    return <ProductThumb src={null} alt={alt} />
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Choose images for ${alt}`}
      >
        <ProductThumb src={preview} alt={alt} />
        {images.length > 1 && (
          <span className="absolute -bottom-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-card px-1 text-[10px] font-medium tabular-nums text-foreground">
            <Images className="mr-0.5 h-3 w-3" aria-hidden />
            {selected.length}/{images.length}
          </span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Images for customer</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Tap an image to include or exclude it. Selected images appear on the customer quotation.
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {images.map((src) => {
              const isSelected = selectedSet.has(src)
              return (
                <button
                  key={src}
                  type="button"
                  onClick={() => toggle(src)}
                  className={cn(
                    "relative aspect-square overflow-hidden rounded-md border bg-muted",
                    isSelected ? "border-foreground" : "border-border opacity-60",
                  )}
                  aria-pressed={isSelected}
                  aria-label={isSelected ? "Selected" : "Not selected"}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-contain p-1" />
                  {isSelected && (
                    <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <p className="text-xs tabular-nums text-muted-foreground">
            {selected.length} of {images.length} selected
          </p>
          <DialogFooter>
            <Button type="button" onClick={() => setOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
