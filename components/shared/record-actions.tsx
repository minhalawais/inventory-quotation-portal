import type React from "react"

import { cn } from "@/lib/utils"

export function RecordActions({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center justify-end gap-1", className)} {...props} />
}
