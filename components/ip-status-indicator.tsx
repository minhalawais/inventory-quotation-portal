"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Shield, Globe, AlertTriangle } from "lucide-react"
import { useSession } from "next-auth/react"

interface IPStatus {
  currentIP: string
  allowedIPs: string[]
  isAllowed: boolean
}

export default function IPStatusIndicator() {
  const { data: session } = useSession()
  const [ipStatus, setIpStatus] = useState<IPStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session) {
      checkIPStatus()
    }
  }, [session])

  const checkIPStatus = async () => {
    try {
      const response = await fetch("/api/check-ip")
      if (response.ok) {
        const data = await response.json()
        setIpStatus(data)
      }
    } catch (error) {
      console.error("Failed to check IP status:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!session || loading) {
    return null
  }

  if (!ipStatus) {
    return (
      <Badge variant="secondary" className="text-xs">
        <AlertTriangle className="h-3 w-3 mr-1" />
        IP Status Unknown
      </Badge>
    )
  }

  if (!ipStatus.isAllowed) {
    return (
      <Badge variant="destructive" className="text-xs">
        <Shield className="h-3 w-3 mr-1" />
        IP Restricted
      </Badge>
    )
  }

  if (ipStatus.allowedIPs.includes("*")) {
    return (
      <Badge variant="secondary" className="text-xs">
        <Globe className="h-3 w-3 mr-1" />
        All IPs Allowed
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="text-xs">
      <Shield className="h-3 w-3 mr-1" />
      IP: {ipStatus.currentIP}
    </Badge>
  )
}
