"use client"

import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, Bell, Search, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const pageNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/products": "Products",
  "/quotations": "Quotations",
  "/users": "Users",
  "/logs": "Activity Logs",
}

const quickActions: Record<string, { href: string; label: string; icon: any }> = {
  "/products": { href: "/products/add", label: "Add Product", icon: Plus },
  "/quotations": { href: "/quotations/create", label: "New Quote", icon: Plus },
  "/users": { href: "/users/add", label: "Add User", icon: Plus },
}

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session || pathname.startsWith("/auth")) {
    return null
  }

  const pageName = pageNames[pathname] || "Portal"
  const quickAction = quickActions[pathname]
  const currentTime = new Date().toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
      {/* Mobile Header */}
      <div className="lg:hidden px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" onClick={onMenuClick} className="hover:bg-gray-100 h-10 w-10">
              <Menu className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{pageName}</h1>
              <p className="text-xs text-gray-500">{currentTime}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quick Action Button */}
            {quickAction && session.user.role === "manager" && (
              <Link href={quickAction.href}>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-9 px-3">
                  <quickAction.icon className="h-4 w-4" />
                </Button>
              </Link>
            )}


            {/* User Avatar */}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">{session.user.name?.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="mt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors h-10"
            />
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{pageName}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {new Date().toLocaleString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products, quotations..."
                className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
              />
            </div>

            {/* Quick Action */}
            {quickAction && session.user.role === "manager" && (
              <Link href={quickAction.href}>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <quickAction.icon className="mr-2 h-4 w-4" />
                  {quickAction.label}
                </Button>
              </Link>
            )}


            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{session.user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{session.user.role}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">{session.user.name?.charAt(0).toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
