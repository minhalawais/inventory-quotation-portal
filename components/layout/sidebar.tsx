"use client"

import { useSession, signOut } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Package, FileText, Users, LogOut, X, Activity, ShoppingCart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { useHeartbeat } from "@/hooks/use-heartbeat"
import { getStatusText } from "@/lib/status-utils"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["manager"],
    gradient: "from-blue-500 to-blue-600",
  },
  {
    name: "Products",
    href: "/products",
    icon: Package,
    roles: ["manager", "rider","product_manager"],
    gradient: "from-green-500 to-green-600",
  },
  {
    name: "Quotations",
    href: "/quotations",
    icon: FileText,
    roles: ["manager", "rider"],
    gradient: "from-purple-500 to-purple-600",
  },
  {
    name: "Users",
    href: "/users",
    icon: Users,
    roles: ["manager"],
    gradient: "from-orange-500 to-orange-600",
  },
  {
    name: "Activity Logs",
    href: "/logs",
    icon: Activity,
    roles: ["manager"],
    gradient: "from-red-500 to-red-600",
  },
]

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [currentUserStatus, setCurrentUserStatus] = useState(true) // Default to online

  useHeartbeat() // Start heartbeat when component mounts

  useEffect(() => {
    if (!session?.user?.id) return

    const fetchCurrentUserStatus = async () => {
      try {
        const response = await fetch("/api/users/status")
        if (response.ok) {
          const users = await response.json()
          const currentUser = users.find((user: any) => user._id === session.user.id)
          if (currentUser) {
            setCurrentUserStatus(currentUser.isOnline)
          }
        }
      } catch (error) {
        console.error("Failed to fetch current user status:", error)
      }
    }

    fetchCurrentUserStatus()
    const interval = setInterval(fetchCurrentUserStatus, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [session?.user?.id])

  if (!session) return null

  const filteredNavigation = navigation.filter((item) => item.roles.includes(session.user.role))

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" })
  }

  const handleNavClick = (href: string) => {
    setIsOpen(false)
    router.push(href)
  }

  return (
    <>
      {/* Sidebar - Mobile Optimized */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header - Mobile Optimized */}
          <div className="flex items-center justify-between h-20 px-6 bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="flex items-center space-x-3">
              {/* Updated Logo */}
              <div className="relative w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                <ShoppingCart className="h-7 w-7 text-blue-600" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Package className="h-2.5 w-2.5 text-white" />
                </div>
              </div>

              {/* Updated Text */}
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-white leading-tight">Inventory</h1>
                <p className="text-blue-100 text-sm font-medium leading-tight">Portal</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-white hover:bg-white/20 h-10 w-10"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* User Info - Enhanced for Mobile */}
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">{session?.user?.name?.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-gray-900 truncate">{session?.user?.name}</p>
                <p className="text-sm text-gray-600">{session?.user?.email}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge
                    variant={session?.user?.role === "manager" ? "default" : "secondary"}
                    className="text-xs font-semibold"
                  >
                    {session?.user?.role}
                  </Badge>
                  <div className="flex items-center space-x-1">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        currentUserStatus ? "bg-green-400 animate-pulse" : "bg-gray-400",
                      )}
                    ></div>
                    <span className={cn("text-xs font-medium", currentUserStatus ? "text-green-600" : "text-gray-500")}>
                      {getStatusText(currentUserStatus)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation - Mobile Optimized */}
          <nav className="flex-1 px-4 py-6 space-y-3 overflow-y-auto scrollbar-hide">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-4">Navigation</p>
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.href)}
                  className={cn(
                    "w-full group flex items-center px-4 py-4 text-base font-semibold rounded-2xl transition-all duration-300 transform",
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-500/30 scale-105"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:scale-105 active:scale-95",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-xl mr-4 transition-all duration-300",
                      isActive ? "bg-white/20 shadow-lg" : "bg-gray-200 group-hover:bg-gray-300 group-hover:shadow-md",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-6 w-6 transition-all duration-300",
                        isActive ? "text-white" : "text-gray-600 group-hover:text-gray-800",
                      )}
                    />
                  </div>
                  <span className="flex-1 text-left">{item.name}</span>
                  {isActive && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                    </div>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Footer - Enhanced for Mobile */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full justify-start h-12 text-base font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-300 rounded-xl bg-transparent"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>

            {/* App Version */}
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500">Version 1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
