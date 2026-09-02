"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { Activity, FileText, LayoutDashboard, LogOut, Package, PackageX, Users, X } from "lucide-react"

import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import { useHeartbeat } from "@/hooks/use-heartbeat"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["manager"] },
  { name: "Products", href: "/products", icon: Package, roles: ["manager", "rider", "product_manager"] },
  { name: "Stock exceptions", href: "/out-of-stock", icon: PackageX, roles: ["manager", "rider", "product_manager"] },
  { name: "Quotations", href: "/quotations", icon: FileText, roles: ["manager", "rider"] },
  { name: "Users", href: "/users", icon: Users, roles: ["manager"] },
  { name: "Activity logs", href: "/logs", icon: Activity, roles: ["manager"] },
]

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [currentUserStatus, setCurrentUserStatus] = useState(true)

  useHeartbeat()

  useEffect(() => {
    if (isOpen) window.setTimeout(() => closeButtonRef.current?.focus(), 0)
  }, [isOpen])

  useEffect(() => {
    if (!session?.user?.id) return

    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/users/status")
        if (!response.ok) return
        const users = await response.json()
        const currentUser = users.find((user: { _id: string; isOnline: boolean }) => user._id === session.user.id)
        if (currentUser) setCurrentUserStatus(currentUser.isOnline)
      } catch (error) {
        console.error("Failed to fetch current user status:", error)
      }
    }

    void fetchStatus()
    const interval = window.setInterval(fetchStatus, 30000)
    return () => window.clearInterval(interval)
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
      aria-label="Primary navigation"
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-[232px] transform bg-[hsl(var(--sidebar))] text-gray-300 transition-transform duration-200 ease-out lg:static lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.08] px-4">
          <BrandMark inverse />
          <Button
            ref={closeButtonRef}
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-9 w-9 text-white/65 hover:bg-white/[0.08] hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="scrollbar-hide flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.04em] text-white/35">Workspace</p>
          <div className="space-y-1">
            {visibleNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-white/[0.09] text-white before:absolute before:bottom-2 before:left-0 before:top-2 before:w-[3px] before:rounded-r before:bg-primary"
                      : "text-white/55 hover:bg-white/[0.06] hover:text-white",
                  )}
                >
                  <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-white/40")} strokeWidth={1.8} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="border-t border-white/[0.08] p-3">
          <div className="mb-2 flex items-center gap-3 rounded-md px-3 py-2">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/[0.09] text-xs font-bold text-white">
              {session.user.name?.charAt(0).toUpperCase()}
              <span
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[hsl(var(--sidebar))]",
                  currentUserStatus ? "bg-green-400" : "bg-gray-500",
                )}
                aria-label={currentUserStatus ? "Online" : "Offline"}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{session.user.name}</p>
              <p className="truncate text-[11px] text-white/40">{roleLabel[session.user.role] ?? session.user.role}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <LogOut className="h-4 w-4 text-white/40" />
            Sign out
          </button>
          <p className="mt-2 px-3 text-[10px] text-white/25">KK SPORTS OPERATIONS</p>
        </div>
      </div>
    </aside>
  )
}
