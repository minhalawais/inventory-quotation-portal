"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const AUTO_MS = 4000

interface QuotationProductImageProps {
  images: string[]
  alt: string
  className?: string
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduced(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])
  return reduced
}

export function QuotationProductImage({ images, alt, className }: QuotationProductImageProps) {
  const [index, setIndex] = useState(0)
  const [open, setOpen] = useState(false)
  const [paused, setPaused] = useState(false)
  const [inView, setInView] = useState(true)
  const [pageHidden, setPageHidden] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()
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
    const node = rootRef.current
    if (!node || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.2 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const onVisibility = () => setPageHidden(document.hidden)
    onVisibility()
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [])

  useEffect(() => {
    if (count < 2 || reducedMotion || paused || open || !inView || pageHidden) return
    const timer = window.setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % count)
    }, AUTO_MS)
    return () => window.clearInterval(timer)
  }, [count, reducedMotion, paused, open, inView, pageHidden])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault()
        setIndex((prevIndex) => (prevIndex + 1) % count)
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        setIndex((prevIndex) => (prevIndex - 1 + count) % count)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, count])

  if (count === 0) {
    return (
      <div
        className={cn(
          "flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted",
          className,
        )}
      >
        <Package className="h-5 w-5 text-muted-foreground" strokeWidth={1.6} aria-label={`${alt} — no image`} />
      </div>
    )
  }

  return (
    <>
      <div
        ref={rootRef}
        className={cn(
          "group relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted print:pointer-events-none",
          className,
        )}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <button
          type="button"
          className="relative block h-full w-full cursor-zoom-in"
          onClick={() => setOpen(true)}
          aria-label={`View images of ${alt}`}
        >
          {images.map((src, imageIndex) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${src}-${imageIndex}`}
              src={src}
              alt=""
              className={cn(
                "absolute inset-0 h-full w-full object-contain p-0.5 transition-opacity duration-500",
                imageIndex === index ? "opacity-100" : "opacity-0",
              )}
            />
          ))}
          <span className="sr-only">
            {alt}
            {count > 1 ? `, image ${index + 1} of ${count}` : ""}
          </span>
        </button>
        {count > 1 && (
          <span className="pointer-events-none absolute bottom-0.5 right-0.5 rounded bg-black/55 px-1 py-px text-[9px] font-medium tabular-nums leading-none text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 print:hidden">
            {index + 1}/{count}
          </span>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="z-[70] max-h-[92vh] w-[calc(100%-1.5rem)] max-w-3xl overflow-hidden p-0 sm:p-0">
          <DialogTitle className="sr-only">
            {alt} images, {index + 1} of {count}
          </DialogTitle>
          <div className="relative bg-muted">
            <div className="relative flex h-[min(70vh,560px)] items-center justify-center px-12 py-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={current} alt={`${alt} — image ${index + 1} of ${count}`} className="max-h-full max-w-full object-contain" />
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
              <p className="truncate pr-3 text-sm font-medium">{alt}</p>
              {count > 1 && (
                <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {index + 1} / {count}
                </p>
              )}
            </div>
            {count > 1 && (
              <div className="flex gap-2 overflow-x-auto border-t border-border bg-card px-4 py-3">
                {images.map((src, imageIndex) => (
                  <button
                    key={`${src}-thumb-${imageIndex}`}
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
