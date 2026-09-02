"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Edit, Trash2, Users, MoreHorizontal, Settings, Globe, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useUserStatus } from "@/hooks/use-user-status"
import { type UserStatus, getLastSeenText } from "@/lib/status-utils"
import { EmptyState, ErrorState } from "@/components/shared/empty-state"
import { RecordActions } from "@/components/shared/record-actions"
import { ResponsiveRecordList } from "@/components/shared/responsive-record-list"
import { StatusBadge } from "@/components/shared/status-badge"
import { Panel } from "@/components/shared/panel"
import IPAddressManager from "./ip-address-manager"

type UserWithMeta = UserStatus & {
  allowedIps?: string[]
  status?: string
}

const ROLE_LABELS: Record<string, string> = {
  manager: "Manager",
  rider: "Rider",
  product_manager: "Product Manager",
}

function formatIpSummary(allowedIps?: string[]) {
  if (!allowedIps || allowedIps.length === 0) {
    return { label: "None", tone: "danger" as const, icon: Shield }
  }
  if (allowedIps.includes("*")) {
    return { label: "Any IP", tone: "success" as const, icon: Globe }
  }
  return {
    label: `${allowedIps.length} IP${allowedIps.length === 1 ? "" : "s"}`,
    tone: "neutral" as const,
    icon: Shield,
  }
}

