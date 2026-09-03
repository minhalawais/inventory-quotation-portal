import assert from "node:assert/strict"
import { test } from "node:test"

const BASE = process.env.TEST_BASE_URL || "http://127.0.0.1:3000"

async function probe(path: string, init?: RequestInit) {
  const response = await fetch(`${BASE}${path}`, { redirect: "manual", ...init })
  return { status: response.status, location: response.headers.get("location"), type: response.headers.get("content-type") }
}

test("live app is reachable (read-only)", async () => {
  const signin = await probe("/auth/signin")
  assert.equal(signin.status, 200)
  assert.match(String(signin.type), /text\/html/)
})

test("protected APIs reject anonymous callers without writing data", async () => {
  const routes = [
    "/api/products",
    "/api/quotations",
    "/api/taxonomy",
    "/api/users",
    "/api/logs",
    "/api/dashboard/stats",
    "/api/check-ip",
  ]
  for (const route of routes) {
    const result = await probe(route)
    assert.equal(result.status, 401, `${route} should be 401, got ${result.status}`)
  }
})

test("creating a quotation without a session is rejected and does not insert", async () => {
  const result = await probe("/api/quotations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ customerName: "TEST_DO_NOT_SAVE", items: [] }),
  })
  assert.equal(result.status, 401)
})

test("mutating product and taxonomy routes reject anonymous callers", async () => {
  const posts = [
    ["/api/products", { name: "TEST_DO_NOT_SAVE" }],
    ["/api/taxonomy", { type: "department", name: "TEST_DO_NOT_SAVE" }],
    ["/api/users", { email: "test-do-not-save@example.com" }],
  ] as const
  for (const [route, body] of posts) {
    const result = await probe(route, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
    assert.ok([401, 403].includes(result.status), `${route} should reject, got ${result.status}`)
  }
})

test("brand assets and manifest are public", async () => {
  const favicon = await probe("/favicon.ico")
  const manifest = await probe("/manifest.json")
  const logo = await probe("/kk_logo_white_bg.png")
  assert.equal(favicon.status, 200)
  assert.equal(manifest.status, 200)
  assert.equal(logo.status, 200)
})

test("anonymous visitors are sent to sign-in instead of the portal", async () => {
  const home = await probe("/")
  const dashboard = await probe("/dashboard")
  const create = await probe("/quotations/create")
  assert.ok([307, 308, 302].includes(home.status))
  assert.ok(String(home.location).includes("/auth/signin") || String(home.location).includes("signin"))
  assert.ok([307, 308, 302].includes(dashboard.status))
  assert.ok([307, 308, 302].includes(create.status))
})
