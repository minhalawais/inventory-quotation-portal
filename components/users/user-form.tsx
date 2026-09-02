"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { logActivity } from "@/lib/logger"
import { FormSection, FormActions } from "@/components/shared/form-section"
import { Panel, PanelBody } from "@/components/shared/panel"
import IPAddressManager from "./ip-address-manager"

const ROLE_OPTIONS = [
  {
    value: "manager",
    label: "Manager",
    description: "Dashboard, users, products, quotations, and activity logs.",
  },
  {
    value: "rider",
    label: "Rider",
    description: "Products, stock exceptions, and assigned quotations.",
  },
  {
    value: "product_manager",
    label: "Product Manager",
    description: "Products and stock exceptions only.",
  },
] as const

export default function UserForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    contact: "",
    status: "active",
    allowedIps: ["*"],
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()

  const selectedRole = ROLE_OPTIONS.find((role) => role.value === formData.role)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Enter the same password in both fields.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          contact: formData.contact,
          allowedIps: formData.allowedIps,
        }),
      })

      if (response.ok) {
        if (session) {
          await logActivity({
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: "CREATE",
            resource: "User",
            details: `Created new user: ${formData.name} (${formData.role})`,
            status: "success",
          })
        }

        toast({
          title: "User created",
          description: `${formData.name} can now sign in.`,
        })
        router.push("/users")
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create user")
      }
    } catch (error) {
      if (session) {
        await logActivity({
          userId: session.user.id,
          userName: session.user.name,
          userRole: session.user.role,
          action: "CREATE",
          resource: "User",
          details: `Failed to create user: ${formData.name}`,
          status: "error",
        })
      }

      toast({
        title: "Could not create user",
        description: error instanceof Error ? error.message : "Failed to create user",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-[840px]">
      <Panel>
        <PanelBody className="space-y-0">
          <FormSection title="Account profile" description="Name and sign-in email.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="h-10"
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-10"
                  placeholder="name@example.com"
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="Role and status" className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger id="role" className="h-10">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRole && <p className="text-xs text-muted-foreground">{selectedRole.description}</p>}
            </div>
          </FormSection>

          <FormSection title="Contact" className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="contact">Contact number</Label>
              <Input
                id="contact"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                className="h-10"
                placeholder="Optional phone number"
              />
            </div>
          </FormSection>

          <FormSection
            title="Network access"
            description="Limit sign-in to allowed IP addresses."
            className="pt-6"
          >
            <IPAddressManager
              allowedIps={formData.allowedIps}
              onChange={(ips) => setFormData({ ...formData, allowedIps: ips })}
              disabled={loading}
            />
          </FormSection>

          <FormSection title="Password" description="Minimum 6 characters." className="pt-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="h-10"
                  placeholder="Enter password"
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className="h-10"
                  placeholder="Confirm password"
                  minLength={6}
                />
              </div>
            </div>
          </FormSection>
        </PanelBody>

        <div className="border-t border-border px-4 py-3 sm:px-5">
          <FormActions className="border-0 pt-0">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.role}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create user"
              )}
            </Button>
          </FormActions>
        </div>
      </Panel>
    </form>
  )
}
