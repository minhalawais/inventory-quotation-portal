// middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getClientIP, isIPAllowed } from "./lib/ip-utils"
import { getToken } from "next-auth/jwt"

export default async function middleware(request: NextRequest) {
  // Skip middleware for auth routes, API routes, and static files
  if (
    request.nextUrl.pathname.startsWith("/auth") ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/api/") ||
    request.nextUrl.pathname.includes(".") ||
    request.nextUrl.pathname === "/restricted"
  ) {
    return NextResponse.next()
  }

  try {
    // ✅ Get the JWT token
    const token = await getToken({ req: request })

    if (!token?.email) {
      // Not logged in → redirect to signin
      return NextResponse.redirect(new URL("/auth/signin", request.url))
    }
    if (token.status === "inactive") {
      return NextResponse.redirect(new URL("/auth/inactive", request.url))
    }
    // ✅ Extract allowed IPs from token (already set in authOptions)
    const clientIP = getClientIP(request)
    const allowedIPs = (token.allowedIps as string[]) || ["*"]
    const isAllowed = isIPAllowed(clientIP, allowedIPs)
    
    if (!isAllowed) {
      // If IP is not allowed → redirect to restricted
      return NextResponse.redirect(new URL("/restricted", request.url))
    }

    // ✅ All good → allow request
    return NextResponse.next()
  } catch (error) {
    console.error("Middleware error:", error)
    // If error, let the request pass but log it
    return NextResponse.next()
  }
}

// ✅ Matcher to protect all routes except auth, api, static, restricted
export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|auth|restricted).*)",
  ],
}
