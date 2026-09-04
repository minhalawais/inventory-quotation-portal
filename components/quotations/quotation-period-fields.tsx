"use client"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getDayOptions, QUOTATION_MONTHS } from "@/lib/quotation-period"
import { cn } from "@/lib/utils"

export interface QuotationPeriodFieldsProps {
  month: string
  year: string
  day: string
  years: number[]
  onMonthChange: (month: string) => void
  onYearChange: (year: string) => void
  onDayChange: (day: string) => void
  layout?: "inline" | "stacked"
  className?: string
}

const inlineTriggerClass =
  "h-10 w-auto rounded-none border-0 bg-transparent px-2.5 shadow-none focus:border-0 focus:ring-0 focus:ring-offset-0"

export function QuotationPeriodFields({
  month,
  year,
  day,
  years,
  onMonthChange,
  onYearChange,
  onDayChange,
  layout = "inline",
  className,
}: QuotationPeriodFieldsProps) {
  const dayOptions = getDayOptions(year, month)
  const stacked = layout === "stacked"

  const monthSelect = (
    <Select value={month} onValueChange={onMonthChange}>
      <SelectTrigger
        className={cn(stacked ? "h-10 w-full" : cn(inlineTriggerClass, "min-w-[92px] font-medium"))}
        aria-label="Month"
      >
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
  )

  const daySelect = (
    <Select value={day} onValueChange={onDayChange} disabled={month === "all"}>
      <SelectTrigger
        className={cn(
          stacked ? "h-10 w-full" : cn(inlineTriggerClass, "min-w-[72px] font-medium tabular-nums"),
          month === "all" && "opacity-60",
        )}
        aria-label="Day"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="all">All days</SelectItem>
        {dayOptions.map((option) => (
          <SelectItem key={option} value={String(option)}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  const yearSelect = (
    <Select value={year} onValueChange={onYearChange}>
      <SelectTrigger
        className={cn(
          stacked ? "h-10 w-full tabular-nums" : cn(inlineTriggerClass, "min-w-[76px] font-medium tabular-nums"),
        )}
        aria-label="Year"
      >
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
  )

  if (stacked) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Month</Label>
          {monthSelect}
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Day</Label>
          {daySelect}
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Year</Label>
          {yearSelect}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("contents", className)}>
      {monthSelect}
      <div className="my-2 w-px bg-border" aria-hidden />
      {daySelect}
      <div className="my-2 w-px bg-border" aria-hidden />
      {yearSelect}
    </div>
  )
}
