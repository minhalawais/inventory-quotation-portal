"use client"

import type React from "react"
import { useState, useCallback } from "react"
import Image from "next/image"
import { X, Upload, ImageIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface MultipleImageUploadProps {
  images: File[]
  onImagesChange: (images: File[]) => void
  maxImages?: number
  existingImages?: string[]
  onExistingImagesChange?: (images: string[]) => void
}

export default function MultipleImageUpload({
  images,
  onImagesChange,
  maxImages = 6,
  existingImages = [],
  onExistingImagesChange,
}: MultipleImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const { toast } = useToast()

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return

      const newFiles = Array.from(files).filter((file) => {
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not an image file`,
            variant: "destructive",
          })
          return false
        }

        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} is larger than 5MB`,
            variant: "destructive",
          })
          return false
        }

        return true
      })

      const totalImages = images.length + existingImages.length + newFiles.length
      if (totalImages > maxImages) {
        toast({
          title: "Too many images",
          description: `Maximum ${maxImages} images allowed`,
          variant: "destructive",
        })
        return
      }

      onImagesChange([...images, ...newFiles])
    },
    [images, existingImages.length, maxImages, onImagesChange, toast],
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  const removeNewImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index))
  }

  const removeExistingImage = (index: number) => {
    if (onExistingImagesChange) {
      onExistingImagesChange(existingImages.filter((_, i) => i !== index))
    }
  }

  const totalImages = images.length + existingImages.length

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {totalImages}/{maxImages} images
      </p>

      {(existingImages.length > 0 || images.length > 0) && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {existingImages.map((image, index) => (
            <div key={`existing-${index}`} className="group relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-border bg-muted">
                <Image src={image || "/placeholder.svg"} alt={`Existing image ${index + 1}`} fill className="object-contain p-1" />
                {index === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-medium">
                    Primary
                  </span>
                )}
                {onExistingImagesChange && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-1.5 top-1.5 h-8 w-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    onClick={() => removeExistingImage(index)}
                    aria-label={`Remove image ${index + 1}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          {images.map((file, index) => (
            <div key={`new-${index}`} className="group relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-primary/40 bg-muted">
                <Image
                  src={URL.createObjectURL(file) || "/placeholder.svg"}
                  alt={`New image ${index + 1}`}
                  fill
                  className="object-contain p-1"
                />
                {existingImages.length === 0 && index === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-medium">
                    Primary
                  </span>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute right-1.5 top-1.5 h-8 w-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  onClick={() => removeNewImage(index)}
                  aria-label={`Remove new image ${index + 1}`}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">{file.name}</p>
            </div>
          ))}
        </div>
      )}

      {totalImages < maxImages && (
        <div
          className={cn(
            "relative rounded-lg border border-dashed p-5 transition-colors",
            dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} aria-hidden />
            <div>
              <p className="text-sm font-medium text-foreground">Drop images or browse</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                PNG, JPG, WebP up to 5MB · {maxImages - totalImages} remaining
              </p>
            </div>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
              id="image-upload"
            />
            <Label htmlFor="image-upload" className="cursor-pointer">
              <Button type="button" variant="outline" size="sm" asChild>
                <span>
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Choose files
                </span>
              </Button>
            </Label>
          </div>
        </div>
      )}

      {totalImages >= maxImages && (
        <p className="rounded-md border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
          Maximum of {maxImages} images reached.
        </p>
      )}
    </div>
  )
}
