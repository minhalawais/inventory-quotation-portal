export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,31}$/

export function normalizeUsername(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

export function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

export function isValidUsername(value: string) {
  return USERNAME_PATTERN.test(value)
}

export function usernameRulesText() {
  return "Use 3-32 lowercase letters, numbers, dots, underscores, or hyphens. Start with a letter or number."
}

export function baseUsernameFromEmail(email: string) {
  const localPart = email.split("@")[0] || "user"
  const normalized = localPart
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/^[^a-z0-9]+/, "")
    .slice(0, 32)

  return normalized.length >= 3 ? normalized : `${normalized || "user"}001`.slice(0, 32)
}
