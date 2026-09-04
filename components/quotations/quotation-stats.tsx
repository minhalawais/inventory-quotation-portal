"use client"

import { Clock, FileText, Undo2 } from "lucide-react"

import { Metric } from "@/components/shared/metric"
import { cn } from "@/lib/utils"

interface QuotationStatsProps {
  total: number
  pending: number
  returned: number
  periodLabel: string
  activeStatus: string
  onSelect: (status: "all" | "pending" | "returned") => void
}

export function QuotationStats({
  total,
  pending,
  returned,
  periodLabel,
  activeStatus,
  onSelect,
}: QuotationStatsProps) {
  const cards = [
    {
      key: "all" as const,
      label: "Total",
      value: total,
      icon: FileText,
    },
    {
      key: "pending" as const,
      label: "Pending",
      value: pending,
      icon: Clock,
    },
    {
      key: "returned" as const,
      label: "Returned",
      value: returned,
      icon: Undo2,
    },
  ]

  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 snap-x snap-mandatory md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0">
      {cards.map((card) => {
        const selected = activeStatus === card.key
        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onSelect(card.key)}
            className="min-w-[128px] shrink-0 snap-start text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:min-w-0"
            aria-pressed={selected}
          >
            <Metric
              label={card.label}
              value={card.value.toLocaleString()}
              detail={periodLabel}
              icon={card.icon}
              className={cn(
                selected && "border-foreground",
                "p-3 md:p-4 [&_p:nth-child(2)]:text-xl md:[&_p:nth-child(2)]:text-2xl [&_p:last-child]:hidden md:[&_p:last-child]:block",
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
