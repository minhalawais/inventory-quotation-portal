import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, AlertTriangle } from "lucide-react"
import { RestrictedActions } from "@/components/restricted-client"

export default async function RestrictedPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg border-red-200">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl font-bold text-red-800 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Access Restricted
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-gray-700 font-medium">Hello, {session.user.name}</p>
            <p className="text-sm text-gray-600">
              Your current IP address is not authorized to access this portal. Please contact your administrator to add
              your IP address to the allowed list.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-xs text-gray-500 font-medium">Account Details:</p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Email:</span> {session.user.email}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Role:</span> {session.user.role}
            </p>
          </div>

          <RestrictedActions />

          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500">
              If you believe this is an error, please contact your system administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
