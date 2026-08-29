"use client"

import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Menu, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

const pageNames: Record<string, { name: string; description: string }> = {
  "/dashboard": { name: "Dashboard", description: "Operations overview" },
  "/products": { name: "Products", description: "Inventory catalog" },
  "/products/add": { name: "Add product", description: "New catalog entry" },
  "/quotations": { name: "Quotations", description: "Customer quotes" },
  "/quotations/create": { name: "Create quotation", description: "New quote" },
  "/users": { name: "Users", description: "Team & access" },
  "/users/add": { name: "Add user", description: "New member" },
  "/logs": { name: "Activity logs", description: "Audit trail" },
  "/out-of-stock": { name: "Stock exceptions", description: "Unavailable items" },
}

const quickActions: Record<string, { href: string; label: string }> = {
  "/products": { href: "/products/add", label: "Add product" },
  "/quotations": { href: "/quotations/create", label: "New quotation" },
  "/users": { href: "/users/add", label: "Add user" },
}

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session || pathname.startsWith("/auth")) return null

  const page = pageNames[pathname]
    ?? (pathname.startsWith("/products/edit/") ? { name: "Edit product", description: "Catalog maintenance" } : undefined)
    ?? (pathname.startsWith("/users/edit/") ? { name: "Edit user", description: "Access management" } : undefined)
    ?? (pathname.startsWith("/quotations/") ? { name: "Quotation details", description: "Customer quote" } : undefined)
    ?? { name: "Workspace", description: "InventoryOS" }
  const quickAction = quickActions[pathname]
  const canCreate = session.user.role === "manager" || session.user.role === "product_manager"

  const initials = session.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "U"

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/88 backdrop-blur-xl">
      {/* Mobile header */}
      <div className="px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              aria-label="Open navigation"
              className="h-9 w-9 shrink-0 text-gray-600 hover:bg-gray-100"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-gray-950">{page.name}</h1>
              <p className="truncate text-[11px] text-gray-400">{page.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {quickAction && canCreate && (
              <Button size="sm" asChild aria-label={quickAction.label} className="h-8 w-8 p-0">
                <Link href={quickAction.href}><Plus className="h-4 w-4" /></Link>
              </Button>
            )}
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-blue-200 bg-blue-50 text-xs font-bold text-blue-700"
              title={session.user.name}
            >
              {initials}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden h-[72px] items-center justify-between gap-8 px-8 xl:px-10 lg:flex">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-600">InventoryOS</p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <h1 className="text-sm font-semibold leading-tight text-gray-950">{page.name}</h1>
            <span className="text-xs text-gray-400">/ {page.description}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {quickAction && canCreate && (
            <Button asChild size="sm" className="gap-1.5 font-medium h-9">
              <Link href={quickAction.href}>
                <Plus className="h-3.5 w-3.5" />
                {quickAction.label}
              </Link>
            </Button>
          )}

          {/* Separator + user info */}
          <div className="flex items-center gap-3 border-l border-gray-200 pl-4 ml-1">
            <div className="text-right">
              <p className="max-w-36 truncate text-[13px] font-medium text-gray-900 leading-tight">
                {session.user.name}
              </p>
              <p className="text-[11px] text-gray-400 capitalize leading-tight">
                {session.user.role.replace(/_/g, " ")}
              </p>
            </div>
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-blue-200 bg-blue-50 text-xs font-bold text-blue-700"
                title={session.user.name}
              >
              {initials}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
