export async function logActivity({
    userId,
    userName,
    userRole,
    action,
    resource,
    resourceId,
    details,
    status = "success",
  }: {
    userId: string
    userName: string
    userRole: string
    action: string
    resource: string
    resourceId?: string
    details: string
    status?: "success" | "error" | "warning"
  }) {
    try {
      await fetch("/api/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          userName,
          userRole,
          action,
          resource,
          resourceId,
          details,
          status,
        }),
      })
    } catch (error) {
      console.error("Failed to log activity:", error)
    }
  }
  