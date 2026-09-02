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
      label: "Total quotations",
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
    <div className="grid grid-cols-3 gap-3">
      {cards.map((card) => {
        const selected = activeStatus === card.key
        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onSelect(card.key)}
            className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-pressed={selected}
          >
            <Metric
              label={card.label}
              value={card.value.toLocaleString()}
              detail={periodLabel}
              icon={card.icon}
              className={cn(selected && "border-foreground")}
            />
          </button>
        )
      })}
    </div>
  )
}
