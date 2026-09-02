"use client"

import { signOut } from "next-auth/react"
import { ShieldOff } from "lucide-react"

import { SystemStatePage } from "@/components/system-state-page"
import { Button } from "@/components/ui/button"

export default function InactivePage() {
  return (
    <SystemStatePage
      icon={ShieldOff}
      tone="danger"
      title="Account deactivated"
      description="This account has been deactivated by an administrator. Contact your KK Sports administrator to restore access."
      footer="KK Sports Operations - authorized access only"
    >
      <Button onClick={() => signOut({ callbackUrl: "/auth/signin" })} className="w-full">
        Return to sign in
      </Button>
    </SystemStatePage>
  )
}
