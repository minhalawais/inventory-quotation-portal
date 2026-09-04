const puppeteer = require("puppeteer")
const { encode } = require("next-auth/jwt")
require("dotenv").config()
const fs = require("fs")

const outputDir = "tmp/ui-audit-after"

async function main() {
  fs.mkdirSync(outputDir, { recursive: true })
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 })
  page.setDefaultTimeout(30000)
  await page.goto("http://localhost:3000/auth/signin", { waitUntil: "networkidle2" })
  await page.screenshot({
    path: `${outputDir}/01-signin-desktop.png`,
    fullPage: true,
  })
  const products = [
    { _id: "p1", productId: "PRD-1001", name: "Industrial Safety Helmet", group: "Safety", subGroup: "Head Protection", price: 2850, purchaseRate: 2200, imagePaths: [], isOutOfStock: false, createdAt: "2026-05-12T00:00:00.000Z" },
    { _id: "p2", productId: "PRD-1002", name: "High-Visibility Work Vest", group: "Safety", subGroup: "Protective Clothing", price: 1650, purchaseRate: 1180, imagePaths: [], isOutOfStock: false, createdAt: "2026-05-14T00:00:00.000Z" },
    { _id: "p3", productId: "PRD-2001", name: "Cordless Impact Drill", group: "Power Tools", subGroup: "Drills", price: 24750, purchaseRate: 21100, imagePaths: [], isOutOfStock: true, createdAt: "2026-06-03T00:00:00.000Z" },
  ]
  const quotations = [
    { _id: "66f001abc001", customerName: "Apex Engineering", customerPhone: "+92 300 1234567", customerAddress: "Korangi Industrial Area, Karachi", totalAmount: 68300, status: "pending", createdAt: "2026-08-28T09:30:00.000Z", items: [{ productId: "p1", quantity: 4, price: 2850 }, { productId: "p2", quantity: 5, price: 1650 }] },
    { _id: "66f001abc002", customerName: "Northline Contractors", customerPhone: "+92 321 7654321", customerAddress: "Gulberg, Lahore", totalAmount: 49500, status: "sent", createdAt: "2026-08-27T12:15:00.000Z", items: [{ productId: "p3", quantity: 2, price: 24750 }] },
  ]
  const users = [
    { _id: "u1", name: "Portal Manager", email: "admin@inventory.com", role: "manager", status: "active", isOnline: true, lastSeen: "2026-08-29T00:30:00.000Z", allowedIps: ["*"], contact: "+92 300 1112233", createdAt: "2025-02-10T00:00:00.000Z" },
    { _id: "u2", name: "Delivery Rider", email: "rider@inventory.com", role: "rider", status: "active", isOnline: false, lastSeen: "2026-08-28T18:20:00.000Z", allowedIps: ["192.168.1.20"], contact: "+92 300 4455667", createdAt: "2025-04-18T00:00:00.000Z" },
    { _id: "u3", name: "Catalog Manager", email: "p_manager@gmail.com", role: "product_manager", status: "active", isOnline: true, lastSeen: "2026-08-29T00:28:00.000Z", allowedIps: ["*"], contact: "+92 321 7788990", createdAt: "2025-06-03T00:00:00.000Z" },
  ]
  const logs = [
    { _id: "l1", userId: "u1", userName: "Portal Manager", userRole: "manager", action: "CREATE", resource: "Quotation", resourceId: "66f001abc001", details: "Created quotation for Apex Engineering", ipAddress: "192.168.1.10", userAgent: "Chrome Windows", timestamp: "2026-08-29T00:10:00.000Z", status: "success" },
    { _id: "l2", userId: "u3", userName: "Catalog Manager", userRole: "product_manager", action: "UPDATE", resource: "Product", resourceId: "p3", details: "Marked Cordless Impact Drill as out of stock", ipAddress: "192.168.1.22", userAgent: "Chrome Windows", timestamp: "2026-08-28T19:45:00.000Z", status: "warning" },
  ]
  await page.setRequestInterception(true)
  page.on("request", (request) => {
    const url = new URL(request.url())
    if (!url.pathname.startsWith("/api/")) return request.continue()
    let body = { ok: true }
    if (url.pathname === "/api/auth/session") body = { user: { id: "ui-audit-manager", name: "Portal Manager", email: "admin@inventory.com", role: "manager", status: "active", allowedIps: [] }, expires: "2027-08-29T00:00:00.000Z" }
    else if (url.pathname === "/api/dashboard/stats") body = { totalProducts: 248, totalQuotations: 86, totalUsers: 12, totalRevenue: 4286500 }
    else if (url.pathname === "/api/dashboard/sales") body = [{ month: "Mar", sales: 12, revenue: 540000 }, { month: "Apr", sales: 18, revenue: 810000 }, { month: "May", sales: 16, revenue: 720000 }, { month: "Jun", sales: 23, revenue: 1120000 }, { month: "Jul", sales: 21, revenue: 980000 }, { month: "Aug", sales: 27, revenue: 1290000 }]
    else if (url.pathname === "/api/products/out-of-stock") body = products.filter((product) => product.isOutOfStock)
    else if (url.pathname === "/api/products/last-id") body = { lastId: "PRD-2001" }
    else if (url.pathname === "/api/products/check-id") body = { isUnique: true }
    else if (url.pathname === "/api/products") body = products
    else if (url.pathname === "/api/quotations") body = quotations
    else if (url.pathname === "/api/users/status" || url.pathname === "/api/users") body = users
    else if (url.pathname === "/api/logs") body = logs
    return request.respond({ status: 200, contentType: "application/json", body: JSON.stringify(body) })
  })
  const token = await encode({
    secret: process.env.NEXTAUTH_SECRET,
    token: {
      id: "ui-audit-manager",
      name: "Portal Manager",
      email: "admin@inventory.com",
      role: "manager",
      status: "active",
      allowedIps: [],
    },
  })
  await page.setCookie({
    name: "next-auth.session-token",
    value: token,
    domain: "localhost",
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
  })
  await page.reload({ waitUntil: "domcontentloaded" })
  await new Promise((resolve) => setTimeout(resolve, 1200))

  const routes = [
    ["02-dashboard-desktop", "/dashboard"],
    ["03-products-desktop", "/products"],
    ["04-product-add-desktop", "/products/add"],
    ["05-quotations-desktop", "/quotations"],
    ["06-quotation-create-desktop", "/quotations/create"],
    ["07-users-desktop", "/users"],
    ["08-user-add-desktop", "/users/add"],
    ["09-activity-logs-desktop", "/logs"],
    ["10-out-of-stock-desktop", "/out-of-stock"],
  ]

  for (const [name, route] of routes) {
    await page.goto(`http://localhost:3000${route}`, { waitUntil: "domcontentloaded" })
    await page.waitForSelector("header", { timeout: 15000 })
    await new Promise((resolve) => setTimeout(resolve, 3500))
    await page.screenshot({
      path: `${outputDir}/${name}.png`,
      fullPage: true,
    })
    console.log(`${name}: ${page.url()}`)
  }

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 })
  for (const [name, route] of [
    ["11-dashboard-mobile", "/dashboard"],
    ["12-products-mobile", "/products"],
    ["13-quotations-mobile", "/quotations"],
    ["14-quotation-create-mobile", "/quotations/create"],
    ["15-users-mobile", "/users"],
    ["16-activity-logs-mobile", "/logs"],
  ]) {
    await page.goto(`http://localhost:3000${route}`, { waitUntil: "domcontentloaded" })
    if (!route.startsWith("/auth/")) await page.waitForSelector("header", { timeout: 15000 })
    await new Promise((resolve) => setTimeout(resolve, 3500))
    await page.screenshot({
      path: `${outputDir}/${name}.png`,
      fullPage: true,
    })
    console.log(`${name}: ${page.url()}`)
  }
  await browser.close()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
