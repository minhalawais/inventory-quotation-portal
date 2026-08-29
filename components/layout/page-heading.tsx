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
    <div className="flex flex-col gap-5 border-b border-gray-200/90 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        {Icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 shadow-sm">
            <Icon className="h-5 w-5 text-blue-700" strokeWidth={1.8} />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-[22px] font-semibold leading-7 tracking-[-0.025em] text-gray-950">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">{description}</p>
        </div>
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  )
}
