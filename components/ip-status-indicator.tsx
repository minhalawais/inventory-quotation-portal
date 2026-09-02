"use client"

import { useEffect, useState } from "react"
import { Globe, Shield } from "lucide-react"
import { useSession } from "next-auth/react"

import { StatusBadge } from "@/components/shared/status-badge"

interface IPStatus {
  currentIP: string
  allowedIPs: string[]
  isAllowed: boolean
}

export default function IPStatusIndicator() {
  const { data: session } = useSession()
  const [ipStatus, setIpStatus] = useState<IPStatus | null>(null)

  useEffect(() => {
    if (!session) return

    let cancelled = false

    const checkIPStatus = async () => {
      try {
        const response = await fetch("/api/check-ip")
        if (!response.ok) return
        const data = await response.json()
        if (cancelled) return
        setIpStatus({
          currentIP: data.currentIP ?? data.ip ?? "",
          allowedIPs: data.allowedIPs ?? session.user.allowedIps ?? ["*"],
          isAllowed: Boolean(data.isAllowed ?? data.allowed),
        })
      } catch (error) {
        console.error("Failed to check IP status:", error)
      }
    }

    void checkIPStatus()
    return () => {
      cancelled = true
    }
  }, [session])

  if (!session || !ipStatus) {
    return null
  }

  if (!ipStatus.isAllowed) {
    return (
      <StatusBadge tone="danger" showDot={false}>
        <Shield className="mr-1 h-3 w-3" />
        IP restricted
      </StatusBadge>
    )
  }

  if (ipStatus.allowedIPs.includes("*")) {
    return (
      <StatusBadge tone="neutral" showDot={false}>
        <Globe className="mr-1 h-3 w-3" />
        Any IP allowed
      </StatusBadge>
    )
  }

  return (
    <StatusBadge tone="success" showDot={false}>
      <Shield className="mr-1 h-3 w-3" />
      IP: {ipStatus.currentIP || "allowed"}
    </StatusBadge>
  )
}
