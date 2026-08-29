"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Edit, Trash2, Users, Plus, Wifi, WifiOff, Shield, Globe, Settings } from "lucide-react"
import { useUserStatus } from "@/hooks/use-user-status"
import { type UserStatus, getStatusColor, getStatusText, getLastSeenText } from "@/lib/status-utils"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import IPAddressManager from "./ip-address-manager"

type UserWithMeta = UserStatus & {
  allowedIps?: string[]
  status?: string
}

const ROLE_CONFIG: Record<string, { label: string; className: string }> = {
  manager: { label: "Manager", className: "bg-indigo-50 text-indigo-700 border border-indigo-200" },
  rider: { label: "Rider", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  product_manager: { label: "Product Mgr", className: "bg-violet-50 text-violet-700 border border-violet-200" },
}

const AVATAR_GRADIENTS = [
  "from-indigo-500 to-violet-500",
  "from-emerald-500 to-teal-500",
  "from-sky-500 to-blue-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
]

export default function UserList() {
  const { users, loading, error, refetch } = useUserStatus()
  const { toast } = useToast()
  const { data: session } = useSession()
  const router = useRouter()
  const [selectedUser, setSelectedUser] = useState<UserWithMeta | null>(null)
  const [ipModalOpen, setIpModalOpen] = useState(false)
  const [updatingIPs, setUpdatingIPs] = useState(false)

  const handleEdit = (userId: string) => router.push(`/users/edit/${userId}`)

  const deleteUser = async (user: UserWithMeta) => {
    if (!confirm(`Remove "${user.name}" from the workspace?`)) return
    try {
      const response = await fetch(`/api/users/${user._id}`, { method: "DELETE" })
      if (response.ok) {
        refetch()
        toast({ title: "User removed", description: `${user.name} has been deleted.` })
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete user", variant: "destructive" })
    }
  }

  const handleManageIPs = (user: UserWithMeta) => {
    setSelectedUser(user)
    setIpModalOpen(true)
  }

  const updateUserIPs = async (newIPs: string[]) => {
    if (!selectedUser) return
    setUpdatingIPs(true)
    try {
      const response = await fetch(`/api/users/${selectedUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedUser.name,
          email: selectedUser.email,
          role: selectedUser.role,
          contact: selectedUser.contact,
          allowedIps: newIPs,
        }),
      })
      if (response.ok) {
        toast({ title: "IP addresses updated" })
        setIpModalOpen(false)
        refetch()
      } else throw new Error()
    } catch {
      toast({ title: "Error", description: "Failed to update IP addresses", variant: "destructive" })
    } finally {
      setUpdatingIPs(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Summary bar skeleton */}
        <div className="h-14 animate-pulse rounded-xl border border-gray-200 bg-white" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-11 w-11 rounded-full bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-28 rounded bg-gray-100" />
                  <div className="h-3 w-36 rounded bg-gray-100" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-gray-100" />
                <div className="h-3 w-4/5 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-sm text-red-600">Failed to load users: {error}</p>
        <Button onClick={refetch} variant="outline" size="sm">Retry</Button>
      </div>
    )
  }

  const onlineCount = users.filter((u) => u.isOnline).length

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3.5" style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.04)" }}>
        <p className="text-sm font-semibold text-gray-900">
          {users.length} {users.length === 1 ? "member" : "members"}
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-100" />
            <span className="text-xs font-medium text-gray-700">{onlineCount} online</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
            <span className="text-xs font-medium text-gray-500">{users.length - onlineCount} offline</span>
          </div>
        </div>
      </div>

      {/* User cards grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(users as UserWithMeta[]).map((user, idx) => {
          const roleConfig = ROLE_CONFIG[user.role] ?? { label: user.role, className: "bg-gray-100 text-gray-700 border border-gray-200" }
          const gradient = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]

          return (
            <Card
              key={user._id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:border-gray-300"
              style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}
            >
              <CardContent className="p-5">
                {/* User row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar with online indicator */}
                    <div className="relative shrink-0">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-sm font-bold text-white`}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white",
                          user.isOnline ? "bg-emerald-400" : "bg-gray-300",
                        )}
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="truncate text-xs text-gray-500">{user.email}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        {user.isOnline ? (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            <span className="text-[11px] font-medium text-emerald-600">Online</span>
                          </>
                        ) : (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                            <span className="text-[11px] text-gray-400">
                              {user.lastSeen ? getLastSeenText(user.lastSeen) : "Offline"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Role badge */}
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${roleConfig.className}`}>
                    {roleConfig.label}
                  </span>
                </div>

                {/* Details */}
                <div className="mb-4 space-y-2 rounded-lg border border-gray-100 bg-gray-50/70 p-3">
                  {user.contact && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Contact</span>
                      <span className="text-xs text-gray-700">{user.contact}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">IP Access</span>
                    <span className="text-xs text-gray-700">
                      {!user.allowedIps || user.allowedIps.length === 0 ? (
                        <span className="text-red-500">None configured</span>
                      ) : user.allowedIps.includes("*") ? (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <Globe className="h-3 w-3" /> All IPs
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-indigo-600">
                          <Shield className="h-3 w-3" /> {user.allowedIps.length} IP{user.allowedIps.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Joined</span>
                    <span className="text-xs text-gray-700">
                      {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Dialog open={ipModalOpen} onOpenChange={setIpModalOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleManageIPs(user)}
                        className="h-8 flex-1 rounded-lg text-xs font-medium hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                        title="Manage IP addresses"
                      >
                        <Settings className="mr-1.5 h-3.5 w-3.5" />
                        IPs
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl rounded-xl">
                      <DialogHeader>
                        <DialogTitle className="text-base font-semibold">
                          Manage IP Addresses — {selectedUser?.name}
                        </DialogTitle>
                      </DialogHeader>
                      {selectedUser && (
                        <IPAddressManager
                          allowedIps={selectedUser.allowedIps || ["*"]}
                          onChange={updateUserIPs}
                          disabled={updatingIPs}
                        />
                      )}
                    </DialogContent>
                  </Dialog>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(user._id)}
                    className="h-8 flex-1 rounded-lg text-xs font-medium hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                    title="Edit user"
                  >
                    <Edit className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteUser(user)}
                    className="h-8 w-8 shrink-0 rounded-lg p-0 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    title="Delete user"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {users.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <Users className="h-7 w-7 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">No users yet</p>
              <p className="mt-1 text-xs text-gray-500">Add your first team member to get started.</p>
            </div>
            <Button onClick={() => router.push("/users/add")} size="sm" className="mt-2 h-9 rounded-lg">
              <Plus className="mr-2 h-3.5 w-3.5" /> Add user
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
