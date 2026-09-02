"use client"

import type React from "react"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { NavigationProgress } from "@/components/layout/navigation-progress"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TooltipProvider delayDuration={300}>
        <NavigationProgress />
        {children}
        <Toaster />
      </TooltipProvider>
    </SessionProvider>
  )
}
