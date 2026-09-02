import type { ReactNode } from "react"

import { Panel } from "@/components/shared/panel"
import { cn } from "@/lib/utils"

interface ResponsiveRecordListProps {
  table: ReactNode
  cards: ReactNode
  className?: string
}

/** Desktop table + mobile card stack without squeezing the table. */
export function ResponsiveRecordList({ table, cards, className }: ResponsiveRecordListProps) {
  return (
    <div className={cn(className)}>
      <Panel className="hidden overflow-hidden md:block">{table}</Panel>
      <div className="space-y-3 md:hidden">{cards}</div>
    </div>
  )
}
