export const QUOTATION_MONTHS = Array.from({ length: 12 }, (_, month) => ({
  value: String(month),
  label: new Intl.DateTimeFormat("en", { month: "short" }).format(new Date(2020, month, 1)),
}))

export interface QuotationPeriodFilters {
  year: string
  month: string
  day: string
}

export function getQuotationPeriodParts(createdAt: string) {
  const date = new Date(createdAt)
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
  }
}

export function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

export function getDayOptions(year: string, month: string) {
  if (month === "all") return []
  const yearNum = Number.parseInt(year, 10)
  const monthNum = Number.parseInt(month, 10)
  if (!Number.isFinite(yearNum) || !Number.isFinite(monthNum)) return []

  const count = daysInMonth(yearNum, monthNum)
  return Array.from({ length: count }, (_, index) => index + 1)
}

export function isDayValidForPeriod(day: string, year: string, month: string) {
  if (day === "all") return true
  if (month === "all") return false

  const dayNum = Number.parseInt(day, 10)
  const options = getDayOptions(year, month)
  return options.includes(dayNum)
}

export function matchesQuotationPeriod(createdAt: string, filters: QuotationPeriodFilters) {
  const parts = getQuotationPeriodParts(createdAt)
  const year = Number.parseInt(filters.year, 10)

  if (parts.year !== year) return false
  if (filters.month !== "all" && parts.month !== Number.parseInt(filters.month, 10)) return false
  if (filters.day !== "all" && parts.day !== Number.parseInt(filters.day, 10)) return false

  return true
}

export function formatQuotationPeriodLabel(filters: QuotationPeriodFilters) {
  const { year, month, day } = filters

  if (day !== "all" && month !== "all") {
    const monthLabel = QUOTATION_MONTHS[Number.parseInt(month, 10)]?.label
    return `on ${monthLabel} ${day}, ${year}`
  }

  if (month === "all") return `in ${year}`

  const monthLabel = QUOTATION_MONTHS[Number.parseInt(month, 10)]?.label
  return `in ${monthLabel} ${year}`
}

/** Compact label for mobile filter chip, e.g. "Sep 2026 · All days" */
export function formatQuotationPeriodChipLabel(filters: QuotationPeriodFilters) {
  const { year, month, day } = filters

  if (day !== "all" && month !== "all") {
    const monthLabel = QUOTATION_MONTHS[Number.parseInt(month, 10)]?.label
    return `${monthLabel} ${day}, ${year}`
  }

  if (month === "all") return `${year} · All months`

  const monthLabel = QUOTATION_MONTHS[Number.parseInt(month, 10)]?.label
  if (day === "all") return `${monthLabel} ${year} · All days`

  return `${monthLabel} ${day}, ${year}`
}
