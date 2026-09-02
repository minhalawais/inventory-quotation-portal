import { Package } from "lucide-react"

import { cn } from "@/lib/utils"

interface ProductThumbProps {
  src?: string | null
  alt: string
  className?: string
}

export function ProductThumb({ src, alt, className }: ProductThumbProps) {
  return (
    <div
      className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-contain" />
      ) : (
        <Package className="h-5 w-5 text-muted-foreground" strokeWidth={1.6} aria-label="No image" />
      )}
    </div>
  )
}
