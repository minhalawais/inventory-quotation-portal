"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
import { Skeleton } from "@/components/ui/skeleton"
import IPAddressManager from "./ip-address-manager"

interface EditUserFormProps {
  userId: string
}

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

export default function EditUserForm({ userId }: EditUserFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    contact: "",
    password: "",
    confirmPassword: "",
    status: "",
    allowedIps: ["*"],
  })
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()

  const selectedRole = ROLE_OPTIONS.find((role) => role.value === formData.role)

  useEffect(() => {
    fetchUser()
  }, [userId])

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`)
      if (response.ok) {
        const user: any = await response.json()
        setFormData({
          name: user.name,
          email: user.email,
          role: user.role,
          contact: user.contact || "",
          password: "",
          confirmPassword: "",
          status: user.status || "active",
          allowedIps: user.allowedIps || ["*"],
        })
      } else {
        toast({
          title: "User not found",
          description: "This account may have been removed.",
          variant: "destructive",
        })
        router.push("/users")
      }
    } catch {
      toast({
        title: "Could not load user",
        description: "Failed to fetch user",
        variant: "destructive",
      })
    } finally {
      setFetchLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Enter the same password in both fields.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        contact: formData.contact,
        allowedIps: formData.allowedIps,
        status: formData.status,
      }

      if (formData.password) {
        updateData.password = formData.password
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        if (session) {
          await logActivity({
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: "UPDATE",
            resource: "User",
            resourceId: userId,
            details: `Updated user: ${formData.name} (${formData.role})`,
            status: "success",
          })
        }

        toast({
          title: "User updated",
          description: `Changes to ${formData.name} were saved.`,
        })
        router.push("/users")
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update user")
      }
    } catch (error) {
      if (session) {
        await logActivity({
          userId: session.user.id,
          userName: session.user.name,
          userRole: session.user.role,
          action: "UPDATE",
          resource: "User",
          resourceId: userId,
          details: `Failed to update user: ${formData.name}`,
          status: "error",
        })
      }

      toast({
        title: "Could not update user",
        description: error instanceof Error ? error.message : "Failed to update user",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="mx-auto max-w-[840px]">
        <Panel>
          <PanelBody className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </PanelBody>
        </Panel>
      </div>
    )
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <div className="space-y-2">
                <Label htmlFor="status">Account status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status" className="h-10">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

          <FormSection
            title="Password"
            description="Leave blank to keep the current password."
            className="pt-6 opacity-90"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-muted-foreground">
                  New password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="h-10"
                  placeholder="Optional"
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-muted-foreground">
                  Confirm new password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="h-10"
                  placeholder="Optional"
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
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </FormActions>
        </div>
      </Panel>
    </form>
  )
}
