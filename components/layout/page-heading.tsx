import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

interface PageHeadingProps {
  title: string
  description: string
  icon?: LucideIcon
  actions?: ReactNode
}

export function PageHeading({ title, description, icon: Icon, actions }: PageHeadingProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <Icon className="mt-1 h-5 w-5 shrink-0 text-[hsl(var(--kk-gold-hover))]" strokeWidth={1.8} aria-hidden="true" />
        )}
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold leading-7 text-foreground sm:text-2xl">{title}</h1>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
        </div>
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  )
}