export default function UserList() {
  const { users, loading, error, refetch } = useUserStatus()
  const { toast } = useToast()
  const router = useRouter()
  const [detailUser, setDetailUser] = useState<UserWithMeta | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserWithMeta | null>(null)
  const [ipModalOpen, setIpModalOpen] = useState(false)
  const [updatingIPs, setUpdatingIPs] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<UserWithMeta | null>(null)

  const typedUsers = users as UserWithMeta[]
  const onlineCount = typedUsers.filter((u) => u.isOnline).length

  const handleEdit = (userId: string) => router.push(`/users/edit/${userId}`)

  const deleteUser = async (user: UserWithMeta) => {
    try {
      const response = await fetch(`/api/users/${user._id}`, { method: "DELETE" })
      if (response.ok) {
        refetch()
        toast({ title: "User removed", description: `${user.name} has been deleted.` })
        if (detailUser?._id === user._id) setDetailUser(null)
      }
    } catch {
      toast({ title: "Could not delete user", description: "Failed to delete user", variant: "destructive" })
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
        setSelectedUser((prev) => (prev ? { ...prev, allowedIps: newIPs } : prev))
        setDetailUser((prev) => (prev && prev._id === selectedUser._id ? { ...prev, allowedIps: newIPs } : prev))
        refetch()
      } else {
        throw new Error()
      }
    } catch {
      toast({
        title: "Could not update IPs",
        description: "Failed to update IP addresses",
        variant: "destructive",
      })
    } finally {
      setUpdatingIPs(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Panel className="hidden overflow-hidden md:block">
          <div className="divide-y divide-border">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex h-14 items-center gap-4 px-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="ml-auto h-4 w-20" />
              </div>
            ))}
          </div>
        </Panel>
        <div className="space-y-3 md:hidden">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Panel>
        <ErrorState
          icon={Users}
          title="Could not load users"
          description={error}
          actionLabel="Retry"
          onAction={() => void refetch()}
        />
      </Panel>
    )
  }

  const table = (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[28%]">User</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Account</TableHead>
          <TableHead>Presence</TableHead>
          <TableHead>IP access</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {typedUsers.map((user) => {
          const accountActive = (user.status || "active") === "active"
          const ip = formatIpSummary(user.allowedIps)
          return (
            <TableRow
              key={user._id}
              className="group cursor-pointer"
              onClick={() => setDetailUser(user)}
            >
              <TableCell>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-foreground">{ROLE_LABELS[user.role] ?? user.role}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">{user.contact || "—"}</span>
              </TableCell>
              <TableCell>
                <StatusBadge tone={accountActive ? "success" : "neutral"}>
                  {accountActive ? "Active" : "Inactive"}
                </StatusBadge>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <StatusBadge tone={user.isOnline ? "success" : "neutral"}>
                    {user.isOnline ? "Online" : "Offline"}
                  </StatusBadge>
                  {!user.isOnline && user.lastSeen && (
                    <p className="text-[11px] text-muted-foreground">{getLastSeenText(user.lastSeen)}</p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ip.icon className="h-3.5 w-3.5" aria-hidden />
                  {ip.label}
                </span>
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <RecordActions>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9"
                    onClick={() => handleEdit(user._id)}
                  >
                    <Edit className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="h-9 w-9" aria-label="More actions">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => setDetailUser(user)}>View details</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleManageIPs(user)}>
                        <Settings className="mr-2 h-3.5 w-3.5" />
                        Manage IPs
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(user._id)}>
                        <Edit className="mr-2 h-3.5 w-3.5" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteTarget(user)}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </RecordActions>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )

  const cards = typedUsers.map((user) => {
    const accountActive = (user.status || "active") === "active"
    const ip = formatIpSummary(user.allowedIps)
    return (
      <div key={user._id} className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-start justify-between gap-2">
          <button type="button" onClick={() => setDetailUser(user)} className="min-w-0 text-left">
            <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.email}</p>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" aria-label="Actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => setDetailUser(user)}>View details</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleManageIPs(user)}>
                <Settings className="mr-2 h-3.5 w-3.5" />
                Manage IPs
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(user._id)}>
                <Edit className="mr-2 h-3.5 w-3.5" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteTarget(user)}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">{ROLE_LABELS[user.role] ?? user.role}</span>
          <StatusBadge tone={accountActive ? "success" : "neutral"}>
            {accountActive ? "Active" : "Inactive"}
          </StatusBadge>
          <StatusBadge tone={user.isOnline ? "success" : "neutral"}>
            {user.isOnline ? "Online" : user.lastSeen ? getLastSeenText(user.lastSeen) : "Offline"}
          </StatusBadge>
        </div>
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <ip.icon className="h-3.5 w-3.5" aria-hidden />
          {ip.label}
        </p>
      </div>
    )
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <p>
          <span className="font-semibold tabular-nums text-foreground">{typedUsers.length}</span>{" "}
          {typedUsers.length === 1 ? "member" : "members"}
        </p>
        <p>
          <span className="font-semibold tabular-nums text-foreground">{onlineCount}</span> online ·{" "}
          <span className="font-semibold tabular-nums text-foreground">{typedUsers.length - onlineCount}</span> offline
        </p>
      </div>

      {typedUsers.length === 0 ? (
        <Panel>
          <EmptyState
            icon={Users}
            title="No users yet"
            description="Add a team member to grant portal access."
            actionLabel="Add user"
            onAction={() => router.push("/users/add")}
          />
        </Panel>
      ) : (
        <ResponsiveRecordList table={table} cards={cards} />
      )}

      <Sheet open={Boolean(detailUser)} onOpenChange={(open) => !open && setDetailUser(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          {detailUser && (
            <>
              <SheetHeader>
                <SheetTitle className="pr-6 text-left text-base">{detailUser.name}</SheetTitle>
                <SheetDescription className="text-left">{detailUser.email}</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5 text-sm">
                <dl className="space-y-3">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Role</dt>
                    <dd className="font-medium">{ROLE_LABELS[detailUser.role] ?? detailUser.role}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Contact</dt>
                    <dd className="font-medium">{detailUser.contact || "—"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Account</dt>
                    <dd>
                      <StatusBadge tone={(detailUser.status || "active") === "active" ? "success" : "neutral"}>
                        {(detailUser.status || "active") === "active" ? "Active" : "Inactive"}
                      </StatusBadge>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Presence</dt>
                    <dd className="text-right">
                      <StatusBadge tone={detailUser.isOnline ? "success" : "neutral"}>
                        {detailUser.isOnline ? "Online" : "Offline"}
                      </StatusBadge>
                      {!detailUser.isOnline && detailUser.lastSeen && (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {getLastSeenText(detailUser.lastSeen)}
                        </p>
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Joined</dt>
                    <dd className="font-medium">
                      {new Date(detailUser.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </dd>
                  </div>
                </dl>

                <div className="border-t border-border pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.04em] text-muted-foreground">
                    Allowed IPs
                  </p>
                  {!detailUser.allowedIps || detailUser.allowedIps.length === 0 ? (
                    <p className="text-sm text-destructive">None configured</p>
                  ) : detailUser.allowedIps.includes("*") ? (
                    <p className="text-sm text-foreground">Allow any IP</p>
                  ) : (
                    <ul className="space-y-1">
                      {detailUser.allowedIps.map((ip) => (
                        <li key={ip} className="font-mono text-xs text-foreground">
                          {ip}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => handleManageIPs(detailUser)}>
                    <Settings className="mr-1.5 h-3.5 w-3.5" />
                    Manage IPs
                  </Button>
                  <Button type="button" size="sm" onClick={() => handleEdit(detailUser._id)}>
                    <Edit className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={ipModalOpen} onOpenChange={setIpModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">
              Manage IP addresses{selectedUser ? ` — ${selectedUser.name}` : ""}
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

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-[440px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.name} will lose access to this workspace and their account record will be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) void deleteUser(deleteTarget)
                setDeleteTarget(null)
              }}
            >
              Remove user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
