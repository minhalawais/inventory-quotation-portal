"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShieldOff } from "lucide-react"
import { signOut } from "next-auth/react"

export default function InactivePage() {
  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <ShieldOff className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <CardTitle className="text-2xl">Account Inactive</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-6">
            Your account has been deactivated. Please contact your administrator for assistance.
          </p>
          <Button onClick={handleSignOut} className="w-full">
            Return to Sign In
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}