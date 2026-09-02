import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** True when a click originated on a nested control, so the row should not open. */
export function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest(
      "a, button, input, select, textarea, label, [role='button'], [role='menuitem'], [role='checkbox'], [data-no-row-click]",
    ),
  )
}
