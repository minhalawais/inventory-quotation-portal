"use client"

import { useState, useEffect } from "react"
import { Search, Download, Activity, RefreshCw, ChevronDown, ChevronUp } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { useToast } from "@/hooks/use-toast"
import { EmptyState } from "@/components/shared/empty-state"
import { ResponsiveRecordList } from "@/components/shared/responsive-record-list"
import { StatusBadge } from "@/components/shared/status-badge"
import { Toolbar, ToolbarGroup } from "@/components/shared/toolbar"
import { Panel } from "@/components/shared/panel"

interface ActivityLog {
  _id: string
  userId: string
  userName: string
  userRole: string
  action: string
  resource: string
  resourceId?: string
  details: string
  ipAddress: string
  userAgent: string
  timestamp: string
  status: "success" | "error" | "warning"
}

const ROLE_LABELS: Record<string, string> = {
  manager: "Manager",
  rider: "Rider",
  product_manager: "Product Mgr",
}

function statusTone(status: ActivityLog["status"]): "success" | "danger" | "warning" {
  if (status === "success") return "success"
  if (status === "error") return "danger"
  return "warning"
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatCompactTimestamp(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterAction, setFilterAction] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/logs")
      if (response.ok) setLogs(await response.json())
    } catch {
      toast({ title: "Could not load logs", description: "Failed to fetch activity logs", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAction = filterAction === "all" || log.action === filterAction
    const matchesStatus = filterStatus === "all" || log.status === filterStatus
    return matchesSearch && matchesAction && matchesStatus
  })

  const exportLogs = () => {
    const csvContent = [
      ["Timestamp", "User", "Role", "Action", "Resource", "Details", "Status", "IP Address"].join(","),
      ...filteredLogs.map((log) =>
        [
          new Date(log.timestamp).toLocaleString(),
          log.userName,
          log.userRole,
          log.action,
          log.resource,
          `"${log.details}"`,
          log.status,
          log.ipAddress,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `activity-logs-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const hasActiveFilters = Boolean(searchTerm) || filterAction !== "all" || filterStatus !== "all"

  const successCount = logs.filter((l) => l.status === "success").length
  const errorCount = logs.filter((l) => l.status === "error").length
  const warningCount = logs.filter((l) => l.status === "warning").length

  const table = (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[140px]">Timestamp</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Resource</TableHead>
          <TableHead className="min-w-[200px]">Details</TableHead>
          <TableHead>IP</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredLogs.map((log) => {
          const expanded = expandedIds.has(log._id)
          const longDetails = log.details.length > 80
          return (
            <TableRow key={log._id} className="align-top">
              <TableCell className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                {formatTimestamp(log.timestamp)}
              </TableCell>
              <TableCell>
                <p className="text-sm font-medium text-foreground">{log.userName}</p>
                <p className="text-[11px] text-muted-foreground">{ROLE_LABELS[log.userRole] ?? log.userRole}</p>
              </TableCell>
              <TableCell>
                <span className="text-xs font-semibold uppercase tracking-wide text-foreground">{log.action}</span>
              </TableCell>
              <TableCell>
                <p className="text-sm text-foreground">{log.resource}</p>
                {log.resourceId && (
                  <p className="font-mono text-[11px] text-muted-foreground">#{log.resourceId.slice(-6)}</p>
                )}
              </TableCell>
              <TableCell>
                <p className={expanded ? "text-xs text-muted-foreground" : "line-clamp-1 text-xs text-muted-foreground"}>
                  {log.details}
                </p>
                {longDetails && (
                  <button
                    type="button"
                    onClick={() => toggleExpanded(log._id)}
                    className="mt-1 inline-flex items-center gap-0.5 text-[11px] font-medium text-foreground hover:underline"
                  >
                    {expanded ? (
                      <>
                        Less <ChevronUp className="h-3 w-3" />
                      </>
                    ) : (
                      <>
                        More <ChevronDown className="h-3 w-3" />
                      </>
                    )}
                  </button>
                )}
              </TableCell>
              <TableCell>
                <span className="font-mono text-xs text-muted-foreground">{log.ipAddress || "—"}</span>
              </TableCell>
              <TableCell>
                <StatusBadge tone={statusTone(log.status)} showDot={false}>
                  {log.status}
                </StatusBadge>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )

  const cards = filteredLogs.map((log) => {
    const expanded = expandedIds.has(log._id)
    return (
      <div key={log._id} className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs tabular-nums text-muted-foreground">{formatCompactTimestamp(log.timestamp)}</p>
          <StatusBadge tone={statusTone(log.status)} showDot={false}>
            {log.status}
          </StatusBadge>
        </div>
        <p className="mt-2 text-sm font-medium text-foreground">{log.userName}</p>
        <p className="text-[11px] text-muted-foreground">
          {ROLE_LABELS[log.userRole] ?? log.userRole} · {log.action} · {log.resource}
          {log.resourceId ? ` · #${log.resourceId.slice(-6)}` : ""}
        </p>
        <p className={expanded ? "mt-2 text-xs text-muted-foreground" : "mt-2 line-clamp-2 text-xs text-muted-foreground"}>
          {log.details}
        </p>
        {log.details.length > 90 && (
          <button
            type="button"
            onClick={() => toggleExpanded(log._id)}
            className="mt-1 text-[11px] font-medium text-foreground hover:underline"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}
        <p className="mt-2 font-mono text-[11px] text-muted-foreground">{log.ipAddress || "—"}</p>
      </div>
    )
  })

  return (
    <div className="space-y-4">
      <Toolbar>
        <ToolbarGroup className="flex-1">
          <div className="relative min-w-[180px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search logs…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-9 text-sm"
            />
          </div>
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="h-9 w-[140px] text-sm">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="CREATE">Create</SelectItem>
              <SelectItem value="UPDATE">Update</SelectItem>
              <SelectItem value="DELETE">Delete</SelectItem>
              <SelectItem value="LOGIN">Login</SelectItem>
              <SelectItem value="LOGOUT">Logout</SelectItem>
              <SelectItem value="VIEW">View</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 w-[130px] text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
            </SelectContent>
          </Select>
        </ToolbarGroup>
        <ToolbarGroup>
          <Button onClick={fetchLogs} variant="outline" size="sm" className="h-9" disabled={loading}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={exportLogs} variant="outline" size="sm" className="h-9">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export
          </Button>
        </ToolbarGroup>
      </Toolbar>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <p>
          Showing <span className="font-semibold tabular-nums text-foreground">{filteredLogs.length}</span> of{" "}
          <span className="tabular-nums">{logs.length}</span>
        </p>
        <p className="tabular-nums">
          {successCount} ok · {errorCount} err · {warningCount} warn
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Panel className="hidden overflow-hidden md:block">
            <div className="divide-y divide-border">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex h-12 items-center gap-4 px-4">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="ml-auto h-3 w-16" />
                </div>
              ))}
            </div>
          </Panel>
          <div className="space-y-3 md:hidden">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <Panel>
          <EmptyState
            icon={Activity}
            title={logs.length === 0 ? "No logs yet" : "No matching logs"}
            description={
              logs.length === 0
                ? "Activity appears here as the team uses the portal."
                : hasActiveFilters
                  ? "Try adjusting search or filters."
                  : "No events to show."
            }
          />
        </Panel>
      ) : (
        <ResponsiveRecordList table={table} cards={cards} />
      )}
    </div>
  )
}
