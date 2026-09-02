import { Loader2 } from "lucide-react"

import { SystemStatePage } from "@/components/system-state-page"

export default function Loading() {
  return (
    <SystemStatePage
      icon={Loader2}
      title="Checking access"
      description="Confirming your account and network permissions."
      footer="KK Sports Operations - secure workspace"
    >
      <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Checking access">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
      </div>
    </SystemStatePage>
  )
}
