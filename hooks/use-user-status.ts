"use client"

import { useState, useEffect, useCallback } from "react"
import type { UserStatus } from "@/lib/status-utils"

const POLLING_INTERVAL = 30000 // 30 seconds

export function useUserStatus() {
  const [users, setUsers] = useState<UserStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/users/status")
      if (!response.ok) {
        throw new Error("Failed to fetch user status")
      }
      const data = await response.json()
      setUsers(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUserStatus()

    const interval = setInterval(fetchUserStatus, POLLING_INTERVAL)

    return () => clearInterval(interval)
  }, [fetchUserStatus])

  return { users, loading, error, refetch: fetchUserStatus }
}
