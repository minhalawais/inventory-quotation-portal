import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Shield } from "lucide-react"
import { RestrictedActions } from "@/components/restricted-client"
import { BrandMark } from "@/components/brand-mark"

export default async function RestrictedPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center p-6"
      style={{ background: "hsl(222, 47%, 9%)" }}
    >
      {/* Brand */}
      <div className="mb-12">
        <BrandMark inverse />
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
        {/* Icon */}
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-500/20">
          <Shield className="h-7 w-7 text-amber-400" />
        </div>

        {/* Heading */}
        <div className="text-center mb-6">
          <h1 className="text-lg font-bold text-white tracking-tight mb-2">Access restricted</h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            Hello, <span className="text-white font-medium">{session.user.name}</span>. Your current
            IP address is not authorized to access this portal.
          </p>
        </div>

        {/* Account info */}
        <div className="mb-6 rounded-xl border border-white/8 bg-white/5 p-4 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-3">
            Account details
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Email</span>
            <span className="text-xs font-medium text-gray-200">{session.user.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Role</span>
            <span className="text-xs font-medium text-gray-200 capitalize">
              {session.user.role.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        <RestrictedActions />

        <p className="mt-5 text-center text-xs text-gray-600">
          Contact your administrator to add your IP address to the allowed list.
        </p>
      </div>

      <p className="mt-8 text-xs text-gray-600">InventoryOS · IP-whitelisted access</p>
    </div>
  )
}
