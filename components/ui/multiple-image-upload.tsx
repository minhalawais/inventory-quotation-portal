"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { X, Upload, ImageIcon, Plus } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"

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
          // 5MB limit
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
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  const removeExistingImage = (index: number) => {
    if (onExistingImagesChange) {
      const newExistingImages = existingImages.filter((_, i) => i !== index)
      onExistingImagesChange(newExistingImages)
    }
  }

  const totalImages = images.length + existingImages.length

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium text-secondary">
        Product Images ({totalImages}/{maxImages})
      </Label>

      {/* Existing Images */}
      {existingImages.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Current Images:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {existingImages.map((image, index) => (
              <div key={`existing-${index}`} className="relative group">
                <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`Existing image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  {onExistingImagesChange && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onClick={() => removeExistingImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Images Preview */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">New Images to Upload:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((file, index) => (
              <div key={`new-${index}`} className="relative group">
                <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-primary/30">
                  <Image
                    src={URL.createObjectURL(file) || "/placeholder.svg"}
                    alt={`New image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={() => removeNewImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-center mt-1 text-muted-foreground truncate">{file.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Area */}
      {totalImages < maxImages && (
        <div
          className={`relative border-2 border-dashed rounded-xl p-6 transition-colors duration-200 ${
            dragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary/50 hover:bg-primary/5"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
              <ImageIcon className="h-6 w-6 text-primary" />
            </div>

            <div>
              <p className="text-sm font-medium text-secondary mb-1">Drop images here or click to browse</p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WebP up to 5MB each • {maxImages - totalImages} more images allowed
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
                id="image-upload"
              />
              <Label htmlFor="image-upload" className="cursor-pointer">
                <Button type="button" variant="outline" className="mobile-button bg-transparent" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Files
                  </span>
                </Button>
              </Label>

              <span className="text-xs text-muted-foreground">or</span>

              <Button type="button" variant="ghost" size="sm" className="text-xs">
                <Plus className="h-3 w-3 mr-1" />
                Drag & Drop
              </Button>
            </div>
          </div>
        </div>
      )}

      {totalImages >= maxImages && (
        <div className="text-center p-4 bg-muted/50 rounded-lg border">
          <p className="text-sm text-muted-foreground">Maximum number of images reached ({maxImages})</p>
        </div>
      )}
    </div>
  )
}
