"use client"

import { CalendarDays } from "lucide-react"

import { QuotationPeriodFields } from "@/components/quotations/quotation-period-fields"
import { cn } from "@/lib/utils"

export { QUOTATION_MONTHS } from "@/lib/quotation-period"

interface QuotationPeriodSwitchProps {
  month: string
  year: string
  day: string
  years: number[]
  onMonthChange: (month: string) => void
  onYearChange: (year: string) => void
  onDayChange: (day: string) => void
  className?: string
}

export function QuotationPeriodSwitch({
  month,
  year,
  day,
  years,
  onMonthChange,
  onYearChange,
  onDayChange,
  className,
}: QuotationPeriodSwitchProps) {
  return (
    <div
      role="group"
      aria-label="Quotation period"
      className={cn(
        "inline-flex h-10 shrink-0 items-stretch overflow-hidden rounded-md border border-border bg-muted/50",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-r border-border px-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
        <CalendarDays className="h-3.5 w-3.5 text-[hsl(var(--kk-gold-hover))]" strokeWidth={1.8} aria-hidden />
        Period
      </div>
      <QuotationPeriodFields
        layout="inline"
        month={month}
        year={year}
        day={day}
        years={years}
        onMonthChange={onMonthChange}
        onYearChange={onYearChange}
        onDayChange={onDayChange}
      />
    </div>
  )
}
