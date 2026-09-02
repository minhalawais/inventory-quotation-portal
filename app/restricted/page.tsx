import type { Metadata } from "next"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { Shield } from "lucide-react"

export const metadata: Metadata = {
  title: "Access restricted",
}

import { RestrictedActions } from "@/components/restricted-client"
import { SystemStatePage } from "@/components/system-state-page"
import { authOptions } from "@/lib/auth"

export default async function RestrictedPage() {
  const session = await getServerSession(authOptions)

  if (!session) redirect("/auth/signin")

  return (
    <SystemStatePage
      icon={Shield}
      tone="warning"
      title="Access restricted"
      description={
        <>
          Hello, <span className="font-medium text-foreground">{session.user.name}</span>. Your current IP address is not authorized for this portal.
        </>
      }
      footer="KK Sports Operations - IP-controlled access"
    >
      <dl className="mb-5 divide-y divide-border rounded-md border border-border bg-muted/40 px-3">
        <div className="flex gap-4 py-3 text-xs">
          <dt className="w-16 shrink-0 text-muted-foreground">Email</dt>
          <dd className="min-w-0 break-all font-medium text-foreground">{session.user.email}</dd>
        </div>
        <div className="flex gap-4 py-3 text-xs">
          <dt className="w-16 shrink-0 text-muted-foreground">Role</dt>
          <dd className="font-medium capitalize text-foreground">{session.user.role.replace(/_/g, " ")}</dd>
        </div>
      </dl>
      <RestrictedActions />
      <p className="mt-4 text-xs leading-5 text-muted-foreground">Contact an administrator to add your IP address to the allowed list.</p>
    </SystemStatePage>
  )
}
