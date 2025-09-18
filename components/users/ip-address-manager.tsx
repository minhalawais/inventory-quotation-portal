"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, X, Globe, Shield } from "lucide-react"
import { isValidIP } from "@/lib/ip-utils"
import { useToast } from "@/hooks/use-toast"

interface IPAddressManagerProps {
  allowedIps: string[]
  onChange: (ips: string[]) => void
  disabled?: boolean
}

export default function IPAddressManager({ allowedIps, onChange, disabled = false }: IPAddressManagerProps) {
  const [newIP, setNewIP] = useState("")
  const { toast } = useToast()

  const addIP = () => {
    if (!newIP.trim()) return

    if (!isValidIP(newIP.trim())) {
      toast({
        title: "Invalid IP Address",
        description: "Please enter a valid IP address, CIDR notation (e.g., 192.168.1.0/24), or * for all IPs",
        variant: "destructive",
      })
      return
    }

    if (allowedIps.includes(newIP.trim())) {
      toast({
        title: "Duplicate IP",
        description: "This IP address is already in the list",
        variant: "destructive",
      })
      return
    }

    const updatedIps = [...allowedIps, newIP.trim()]
    onChange(updatedIps)
    setNewIP("")
  }

  const removeIP = (ipToRemove: string) => {
    const updatedIps = allowedIps.filter((ip) => ip !== ipToRemove)
    // Ensure at least one IP remains (default to *)
    if (updatedIps.length === 0) {
      updatedIps.push("*")
    }
    onChange(updatedIps)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addIP()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Allowed IP Addresses</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage which IP addresses can access this user account. Use * to allow all IPs, specific IPs (192.168.1.1), or
          CIDR notation (192.168.1.0/24).
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <div className="flex-1">
            <Label htmlFor="newIP" className="sr-only">
              New IP Address
            </Label>
            <Input
              id="newIP"
              placeholder="Enter IP address (e.g., 192.168.1.1 or *)"
              value={newIP}
              onChange={(e) => setNewIP(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={disabled}
            />
          </div>
          <Button onClick={addIP} disabled={disabled || !newIP.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Current Allowed IPs:</Label>
          <div className="flex flex-wrap gap-2">
            {allowedIps.map((ip, index) => (
              <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                {ip === "*" ? <Globe className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                <span>{ip}</span>
                {!disabled && allowedIps.length > 1 && (
                  <button onClick={() => removeIP(ip)} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
          {allowedIps.length === 0 && <p className="text-sm text-muted-foreground">No IP addresses configured</p>}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>Examples:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <code>*</code> - Allow all IP addresses
            </li>
            <li>
              <code>192.168.1.100</code> - Allow specific IP
            </li>
            <li>
              <code>192.168.1.0/24</code> - Allow IP range (CIDR notation)
            </li>
            <li>
              <code>10.0.0.0/8</code> - Allow private network range
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
