"use client"

import type React from "react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import Sidebar from "./sidebar"
import Header from "./header"
import { useState, useEffect } from "react"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isPublicQuotation = /^\/quotations\/[a-f\d]{24}\/?$/i.test(pathname)

  // Close sidebar when route changes (mobile navigation)
  useEffect(() => {
    closeSidebar(false)
    // Route changes should return focus to page content, not the old trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const closeSidebar = (restoreFocus = true) => {
    setSidebarOpen(false)
    if (restoreFocus) {
      window.setTimeout(() => document.getElementById("mobile-menu-trigger")?.focus(), 0)
    }
  }

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    if (!sidebarOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSidebar()
    }

    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [sidebarOpen])

  if (!session || pathname.startsWith("/auth") || pathname === "/restricted" || isPublicQuotation) {
    return <div className="min-h-screen bg-background">{children}</div>
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={(open) => (open ? setSidebarOpen(true) : closeSidebar())} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Main content with enhanced mobile spacing */}
        <main className="custom-scrollbar safe-area-bottom flex-1 overflow-auto">
          <div className="fade-in min-h-full px-4 py-5 sm:px-5 lg:px-6 lg:py-6">
            <div className="mx-auto max-w-[1480px]">{children}</div>
          </div>
        </main>
      </div>

      {/* Enhanced mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 cursor-default bg-black/60 lg:hidden"
          onClick={() => closeSidebar()}
        />
      )}
    </div>
  )
}
