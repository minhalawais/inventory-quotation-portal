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
    <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 shadow-sm">
            <Icon className="h-5 w-5 text-indigo-600" />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-gray-950 tracking-tight">{title}</h2>
          <p className="mt-0.5 text-sm text-gray-500 leading-relaxed">{description}</p>
        </div>
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  )
}
