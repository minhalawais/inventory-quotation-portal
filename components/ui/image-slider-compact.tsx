"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X, Eye } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"

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
  const [isHovering, setIsHovering] = useState(false)

  if (!images || images.length === 0) {
    return (
      <div className={`relative bg-muted rounded-xl overflow-hidden ${className}`}>
        <Image src="/placeholder.svg?height=400&width=600" alt={productName} fill className="object-cover" />
        {showViewButton && onViewDetails && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 bg-black/40">
            <Button size="sm" onClick={onViewDetails} className="btn-primary">
              <Eye className="h-4 w-4 mr-2" />
              View Details
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

  const goToImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex(index)
  }

  return (
    <>
      <div
        className={`relative group ${className}`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Main Image */}
        <div className="relative w-full h-full rounded-xl overflow-hidden bg-muted">
          <Image
            src={images[currentIndex] || "/placeholder.svg?height=400&width=600"}
            alt={`${productName} - Image ${currentIndex + 1}`}
            fill
            className="object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
            onClick={() => setIsModalOpen(true)}
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Navigation arrows - only show if multiple images and hovering */}
          {images.length > 1 && isHovering && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black transition-all duration-200 h-8 w-8 z-30 shadow-lg"
                onClick={prevImage}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black transition-all duration-200 h-8 w-8 z-30 shadow-lg"
                onClick={nextImage}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-md text-xs font-medium z-25">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Thumbnail dots - only show if multiple images and hovering */}
          {images.length > 1 && isHovering && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-30">
              {images.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentIndex ? "bg-white scale-125" : "bg-white/60 hover:bg-white/80"
                  }`}
                  onClick={(e) => goToImage(index, e)}
                  onMouseDown={(e) => e.stopPropagation()}
                />
              ))}
            </div>
          )}

          {/* View Details Button - positioned to not interfere with slider */}
          {showViewButton && onViewDetails && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
              {/* Only show if not hovering over slider controls or if single image */}
              {(images.length === 1 || !isHovering) && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewDetails()
                  }}
                  className="btn-primary shadow-lg"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Full-screen modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] p-0 bg-black/95">
          <div className="relative w-full h-[80vh]">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 text-white"
              onClick={() => setIsModalOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>

            <Image
              src={images[currentIndex] || "/placeholder.svg"}
              alt={`${productName} - Image ${currentIndex + 1}`}
              fill
              className="object-contain"
            />

            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white h-12 w-12"
                  onClick={() => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white h-12 w-12"
                  onClick={() => setCurrentIndex((prev) => (prev + 1) % images.length)}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>

                {/* Thumbnail strip */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-md overflow-x-auto px-4">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all duration-200 ${
                        index === currentIndex ? "border-white" : "border-transparent opacity-60 hover:opacity-80"
                      }`}
                      onClick={() => setCurrentIndex(index)}
                    >
                      <Image
                        src={image || "/placeholder.svg"}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
