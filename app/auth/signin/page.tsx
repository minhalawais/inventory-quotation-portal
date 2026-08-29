"use client"

import type React from "react"
import { useState } from "react"
import { getSession, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Bike,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  PackageSearch,
  ShieldCheck,
} from "lucide-react"
import { BrandMark } from "@/components/brand-mark"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)
    try {
      const result = await signIn("credentials", { email, password, redirect: false })
      if (result?.error) {
        setError("The email or password is incorrect.")
        setLoading(false)
        return
      }
      setSuccess(true)
      setTimeout(async () => {
        const session = await getSession()
        router.push(session?.user?.role === "manager" ? "/dashboard" : "/products")
      }, 700)
    } catch {
      setError("We could not sign you in. Please try again.")
      setLoading(false)
    }
  }

  const fillDemoCredentials = (type: "manager" | "rider" | "product_manager") => {
    const credentials = {
      manager: ["admin@inventory.com", "admin123"],
      rider: ["rider@inventory.com", "rider123"],
      product_manager: ["p_manager@gmail.com", "password123"],
    }
    setEmail(credentials[type][0])
    setPassword(credentials[type][1])
  }

  const demoAccounts = [
    { type: "manager" as const, label: "Manager", detail: "Full access", icon: ShieldCheck, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
    { type: "rider" as const, label: "Rider", detail: "Quotes & products", icon: Bike, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    { type: "product_manager" as const, label: "Product Mgr", detail: "Catalog only", icon: PackageSearch, color: "text-violet-600 bg-violet-50 border-violet-100" },
  ]

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div
        className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-2xl border border-gray-200 bg-white lg:grid-cols-[0.9fr_1.1fr]"
        style={{ boxShadow: "0 8px 40px rgba(15,23,42,0.10), 0 2px 8px rgba(15,23,42,0.06)" }}
      >
        {/* Left panel */}
        <section
          className="relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col lg:justify-between"
          style={{ background: "hsl(222, 47%, 9%)" }}
        >
          {/* Subtle grid pattern */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(255,255,255,1) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,1) 40px)`,
            }}
          />
          {/* Gradient orbs */}
          <div
            className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }}
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #8b5cf6, transparent 70%)" }}
          />

          <div className="relative">
            <BrandMark inverse />
          </div>

          <div className="relative max-w-sm space-y-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
              Operations workspace
            </p>
            <h1 className="text-3xl font-bold leading-tight text-white" style={{ letterSpacing: "-0.03em" }}>
              Inventory and quotations, under control.
            </h1>
            <p className="text-sm leading-relaxed text-gray-400">
              A focused workspace for managing products, preparing quotes, and keeping your team aligned — from one place.
            </p>

            {/* Feature list */}
            <ul className="space-y-3 pt-2">
              {[
                "Role-based access for managers and riders",
                "Real-time stock and quotation tracking",
                "PDF export and WhatsApp sharing",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-gray-400">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative flex items-center gap-2 text-xs text-gray-500">
            <LockKeyhole className="h-3.5 w-3.5" />
            Secure · Role-restricted · IP-whitelisted access
          </div>
        </section>

        {/* Right panel — form */}
        <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-14">
          <div className="w-full max-w-md">
            {/* Mobile brand */}
            <div className="mb-8 lg:hidden">
              <BrandMark />
            </div>

            <div className="mb-8 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
                Welcome back
              </p>
              <h2 className="text-2xl font-bold text-gray-950" style={{ letterSpacing: "-0.02em" }}>
                Sign in to your workspace
              </h2>
              <p className="text-sm text-gray-500">Use your assigned credentials to continue.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="rounded-lg">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="rounded-lg border-emerald-200 bg-emerald-50 text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>Signed in — opening your workspace…</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  autoComplete="email"
                  required
                  disabled={loading}
                  className="h-10 rounded-lg border-gray-300 bg-gray-50 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500/20 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="h-10 rounded-lg border-gray-300 bg-gray-50 pr-10 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500/20 transition-all"
                    required
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="mt-2 h-10 w-full rounded-lg font-semibold"
                style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {success ? "Opening workspace…" : "Signing in…"}
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Demo accounts */}
            <div className="mt-8 border-t border-gray-100 pt-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">Demo accounts</p>
                <p className="text-xs text-gray-400">Click to autofill credentials</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {demoAccounts.map((account) => (
                  <button
                    key={account.type}
                    type="button"
                    onClick={() => fillDemoCredentials(account.type)}
                    disabled={loading}
                    className={`flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all duration-150 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 ${account.color}`}
                  >
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-white/70`}>
                      <account.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{account.label}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{account.detail}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-gray-400">
              Authorized personnel only — access is logged and monitored.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
