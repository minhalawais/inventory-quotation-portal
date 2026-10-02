export function getSignInUrl() {
  if (typeof window === "undefined") return "/auth/signin"

  return `${window.location.origin}/auth/signin`
}
