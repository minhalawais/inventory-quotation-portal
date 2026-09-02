"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import { Package, ChevronLeft, ChevronRight, Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface ImageSliderCompactProps {
  images: string[]
  productName: string
  className?: string
  onViewDetails?: () => void
  showViewButton?: boolean
}

export default function ImageSliderCompact({
  images,
  productName,
  className = "",
  onViewDetails,
  showViewButton = true,
}: ImageSliderCompactProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (!images || images.length === 0) {
    return (
      <div className={cn("relative flex items-center justify-center overflow-hidden rounded-lg border border-border bg-muted", className)}>
        <Package className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} aria-hidden />
        <span className="sr-only">{productName} — no image</span>
        {showViewButton && onViewDetails && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
            <Button type="button" size="sm" onClick={onViewDetails}>
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              View
            </Button>
          </div>
        )}
      </div>
    )
  }

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <>
      <div className={cn("relative group", className)}>
        <div className="relative h-full w-full overflow-hidden rounded-lg border border-border bg-muted">
          <Image
            src={images[currentIndex] || "/placeholder.svg?height=400&width=600"}
            alt={`${productName} — image ${currentIndex + 1}`}
            fill
            className="cursor-pointer object-contain p-1"
            onClick={() => setIsModalOpen(true)}
          />

          {images.length > 1 && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute left-1 top-1/2 z-20 h-8 w-8 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                onClick={prevImage}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-1 top-1/2 z-20 h-8 w-8 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                onClick={nextImage}
                aria-label="Next image"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {showViewButton && onViewDetails && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
              <Button type="button" size="sm" onClick={onViewDetails}>
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                View
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl p-0">
          <div className="relative h-[70vh] w-full">
            <Image
              src={images[currentIndex] || "/placeholder.svg"}
              alt={`${productName} — image ${currentIndex + 1}`}
              fill
              className="object-contain p-4"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
