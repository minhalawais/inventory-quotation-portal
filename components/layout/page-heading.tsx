import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface PageHeadingProps {
  title: string
  description: string
  icon?: LucideIcon
  actions?: ReactNode
  descriptionClassName?: string
}

export function PageHeading({ title, description, icon: Icon, actions, descriptionClassName }: PageHeadingProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between md:gap-4 md:pb-5">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <Icon className="mt-1 h-5 w-5 shrink-0 text-[hsl(var(--kk-gold-hover))]" strokeWidth={1.8} aria-hidden="true" />
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-semibold leading-7 text-foreground md:text-2xl">{title}</h1>
          <p className={cn("mt-1 text-sm leading-5 text-muted-foreground", descriptionClassName)}>
            {description}
          </p>
        </div>
      </div>
      {actions && (
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 md:w-auto">{actions}</div>
      )}
    </div>
  )
}
