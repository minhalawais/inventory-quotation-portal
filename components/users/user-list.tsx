"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

export default function UserList() {
  const { users, loading, error, refetch } = useUserStatus()
  const { toast } = useToast()
  const { data: session } = useSession()
  const router = useRouter()
  const [selectedUser, setSelectedUser] = useState<UserStatus | null>(null)
  const [ipModalOpen, setIpModalOpen] = useState(false)
  const [updatingIPs, setUpdatingIPs] = useState(false)

  const handleEdit = (userId: string) => {
    router.push(`/users/edit/${userId}`)
  }

  const deleteUser = async (user: UserStatus) => {
    if (!confirm(`Are you sure you want to delete "${user.name}"?`)) return

    try {
      const response = await fetch(`/api/users/${user._id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        refetch() // Refresh the user list

        toast({
          title: "Success",
          description: "User deleted successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  const handleManageIPs = (user: UserStatus) => {
    setSelectedUser(user)
    setIpModalOpen(true)
  }

  const updateUserIPs = async (newIPs: string[]) => {
    if (!selectedUser) return

    setUpdatingIPs(true)
    try {
      const response = await fetch(`/api/users/${selectedUser._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: selectedUser.name,
          email: selectedUser.email,
          role: selectedUser.role,
          contact: selectedUser.contact,
          allowedIps: newIPs,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "IP addresses updated successfully",
        })
        setIpModalOpen(false)
        refetch() // Refresh the user list
      } else {
        throw new Error("Failed to update IP addresses")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update IP addresses",
        variant: "destructive",
      })
    } finally {
      setUpdatingIPs(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "manager":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "rider":
        return "bg-green-100 text-green-800 border-green-200"
      case "product_manager":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }
  const StatusBadge = ({ status }: { status: string }) => {
    return (
      <Badge
        variant={status === "active" ? "default" : "destructive"}
        className="text-xs"
      >
        {status === "active" ? "Active" : "Inactive"}
      </Badge>
    )
  }
  const UserIcon = ({ name }: { name: string }) => {
    return (
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
        <span className="text-white font-bold text-lg">{name.charAt(0).toUpperCase()}</span>
      </div>
    )
  }

  const StatusIndicator = ({ user }: { user: UserStatus }) => {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <div
            className={cn("w-2 h-2 rounded-full", user.isOnline ? "bg-green-400 animate-pulse" : "bg-gray-400")}
          ></div>
          <span className={cn("text-xs font-medium", user.isOnline ? "text-green-600" : "text-gray-500")}>
            {getStatusText(user.isOnline)}
          </span>
        </div>
        {!user.isOnline && user.lastSeen && (
          <span className="text-xs text-gray-400">{getLastSeenText(user.lastSeen)}</span>
        )}
      </div>
    )
  }

  const IPRestrictionBadge = ({ allowedIps }: { allowedIps: string[] }) => {
    if (!allowedIps || allowedIps.length === 0) {
      return (
        <Badge variant="destructive" className="text-xs">
          <Shield className="h-3 w-3 mr-1" />
          No IPs
        </Badge>
      )
    }

    if (allowedIps.includes("*")) {
      return (
        <Badge variant="secondary" className="text-xs">
          <Globe className="h-3 w-3 mr-1" />
          All IPs
        </Badge>
      )
    }

    return (
      <Badge variant="outline" className="text-xs">
        <Shield className="h-3 w-3 mr-1" />
        {allowedIps.length} IP{allowedIps.length !== 1 ? "s" : ""}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Error loading users: {error}</p>
        <Button onClick={refetch} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">User Status Overview</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-600">
                {users.filter((u) => u.isOnline).length} Online
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="text-sm font-medium text-gray-500">
                {users.filter((u) => !u.isOnline).length} Offline
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {users.map((user) => (
          <Card key={user._id} className="card-hover bg-white shadow-sm border-0">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <UserIcon name={user.name} />
                    <div
                      className={cn(
                        "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                        getStatusColor(user.isOnline),
                      )}
                    >
                      {user.isOnline ? (
                        <Wifi className="h-2 w-2 text-white m-0.5" />
                      ) : (
                        <WifiOff className="h-2 w-2 text-white m-0.5" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
                    <p className="text-sm text-gray-600 truncate">{user.email}</p>
                    <StatusIndicator user={user} />
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                  <StatusBadge status={user.status || "active"} />
                  <IPRestrictionBadge allowedIps={user.allowedIps || ["*"]} />
                </div>
              </div>

              {user.contact && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Contact:</span> {user.contact}
                  </p>
                </div>
              )}

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Allowed IPs:</span>{" "}
                  {user.allowedIps && user.allowedIps.length > 0 ? (
                    <span className="text-xs">
                      {user.allowedIps.includes("*")
                        ? "All IPs allowed"
                        : user.allowedIps.slice(0, 2).join(", ") +
                          (user.allowedIps.length > 2 ? ` +${user.allowedIps.length - 2} more` : "")}
                    </span>
                  ) : (
                    <span className="text-red-500 text-xs">No IPs configured</span>
                  )}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Joined {new Date(user.createdAt).toLocaleDateString()}</span>

                <div className="flex space-x-2">
                  <Dialog open={ipModalOpen} onOpenChange={setIpModalOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleManageIPs(user)}
                        className="hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-all duration-200"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Manage IP Addresses - {selectedUser?.name}</DialogTitle>
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
                    className="hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-all duration-200"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteUser(user)}
                    className="hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {users.length === 0 && (
          <div className="col-span-full">
            <Card className="p-8 lg:p-12 text-center bg-gradient-to-br from-gray-50 to-gray-100 border-dashed border-2 border-gray-300">
              <Users className="mx-auto h-12 w-12 lg:h-16 lg:w-16 text-gray-400 mb-4" />
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600 mb-4 lg:mb-6">Add your first user to get started.</p>
              <Button
                onClick={() => router.push("/users/add")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First User
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
