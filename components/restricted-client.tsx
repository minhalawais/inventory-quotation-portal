"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut, RefreshCw } from "lucide-react"

export function RestrictedActions() {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/auth/signin" })
  }

  const handleTryAgain = () => {
    window.location.reload()
  }

  return (
    <div className="space-y-3 pt-4">
      <Button onClick={handleTryAgain} variant="outline" className="w-full bg-transparent">
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>

      <Button onClick={handleSignOut} variant="destructive" className="w-full">
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  )
}
