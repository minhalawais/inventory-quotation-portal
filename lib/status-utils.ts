export const OFFLINE_THRESHOLD = 2 * 60 * 1000 // 2 minutes in milliseconds

export interface UserStatus {
  _id: string
  name: string
  email: string
  role: string
  contact?: string
  createdAt: string
  isOnline: boolean
  lastSeen: Date | null
  lastSeenFormatted: string | null
}

export function determineUserStatus(user: any): UserStatus {
  const lastSeen = user.lastSeen ? new Date(user.lastSeen) : null
  const now = new Date()
  const isRecentlyActive = lastSeen && now.getTime() - lastSeen.getTime() < OFFLINE_THRESHOLD

  return {
    ...user,
    _id: user._id.toString(),
    isOnline: isRecentlyActive || false,
    lastSeen, // This is now a Date object
    lastSeenFormatted: lastSeen ? lastSeen.toISOString() : null,
  }
}

export function getStatusColor(isOnline: boolean): string {
  return isOnline ? "bg-green-400" : "bg-gray-400"
}

export function getStatusText(isOnline: boolean): string {
  return isOnline ? "Online" : "Offline"
}

export function getLastSeenText(lastSeen: string | Date | null) {
  if (!lastSeen) return "Unknown"

  const lastSeenDate = lastSeen instanceof Date ? lastSeen : new Date(lastSeen)

  if (isNaN(lastSeenDate.getTime())) return "Invalid date"

  const now = new Date()
  const diffMs = now.getTime() - lastSeenDate.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) return "Just now"
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

