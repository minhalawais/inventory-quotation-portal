import Image from "next/image"

import { COMPANY } from "@/lib/company"
import { cn } from "@/lib/utils"

interface BrandMarkProps {
  compact?: boolean
  inverse?: boolean
  className?: string
  /** Omit on customer-facing documents. Defaults to “Operations Portal”. */
  subtitle?: string | false
}

export function BrandMark({ compact = false, inverse = false, className = "", subtitle }: BrandMarkProps) {
  const isDocument = subtitle === false
  const line2 = isDocument ? null : (subtitle ?? "Operations Portal")
  const label = line2 ? "KK Sports Operations" : "KK Sports"

  if (inverse && !compact) {
    return (
      <div className={cn("flex min-w-0 flex-col justify-center gap-0.5", className)} aria-label={label}>
        <Image
          src={COMPANY.logoHorizontalPath}
          alt=""
          width={230}
          height={64}
          className="h-8 w-auto max-w-[148px] object-contain object-left sm:h-9 sm:max-w-[176px]"
          priority
        />
        {line2 && (
          <span className="truncate text-[10px] font-medium uppercase tracking-[0.04em] text-white/45">
            {line2}
          </span>
        )}
      </div>
    )
  }

  const src = inverse ? COMPANY.logoPath : COMPANY.logoWhiteBgPath
  const size = compact ? 36 : 40

  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)} aria-label={label}>
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        className={cn("shrink-0 object-contain", compact ? "h-9 w-9" : "h-10 w-10")}
        priority
      />
      {!compact && (
        <div className="min-w-0">
          <div className={cn("truncate text-sm font-bold leading-5", inverse ? "text-white" : "text-foreground")}>
            KK Sports
          </div>
          {line2 && (
            <div className={cn("truncate text-[11px] leading-4", inverse ? "text-white/55" : "text-muted-foreground")}>
              {line2}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
