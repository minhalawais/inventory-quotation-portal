"use client"

import { useEffect, useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import {
  Activity,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  PackageX,
  Users,
  X,
  ChevronRight,
} from "lucide-react"
import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getStatusText } from "@/lib/status-utils"
import { useHeartbeat } from "@/hooks/use-heartbeat"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["manager"] },
  { name: "Products", href: "/products", icon: Package, roles: ["manager", "rider", "product_manager"] },
  { name: "Stock exceptions", href: "/out-of-stock", icon: PackageX, roles: ["manager", "rider", "product_manager"] },
  { name: "Quotations", href: "/quotations", icon: FileText, roles: ["manager", "rider"] },
  { name: "Users", href: "/users", icon: Users, roles: ["manager"] },
  { name: "Activity Logs", href: "/logs", icon: Activity, roles: ["manager"] },
]

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [currentUserStatus, setCurrentUserStatus] = useState(true)

  useHeartbeat()

  useEffect(() => {
    if (!session?.user?.id) return
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/users/status")
        if (!response.ok) return
        const users = await response.json()
        const currentUser = users.find((user: any) => user._id === session.user.id)
        if (currentUser) setCurrentUserStatus(currentUser.isOnline)
      } catch (error) {
        console.error("Failed to fetch current user status:", error)
      }
    }
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [session?.user?.id])

  if (!session) return null

  const visibleNavigation = navigation.filter((item) => item.roles.includes(session.user.role))

  const roleLabel: Record<string, string> = {
    manager: "Manager",
    rider: "Sales Rider",
    product_manager: "Product Manager",
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-[252px] transform text-gray-300 transition-transform duration-200 ease-out lg:static lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
      style={{ background: "linear-gradient(180deg, hsl(var(--sidebar)) 0%, hsl(224 55% 8%) 100%)" }}
    >
      <div className="flex h-full flex-col">
        {/* Brand */}
        <div className="flex h-[72px] items-center justify-between border-b border-white/8 px-5">
          <BrandMark inverse />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:bg-white/8 hover:text-white lg:hidden h-8 w-8"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* User profile */}
        <div className="border-b border-white/8 px-4 py-4">
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.035] p-2.5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-blue-400/20 bg-blue-500/15 text-sm font-bold text-blue-300"
              >
                {session.user.name?.charAt(0).toUpperCase()}
              </div>
              {/* Online dot */}
              <span
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full border-2",
                  currentUserStatus
                    ? "border-[hsl(222,47%,9%)] bg-emerald-400"
                    : "border-[hsl(222,47%,9%)] bg-gray-500",
                )}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-white leading-tight">
                {session.user.name}
              </p>
              <p className="truncate text-[11px] text-gray-400 leading-tight mt-0.5">
                {roleLabel[session.user.role] ?? session.user.role}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="scrollbar-hide flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            Navigation
          </p>
          <div className="space-y-0.5">
            {visibleNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <button
                  key={item.name}
                  onClick={() => { setIsOpen(false); router.push(item.href) }}
                  className={cn(
                    "group relative flex h-10 w-full items-center rounded-lg px-3 text-[13px] font-medium transition-all duration-150",
                    isActive
                      ? "bg-blue-500/15 text-white shadow-[inset_0_0_0_1px_rgba(96,165,250,.12)]"
                      : "text-gray-400 hover:bg-white/6 hover:text-gray-200",
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-4 w-4 shrink-0",
                      isActive ? "text-blue-400" : "text-gray-500 group-hover:text-gray-400",
                    )}
                  />
                  <span className="flex-1 text-left">{item.name}</span>
                  {isActive && (
                    <ChevronRight className="h-3.5 w-3.5 text-blue-400" />
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Sign out */}
        <div className="border-t border-white/8 p-3">
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="flex h-9 w-full items-center gap-3 rounded-md px-3 text-[13px] font-medium text-gray-400 transition-all duration-150 hover:bg-white/6 hover:text-gray-200"
          >
            <LogOut className="h-4 w-4 shrink-0 text-gray-500" />
            Sign out
          </button>
          <p className="mt-3 px-3 text-[10px] tracking-wide text-gray-600">INVENTORYOS · SECURE WORKSPACE</p>
        </div>
      </div>
    </aside>
  )
}
