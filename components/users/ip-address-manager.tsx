"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { isValidIP } from "@/lib/ip-utils"
import { useToast } from "@/hooks/use-toast"

interface IPAddressManagerProps {
  allowedIps: string[]
  onChange: (ips: string[]) => void
  disabled?: boolean
}

export default function IPAddressManager({ allowedIps, onChange, disabled = false }: IPAddressManagerProps) {
  const [newIP, setNewIP] = useState("")
  const [restrictOverride, setRestrictOverride] = useState(false)
  const { toast } = useToast()

  const specificIps = allowedIps.filter((ip) => ip !== "*")
  const allowAny = !restrictOverride && allowedIps.includes("*")

  useEffect(() => {
    if (!allowedIps.includes("*")) {
      setRestrictOverride(false)
    }
  }, [allowedIps])

  const setAllowAny = (enabled: boolean) => {
    if (enabled) {
      setRestrictOverride(false)
      onChange(["*"])
      setNewIP("")
      return
    }

    setRestrictOverride(true)
    if (specificIps.length > 0) {
      onChange(specificIps)
    }
    // If there are no specific IPs yet, keep parent at `*` until the first address is added.
  }

  const addIP = () => {
    const value = newIP.trim()
    if (!value) return

    if (!isValidIP(value)) {
      toast({
        title: "Invalid IP",
        description: "Use an IPv4 address, CIDR range, or *.",
        variant: "destructive",
      })
      return
    }

    if (value === "*") {
      setRestrictOverride(false)
      onChange(["*"])
      setNewIP("")
      return
    }

    if (allowAny || allowedIps.includes(value) || specificIps.includes(value)) {
      toast({
        title: "Duplicate IP",
        description: allowAny
          ? "Turn off Allow any IP before adding specific addresses."
          : "This address is already listed.",
        variant: "destructive",
      })
      return
    }

    setRestrictOverride(false)
    onChange([...specificIps, value])
    setNewIP("")
  }

  const removeIP = (ipToRemove: string) => {
    const updatedIps = specificIps.filter((ip) => ip !== ipToRemove)
    if (updatedIps.length === 0) {
      setRestrictOverride(false)
      onChange(["*"])
      return
    }
    onChange(updatedIps)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addIP()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
        <div className="min-w-0">
          <Label htmlFor="allow-any-ip" className="text-sm font-medium">
            Allow any IP
          </Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            When on, this account can sign in from any network address.
          </p>
        </div>
        <Switch
          id="allow-any-ip"
          checked={allowAny}
          onCheckedChange={setAllowAny}
          disabled={disabled}
          aria-label="Allow any IP"
        />
      </div>

      {!allowAny && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              <Label htmlFor="newIP" className="sr-only">
                IP address
              </Label>
              <Input
                id="newIP"
                placeholder="192.168.1.100 or 192.168.1.0/24"
                value={newIP}
                onChange={(e) => setNewIP(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className="h-10 font-mono text-sm"
              />
            </div>
            <Button type="button" onClick={addIP} disabled={disabled || !newIP.trim()} className="h-10 shrink-0">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Allowed addresses</p>
            {specificIps.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {specificIps.map((ip) => (
                  <span
                    key={ip}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 font-mono text-xs text-foreground"
                  >
                    {ip}
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => removeIP(ip)}
                        className="rounded text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${ip}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No addresses yet. Add at least one, or enable Allow any IP.
              </p>
            )}
          </div>
        </div>
      )}

      <p className="text-xs leading-5 text-muted-foreground">
        Examples: <code className="font-mono text-foreground">192.168.1.100</code>,{" "}
        <code className="font-mono text-foreground">192.168.1.0/24</code>,{" "}
        <code className="font-mono text-foreground">10.0.0.0/8</code>
      </p>
    </div>
  )
}
