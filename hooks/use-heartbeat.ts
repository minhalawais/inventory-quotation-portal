"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"

const HEARTBEAT_INTERVAL = 30000 // 30 seconds

export function useHeartbeat() {
  const { data: session } = useSession()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!session?.user) return

    sendHeartbeat()

    intervalRef.current = setInterval(() => {
      sendHeartbeat()
    }, HEARTBEAT_INTERVAL)

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        sendHeartbeat()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    const handleUserActivity = () => {
      sendHeartbeat()
    }

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"]
    events.forEach((event) => {
      document.addEventListener(event, handleUserActivity, { passive: true })
    })

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      events.forEach((event) => {
        document.removeEventListener(event, handleUserActivity)
      })
    }
  }, [session])

  const sendHeartbeat = async () => {
    try {
      await fetch("/api/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
    } catch (error) {
      console.error("Heartbeat failed:", error)
    }
  }
}
