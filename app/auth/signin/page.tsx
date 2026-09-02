"use client"

import Image from "next/image"
import type React from "react"
import { useState } from "react"
import { getSession, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react"

import { BrandMark } from "@/components/brand-mark"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const developmentAccounts = [
  { type: "manager" as const, label: "Manager", email: "admin@inventory.com", password: "admin123" },
  { type: "rider" as const, label: "Rider", email: "rider@inventory.com", password: "rider123" },
  { type: "product_manager" as const, label: "Product manager", email: "p_manager@gmail.com", password: "password123" },
]

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const isDevelopment = process.env.NODE_ENV === "development"

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
      window.setTimeout(async () => {
        const session = await getSession()
        router.push(session?.user?.role === "manager" ? "/dashboard" : "/products")
      }, 700)
    } catch {
      setError("We could not sign you in. Please try again.")
      setLoading(false)
    }
  }

  const fillDevelopmentCredentials = (account: (typeof developmentAccounts)[number]) => {
    setEmail(account.email)
    setPassword(account.password)
  }

  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[58%_42%]">
      <section className="relative h-48 overflow-hidden bg-[hsl(var(--kk-black))] sm:h-56 lg:h-screen" aria-label="KK Sports operations">
        <Image
          src="/kk-operations-login.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 58vw, 100vw"
          className="object-cover object-[68%_center] lg:object-center"
        />
        <div className="absolute inset-0 bg-black/35" aria-hidden="true" />
        <div className="relative flex h-full flex-col justify-between p-5 sm:p-7 lg:p-10 xl:p-12">
          <BrandMark inverse subtitle={false} />
          <div className="hidden max-w-lg lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.04em] text-primary">Inventory and quotations</p>
            <h2 className="mt-3 max-w-md text-3xl font-semibold leading-tight text-white">
              Keep every product, quote, and team action in view.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/70">
              A focused operations workspace built for the daily pace of KK Sports.
            </p>
          </div>
          <div className="hidden items-center gap-2 text-xs text-white/55 lg:flex">
            <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
            Role-restricted and IP-controlled access
          </div>
        </div>
      </section>

      <section className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-5 py-8 sm:min-h-[calc(100vh-14rem)] sm:px-8 lg:min-h-screen lg:px-10 xl:px-14">
        <div className="w-full max-w-[420px]">
          <div className="mb-7">
            <p className="text-xs font-semibold uppercase tracking-[0.04em] text-[hsl(var(--kk-gold-hover))]">Operations portal</p>
            <h1 className="mt-2 text-2xl font-semibold text-foreground">Sign in to KK Sports</h1>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">Access inventory, quotations, and team operations.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="min-h-[52px]" aria-live="polite">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>Signed in. Opening your workspace.</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@kksports.com.pk"
                autoComplete="email"
                required
                disabled={loading}
                aria-invalid={Boolean(error)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="pr-11"
                  required
                  disabled={loading}
                  aria-invalid={Boolean(error)}
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-10 w-10 text-muted-foreground"
                      onClick={() => setShowPassword((visible) => !visible)}
                      disabled={loading}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{showPassword ? "Hide password" : "Show password"}</TooltipContent>
                </Tooltip>
              </div>
            </div>

            <Button type="submit" className="mt-2 w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {success ? "Opening workspace" : "Signing in"}
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {isDevelopment && (
            <details className="mt-6 border-t border-border pt-4">
              <summary className="cursor-pointer text-xs font-medium text-muted-foreground">Development access</summary>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {developmentAccounts.map((account) => (
                  <button
                    key={account.type}
                    type="button"
                    onClick={() => fillDevelopmentCredentials(account)}
                    disabled={loading}
                    className="min-h-10 rounded-md border border-border bg-white px-2 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50"
                  >
                    {account.label}
                  </button>
                ))}
              </div>
            </details>
          )}

          <p className="mt-6 text-xs leading-5 text-muted-foreground">Authorized KK Sports personnel only.</p>
        </div>
      </section>
    </main>
  )
}
