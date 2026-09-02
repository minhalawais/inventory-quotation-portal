"use client"

import { useCallback, useEffect, useState } from "react"
import { Package, ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface ImageSliderProps {
  images: string[]
  productName: string
  className?: string
}

export default function ImageSlider({ images, productName, className = "" }: ImageSliderProps) {
  const [index, setIndex] = useState(0)
  const [open, setOpen] = useState(false)
  const count = images.length
  const current = images[index] || images[0]

  const go = useCallback(
    (next: number) => {
      if (count < 1) return
      setIndex(((next % count) + count) % count)
    },
    [count],
  )

  const next = useCallback(() => go(index + 1), [go, index])
  const prev = useCallback(() => go(index - 1), [go, index])

  useEffect(() => {
    setIndex(0)
  }, [images])

  useEffect(() => {
    if (!open || count < 2) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault()
        setIndex((currentIndex) => (currentIndex + 1) % count)
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        setIndex((currentIndex) => (currentIndex - 1 + count) % count)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, count])

  if (count === 0) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex aspect-square max-h-[360px] w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
          <Package className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} aria-hidden />
          <span className="sr-only">{productName} — no image</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={cn("space-y-2", className)}>
        <div className="relative overflow-hidden rounded-lg border border-border bg-muted">
          <button
            type="button"
            className="relative flex aspect-square max-h-[360px] w-full cursor-zoom-in items-center justify-center"
            onClick={() => setOpen(true)}
            aria-label={`View images of ${productName}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current}
              alt={`${productName} — image ${index + 1} of ${count}`}
              className="max-h-full max-w-full object-contain p-3"
            />
          </button>

          {count > 1 && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute left-2 top-1/2 h-9 w-9 -translate-y-1/2"
                onClick={(event) => {
                  event.stopPropagation()
                  prev()
                }}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-2 top-1/2 h-9 w-9 -translate-y-1/2"
                onClick={(event) => {
                  event.stopPropagation()
                  next()
                }}
                aria-label="Next image"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="absolute right-2 top-2 rounded-md border border-border bg-card/95 px-2 py-0.5 text-xs tabular-nums text-foreground">
                {index + 1} / {count}
              </span>
            </>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {images.map((src, imageIndex) => (
            <button
              key={`${src}-inline-${imageIndex}`}
              type="button"
              onClick={() => go(imageIndex)}
              onDoubleClick={() => {
                go(imageIndex)
                setOpen(true)
              }}
              className={cn(
                "h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-muted",
                imageIndex === index ? "border-foreground" : "border-border opacity-70 hover:opacity-100",
              )}
              aria-label={`Show image ${imageIndex + 1}`}
              aria-current={imageIndex === index}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-contain p-0.5" />
            </button>
          ))}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="z-[70] max-h-[92vh] w-[calc(100%-1.5rem)] max-w-3xl overflow-hidden p-0 sm:p-0">
          <DialogTitle className="sr-only">
            {productName} images, {index + 1} of {count}
          </DialogTitle>
          <div className="relative bg-muted">
            <div className="relative flex h-[min(70vh,560px)] items-center justify-center px-12 py-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current}
                alt={`${productName} — image ${index + 1} of ${count}`}
                className="max-h-full max-w-full object-contain"
              />
              {count > 1 && (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute left-3 top-1/2 h-10 w-10 -translate-y-1/2"
                    onClick={prev}
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute right-3 top-1/2 h-10 w-10 -translate-y-1/2"
                    onClick={next}
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-border bg-card px-4 py-2">
              <p className="truncate pr-3 text-sm font-medium">{productName}</p>
              <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {index + 1} / {count}
              </p>
            </div>
            {count > 1 && (
              <div className="flex gap-2 overflow-x-auto border-t border-border bg-card px-4 py-3">
                {images.map((src, imageIndex) => (
                  <button
                    key={`${src}-modal-${imageIndex}`}
                    type="button"
                    onClick={() => go(imageIndex)}
                    className={cn(
                      "h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-muted",
                      imageIndex === index ? "border-foreground" : "border-border opacity-70 hover:opacity-100",
                    )}
                    aria-label={`Show image ${imageIndex + 1}`}
                    aria-current={imageIndex === index}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
