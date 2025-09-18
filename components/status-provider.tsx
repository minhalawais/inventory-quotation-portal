"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useUserStatus } from "@/hooks/use-user-status"
import type { UserStatus } from "@/lib/status-utils"

interface StatusContextType {
  users: UserStatus[]
  loading: boolean
  error: string | null
  refetch: () => void
}

const StatusContext = createContext<StatusContextType | undefined>(undefined)

export function StatusProvider({ children }: { children: ReactNode }) {
  const statusData = useUserStatus()

  return <StatusContext.Provider value={statusData}>{children}</StatusContext.Provider>
}

export function useStatus() {
  const context = useContext(StatusContext)
  if (context === undefined) {
    throw new Error("useStatus must be used within a StatusProvider")
  }
  return context
}
