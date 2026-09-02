"use client"

import type { ReactNode } from "react"
import { ChevronDown } from "lucide-react"

import { Panel, PanelBody, PanelHeader } from "@/components/shared/panel"
import { ProductThumb } from "@/components/shared/product-thumb"
import { StatusBadge } from "@/components/shared/status-badge"
import { cn } from "@/lib/utils"

export interface ProductEditorSummary {
  name?: string
  productId?: string
  department?: string
  category?: string
  subCategory?: string
  price?: string
  purchaseRate?: string
  isOutOfStock?: boolean
  imageSrc?: string | null
  showPurchaseRate?: boolean
}

interface ProductEditorShellProps {
  title: string
  description: string
  summary: ProductEditorSummary
  children: ReactNode
  footer: ReactNode
  className?: string
}

function SummaryContent({ summary }: { summary: ProductEditorSummary }) {
  const priceNum = summary.price ? Number.parseFloat(summary.price) : NaN
  const purchaseNum = summary.purchaseRate ? Number.parseFloat(summary.purchaseRate) : NaN

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <ProductThumb src={summary.imageSrc} alt={summary.name || "Product"} className="h-16 w-16" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{summary.name || "Untitled product"}</p>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            {summary.productId ? `#${summary.productId}` : "No ID"}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {[summary.department, summary.category, summary.subCategory].filter(Boolean).join(" · ") || "No classification"}
          </p>
        </div>
      </div>

      <StatusBadge tone={summary.isOutOfStock ? "danger" : "success"}>
        {summary.isOutOfStock ? "Out of stock" : "In stock"}
      </StatusBadge>

      <dl className="space-y-2 border-t border-border pt-3 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Sale price</dt>
          <dd className="font-medium tabular-nums">
            {Number.isFinite(priceNum) ? `PKR ${priceNum.toLocaleString()}` : "—"}
          </dd>
        </div>
        {summary.showPurchaseRate && (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Purchase rate</dt>
            <dd className="font-medium tabular-nums">
              {Number.isFinite(purchaseNum) ? `PKR ${purchaseNum.toLocaleString()}` : "—"}
            </dd>
          </div>
        )}
        {summary.showPurchaseRate && Number.isFinite(priceNum) && Number.isFinite(purchaseNum) && priceNum > 0 && (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Margin</dt>
            <dd className="font-medium tabular-nums">
              {(((priceNum - purchaseNum) / priceNum) * 100).toFixed(1)}%
            </dd>
          </div>
        )}
      </dl>
    </div>
  )
}

export function ProductEditorShell({
  title,
  description,
  summary,
  children,
  footer,
  className,
}: ProductEditorShellProps) {
  return (
    <div className={cn("mx-auto max-w-[1120px] space-y-4", className)}>
      <div className="border-b border-border pb-4">
        <h1 className="text-[22px] font-semibold leading-7 text-foreground sm:text-2xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">
        <Panel>
          <PanelBody className="space-y-0">{children}</PanelBody>
          <div className="sticky bottom-0 border-t border-border bg-card px-4 py-3 sm:px-5">{footer}</div>
        </Panel>

        <aside className="space-y-3">
          <details className="group rounded-lg border border-border bg-card lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold">
              Review summary
              <ChevronDown className="h-4 w-4 text-muted-foreground transition group-open:rotate-180" />
            </summary>
            <div className="border-t border-border px-4 py-4">
              <SummaryContent summary={summary} />
            </div>
          </details>

          <Panel className="sticky top-20 hidden lg:block">
            <PanelHeader>
              <h2 className="text-sm font-semibold text-foreground">Summary</h2>
            </PanelHeader>
            <PanelBody>
              <SummaryContent summary={summary} />
            </PanelBody>
          </Panel>
        </aside>
      </div>
    </div>
  )
}
