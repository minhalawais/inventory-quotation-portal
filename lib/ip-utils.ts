import type { NextRequest } from "next/server"

/**
 * Normalize IPv6-mapped IPv4 addresses
 * Example: ::ffff:127.0.0.1 → 127.0.0.1
 */
function normalizeIP(ip: string): string {
  if (ip.startsWith("::ffff:")) {
    return ip.substring(7)
  }
  if (ip === "::1") {
    return "127.0.0.1"
  }
  return ip
}

/**
 * Extract the client IP from headers or request
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")
  const cfConnectingIP = request.headers.get("cf-connecting-ip")

  let ip = "127.0.0.1" // default for dev

  if (forwarded) {
    ip = forwarded.split(",")[0].trim()
  } else if (realIP) {
    ip = realIP
  } else if (cfConnectingIP) {
    ip = cfConnectingIP
  } else if ((request as any).ip) {
    ip = (request as any).ip
  }

  return normalizeIP(ip)
}

/**
 * Validate an IP or CIDR string
 */
export function isValidIP(ip: string): boolean {
  if (ip === "*") return true

  // IPv4 validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  if (ipv4Regex.test(ip)) {
    return ip.split(".").every((part) => {
      const num = Number.parseInt(part, 10)
      return num >= 0 && num <= 255
    })
  }

  // CIDR validation
  const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/
  if (cidrRegex.test(ip)) {
    const [ipPart, maskPart] = ip.split("/")
    const mask = Number.parseInt(maskPart, 10)
    return isValidIP(ipPart) && mask >= 0 && mask <= 32
  }

  return false
}

/**
 * Check if an IP is inside a CIDR range
 */
function isIPInCIDR(ip: string, cidr: string): boolean {
  const [network, maskBits] = cidr.split("/")
  const mask = Number.parseInt(maskBits, 10)

  const ipToNumber = (ip: string) =>
    ip.split(".").reduce((acc, octet) => (acc << 8) + Number.parseInt(octet, 10), 0) >>> 0

  const ipNum = ipToNumber(ip)
  const networkNum = ipToNumber(network)
  const maskNum = (0xffffffff << (32 - mask)) >>> 0

  return (ipNum & maskNum) === (networkNum & maskNum)
}

/**
 * Check if a client IP is allowed
 */
export function isIPAllowed(clientIP: string, allowedIPs: string[]): boolean {
  if (!clientIP || !allowedIPs || allowedIPs.length === 0) {
    return false
  }

  if (allowedIPs.includes("*")) {
    return true
  }

  return allowedIPs.some((allowedIP) => {
    if (allowedIP === clientIP) return true
    if (allowedIP.includes("/")) {
      return isIPInCIDR(clientIP, allowedIP)
    }
    return false
  })
}
