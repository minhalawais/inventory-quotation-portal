"use client"

import { CalendarDays } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export const QUOTATION_MONTHS = Array.from({ length: 12 }, (_, month) => ({
  value: String(month),
  label: new Intl.DateTimeFormat("en", { month: "short" }).format(new Date(2020, month, 1)),
}))

const triggerClass =
  "h-10 w-auto rounded-none border-0 bg-transparent px-2.5 shadow-none focus:border-0 focus:ring-0 focus:ring-offset-0"

interface QuotationPeriodSwitchProps {
  month: string
  year: string
  years: number[]
  onMonthChange: (month: string) => void
  onYearChange: (year: string) => void
  className?: string
}

export function QuotationPeriodSwitch({
  month,
  year,
  years,
  onMonthChange,
  onYearChange,
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
      <Select value={month} onValueChange={onMonthChange}>
        <SelectTrigger className={cn(triggerClass, "min-w-[92px] font-medium")} aria-label="Month">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="all">All months</SelectItem>
          {QUOTATION_MONTHS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="my-2 w-px bg-border" aria-hidden />
      <Select value={year} onValueChange={onYearChange}>
        <SelectTrigger className={cn(triggerClass, "min-w-[76px] font-medium tabular-nums")} aria-label="Year">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {years.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
