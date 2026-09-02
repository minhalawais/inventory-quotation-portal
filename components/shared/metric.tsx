import type React from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface MetricProps {
  label: string
  value: React.ReactNode
  detail?: string
  icon?: LucideIcon
  className?: string
}

export function Metric({ label, value, detail, icon: Icon, className }: MetricProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{value}</p>
          {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
        </div>
        {Icon && <Icon className="h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.8} aria-hidden="true" />}
      </div>
    </div>
  )
}
