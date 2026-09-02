import type { ButtonHTMLAttributes } from "react"

import { cn } from "@/lib/utils"

/** Primary open control for a table/card record. Use instead of a repeating View button. */
export function RecordOpenLink({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-sm text-left font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    />
  )
}
