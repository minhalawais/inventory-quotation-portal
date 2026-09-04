"use client"

import { useState } from "react"
import { CalendarDays, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { QuotationPeriodFields } from "@/components/quotations/quotation-period-fields"
import { formatQuotationPeriodChipLabel } from "@/lib/quotation-period"
import { cn } from "@/lib/utils"

interface QuotationPeriodMobileFilterProps {
  month: string
  year: string
  day: string
  years: number[]
  onMonthChange: (month: string) => void
  onYearChange: (year: string) => void
  onDayChange: (day: string) => void
  className?: string
}

export function QuotationPeriodMobileFilter({
  month,
  year,
  day,
  years,
  onMonthChange,
  onYearChange,
  onDayChange,
  className,
}: QuotationPeriodMobileFilterProps) {
  const [open, setOpen] = useState(false)
  const chipLabel = formatQuotationPeriodChipLabel({ month, year, day })

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className={cn("h-10 min-w-0 flex-1 justify-between gap-2 px-3 font-normal", className)}
        aria-label={`Period filter: ${chipLabel}`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-[hsl(var(--kk-gold-hover))]" strokeWidth={1.8} aria-hidden />
          <span className="truncate text-sm">{chipLabel}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      </Button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader className="border-b border-border pb-4 text-left">
            <DrawerTitle>Period</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 py-4">
            <QuotationPeriodFields
              layout="stacked"
              month={month}
              year={year}
              day={day}
              years={years}
              onMonthChange={onMonthChange}
              onYearChange={onYearChange}
              onDayChange={onDayChange}
            />
          </div>
          <DrawerFooter className="border-t border-border pt-4">
            <DrawerClose asChild>
              <Button type="button" className="h-10 w-full">
                Apply
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}
