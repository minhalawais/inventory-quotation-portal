import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { BrandMark } from "@/components/brand-mark"
import { cn } from "@/lib/utils"

interface SystemStatePageProps {
  icon: LucideIcon
  title: string
  description: ReactNode
  children?: ReactNode
  footer: string
  tone?: "warning" | "danger" | "neutral"
}

const toneClasses = {
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  neutral: "border-gray-200 bg-gray-50 text-gray-700",
}

export function SystemStatePage({
  icon: Icon,
  title,
  description,
  children,
  footer,
  tone = "neutral",
}: SystemStatePageProps) {
  return (
    <main className="flex min-h-screen flex-col bg-[hsl(var(--kk-black))] px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <BrandMark inverse className="mb-8" />

        <section className="rounded-lg border border-white/10 bg-white p-6 sm:p-8" aria-labelledby="system-state-title">
          <div className={cn("mb-5 flex h-10 w-10 items-center justify-center rounded-md border", toneClasses[tone])}>
            <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
          </div>
          <h1 id="system-state-title" className="text-xl font-semibold text-foreground">{title}</h1>
          <div className="mt-2 text-sm leading-6 text-muted-foreground">{description}</div>
          {children && <div className="mt-6">{children}</div>}
        </section>

        <p className="mt-6 text-center text-xs text-white/35">{footer}</p>
      </div>
    </main>
  )
}
