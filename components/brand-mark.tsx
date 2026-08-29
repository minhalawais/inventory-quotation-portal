import { Boxes } from "lucide-react"

interface BrandMarkProps {
  compact?: boolean
  inverse?: boolean
}

export function BrandMark({ compact = false, inverse = false }: BrandMarkProps) {
  return (
    <div className="flex min-w-0 items-center gap-3" aria-label="InventoryOS">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          inverse ? "bg-white text-gray-950" : "bg-gray-950 text-white"
        }`}
      >
        <Boxes className="h-5 w-5" strokeWidth={1.8} />
      </div>
      {!compact && (
        <div className="min-w-0">
          <div className={`text-[15px] font-semibold leading-5 ${inverse ? "text-white" : "text-gray-950"}`}>
            InventoryOS
          </div>
          <div className={`text-[11px] leading-4 ${inverse ? "text-gray-400" : "text-gray-500"}`}>
            Inventory & quotations
          </div>
        </div>
      )}
    </div>
  )
}
