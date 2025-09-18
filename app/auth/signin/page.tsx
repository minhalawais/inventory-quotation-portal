"use client"

import type React from "react"
import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff, CheckCircle, Lock, Mail, ArrowRight, ShoppingCart, Package } from "lucide-react"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid credentials. Please check your email and password.")
        setLoading(false)
      } else {
        setSuccess(true)
        // Keep loading state for a moment to show success
        setTimeout(async () => {
          const session = await getSession()
          if (session?.user?.role === "manager") {
            router.push("/dashboard")
          } else {
            router.push("/products")
          }
        }, 1000)
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
      setLoading(false)
    }
  }

  const fillDemoCredentials = (type: "manager" | "rider") => {
    if (type === "manager") {
      setEmail("admin@inventory.com")
      setPassword("admin123")
    } else {
      setEmail("rider@inventory.com")
      setPassword("rider123")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-purple-50/50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/10 rounded-full mix-blend-multiply filter blur-2xl opacity-50"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fillRule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%23000000&quot; fillOpacity=&quot;0.02&quot;%3E%3Ccircle cx=&quot;30&quot; cy=&quot;30&quot; r=&quot;1&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>

      <div className="relative w-full max-w-md z-10">
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95 rounded-3xl">
          <CardHeader className="text-center pb-8">
            {/* Logo and branding - Same as Sidebar */}
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl relative">
              {/* Main logo container */}
              <div className="relative w-full h-full flex items-center justify-center">
                <ShoppingCart className="h-10 w-10 text-white" />
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <Package className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>

            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</CardTitle>
            <CardDescription className="text-gray-600 text-base">
              Sign in to your <span className="font-semibold text-blue-600">Inventory Portal</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert className="border-red-200 bg-red-50 text-red-800">
                  <AlertDescription className="font-medium">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="font-medium">
                    Login successful! Redirecting to dashboard...
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl text-base"
                  placeholder="Enter your email address"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl text-base pr-12"
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className={`w-full h-12 font-semibold shadow-lg transition-all duration-300 transform rounded-xl ${
                  success 
                    ? "bg-green-600 hover:bg-green-700 text-white" 
                    : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:shadow-xl hover:-translate-y-0.5"
                }`}
                disabled={loading}
              >
                {loading ? (
                  success ? (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Logged In Successfully!
                    </>
                  ) : (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing In...
                    </>
                  )
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Demo credentials section */}
            <div className="mt-8 space-y-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Quick Demo Access</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fillDemoCredentials("manager")}
                  className="w-full h-12 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 rounded-xl border-gray-300"
                  disabled={loading}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <ShoppingCart className="h-3 w-3 text-blue-600" />
                      </div>
                      <span className="font-medium">Manager Demo</span>
                    </div>
                    <span className="text-xs text-gray-500">Full Access</span>
                  </div>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fillDemoCredentials("rider")}
                  className="w-full h-12 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 rounded-xl border-gray-300"
                  disabled={loading}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-purple-600">R</span>
                      </div>
                      <span className="font-medium">Rider Demo</span>
                    </div>
                    <span className="text-xs text-gray-500">Limited Access</span>
                  </div>
                </Button>
              </div>

              {/* Credentials display */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Demo Credentials
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                    <span className="font-medium text-gray-700">Manager:</span>
                    <span className="font-mono text-gray-600">admin@inventory.com</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                    <span className="font-medium text-gray-700">Rider:</span>
                    <span className="font-mono text-gray-600">rider@inventory.com</span>
                  </div>
                  <p className="text-center text-gray-600 mt-2">
                    Password for both: <span className="font-mono font-semibold">admin123 / rider123</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">Inventory Portal © 2024 - Professional Business Solutions</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}