interface BrandMarkProps {
  compact?: boolean
  inverse?: boolean
}

export function BrandMark({ compact = false, inverse = false }: BrandMarkProps) {
  return (
    <div className="flex min-w-0 items-center gap-3" aria-label="InventoryOS home">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border ${
          inverse ? "border-white/15 bg-white/10 text-white" : "border-blue-200 bg-blue-600 text-white"
        }`}
      >
        <svg viewBox="0 0 36 36" className="h-6 w-6" fill="none" aria-hidden="true">
          <path d="M7.5 10.5 18 5l10.5 5.5L18 16 7.5 10.5Z" fill="currentColor" opacity=".98" />
          <path d="m7.5 14.3 8.5 4.45v10.1L7.5 24.4V14.3Z" fill="currentColor" opacity=".68" />
          <path d="m28.5 14.3-8.5 4.45v10.1l8.5-4.45V14.3Z" fill="currentColor" opacity=".38" />
        </svg>
      </div>
      {!compact && (
        <div className="min-w-0">
          <div className={`text-[15px] font-semibold leading-5 tracking-[-0.025em] ${inverse ? "text-white" : "text-gray-950"}`}>
            Inventory<span className={inverse ? "text-blue-400" : "text-blue-600"}>OS</span>
          </div>
          <div className={`text-[11px] leading-4 ${inverse ? "text-gray-400" : "text-gray-500"}`}>
            Commerce operations
          </div>
        </div>
      )}
    </div>
  )
}
