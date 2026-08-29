"use client"

import { Button } from "@/components/ui/button"
import { ShieldOff } from "lucide-react"
import { signOut } from "next-auth/react"
import { BrandMark } from "@/components/brand-mark"

export default function InactivePage() {
  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" })
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center p-6"
      style={{ background: "hsl(222, 47%, 9%)" }}
    >
      {/* Brand */}
      <div className="mb-12">
        <BrandMark inverse />
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
          <ShieldOff className="h-7 w-7 text-red-400" />
        </div>

        <h1 className="text-lg font-bold text-white tracking-tight mb-2">Account deactivated</h1>
        <p className="text-sm text-gray-400 leading-relaxed mb-6">
          This account has been deactivated by an administrator. Contact your system administrator
          to restore access.
        </p>

        <Button
          onClick={handleSignOut}
          className="w-full h-10 rounded-lg font-semibold bg-white text-gray-950 hover:bg-gray-100 transition-colors"
        >
          Return to sign in
        </Button>
      </div>

      <p className="mt-8 text-xs text-gray-600">InventoryOS · Authorized access only</p>
    </div>
  )
}
