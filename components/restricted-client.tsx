"use client"

import { signOut } from "next-auth/react"
import { LogOut, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"

export function RestrictedActions() {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button type="button" onClick={() => window.location.reload()} className="flex-1">
        <RefreshCw className="h-4 w-4" />
        Try again
      </Button>
      <Button type="button" onClick={() => signOut({ callbackUrl: "/auth/signin" })} variant="outline" className="flex-1">
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </div>
  )
}
