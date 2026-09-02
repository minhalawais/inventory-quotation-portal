import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Activity logs",
}
import ActivityLogs from "@/components/logs/activity-logs"
import { Activity } from "lucide-react"
import { PageHeading } from "@/components/layout/page-heading"

export default async function LogsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "manager") {
    redirect("/auth/signin")
  }

  return (
    <div className="space-y-6">
      <PageHeading title="Activity log" description="Review system actions, outcomes, and user activity." icon={Activity} />

      <ActivityLogs />
    </div>
  )
}
