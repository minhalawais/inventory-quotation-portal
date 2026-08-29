"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Search,
  Download,
  Activity,
  User,
  Package,
  FileText,
  Trash2,
  CheckCircle2,
  XCircle,
  TriangleAlert,
  RefreshCw,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

const ACTION_ICONS: Record<string, React.ElementType> = {
  CREATE: Package,
  UPDATE: FileText,
  DELETE: Trash2,
  LOGIN: User,
  LOGOUT: User,
  VIEW: Activity,
  BULK_UPDATE: Package,
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-emerald-50 text-emerald-600",
  UPDATE: "bg-indigo-50 text-indigo-600",
  DELETE: "bg-red-50 text-red-600",
  LOGIN: "bg-sky-50 text-sky-600",
  LOGOUT: "bg-gray-50 text-gray-600",
  VIEW: "bg-gray-50 text-gray-600",
  BULK_UPDATE: "bg-amber-50 text-amber-600",
}

const STATUS_CONFIG = {
  success: {
    dot: "bg-emerald-400",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    bar: "bg-emerald-500",
    label: "Success",
  },
  error: {
    dot: "bg-red-400",
    badge: "bg-red-50 text-red-700 border border-red-200",
    bar: "bg-red-500",
    label: "Error",
  },
  warning: {
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    bar: "bg-amber-500",
    label: "Warning",
  },
}

const ROLE_LABELS: Record<string, string> = {
  manager: "Manager",
  rider: "Rider",
  product_manager: "Product Mgr",
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterAction, setFilterAction] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const { toast } = useToast()

  useEffect(() => { fetchLogs() }, [])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/logs")
      if (response.ok) setLogs(await response.json())
    } catch {
      toast({ title: "Error", description: "Failed to fetch activity logs", variant: "destructive" })
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

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total Events", value: logs.length, icon: Activity, color: "text-indigo-600 bg-indigo-50", border: "border-l-indigo-500" },
          { label: "Successful", value: logs.filter((l) => l.status === "success").length, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50", border: "border-l-emerald-500" },
          { label: "Errors", value: logs.filter((l) => l.status === "error").length, icon: XCircle, color: "text-red-600 bg-red-50", border: "border-l-red-500" },
          { label: "Warnings", value: logs.filter((l) => l.status === "warning").length, icon: TriangleAlert, color: "text-amber-600 bg-amber-50", border: "border-l-amber-500" },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-xl border border-gray-200 border-l-4 ${s.border} bg-white p-4`}
            style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.04)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{s.label}</p>
                <p className="mt-1.5 text-2xl font-bold text-gray-950">{s.value}</p>
              </div>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4" style={{ boxShadow: "0 1px 3px rgba(15,23,42,0.04)" }}>
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search logs…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 rounded-lg pl-9 text-sm"
          />
        </div>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="h-9 w-[140px] rounded-lg text-sm">
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
          <SelectTrigger className="h-9 w-[130px] rounded-lg text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2 ml-auto">
          <Button onClick={fetchLogs} variant="outline" size="sm" className="h-9 rounded-lg" disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={exportLogs} variant="outline" size="sm" className="h-9 rounded-lg">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-gray-500">
          Showing <span className="font-semibold text-gray-900">{filteredLogs.length}</span> of {logs.length} events
        </p>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex animate-pulse gap-4 rounded-xl border border-gray-200 bg-white p-4">
              <div className="h-10 w-10 rounded-xl bg-gray-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-48 rounded bg-gray-100" />
                <div className="h-3 w-64 rounded bg-gray-100" />
                <div className="h-3 w-32 rounded bg-gray-100" />
              </div>
              <div className="h-5 w-16 rounded-full bg-gray-100 shrink-0" />
            </div>
          ))}
        </div>
      ) : filteredLogs.length > 0 ? (
        <div className="space-y-2">
          {filteredLogs.map((log) => {
            const ActionIcon = ACTION_ICONS[log.action] ?? Activity
            const actionColor = ACTION_COLORS[log.action] ?? "bg-gray-50 text-gray-600"
            const statusConfig = STATUS_CONFIG[log.status]

            return (
              <div
                key={log._id}
                className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-all duration-150 hover:border-gray-300 hover:shadow-sm"
              >
                {/* Action icon */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${actionColor}`}>
                  <ActionIcon className="h-4.5 w-4.5" />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-gray-900">{log.userName}</p>
                    <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                      {ROLE_LABELS[log.userRole] ?? log.userRole}
                    </span>
                    <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 rounded px-1.5 py-0.5">
                      {log.action}
                    </span>
                    <span className="text-[11px] text-gray-500">{log.resource}</span>
                    {log.resourceId && (
                      <span className="text-[11px] text-gray-400">#{log.resourceId.slice(-6)}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-1">{log.details}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-gray-400">
                    <span>IP: {log.ipAddress}</span>
                    <span>·</span>
                    <span>{new Date(log.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>

                {/* Status badge */}
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusConfig.badge}`}>
                  {statusConfig.label}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Activity className="h-6 w-6 text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">No logs found</p>
            <p className="mt-1 text-xs text-gray-500">
              {searchTerm || filterAction !== "all" || filterStatus !== "all"
                ? "Try adjusting your filters."
                : "Activity will appear here as your team uses the workspace."}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
