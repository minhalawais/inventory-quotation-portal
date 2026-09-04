const puppeteer = require("puppeteer")
const { encode } = require("next-auth/jwt")
const fs = require("fs")
require("dotenv").config()

const baseUrl = "http://localhost:3003"
const outputDir = "tmp/products-quotations-audit"
const scope = process.argv[2] || "all"
const pause = (ms = 1800) => new Promise((resolve) => setTimeout(resolve, ms))

const products = [
  { _id: "p1", productId: "PRD-1001", name: "Industrial Safety Helmet", group: "Safety", subGroup: "Head Protection", price: 2850, purchaseRate: 2200, imagePaths: [], isOutOfStock: false, createdAt: "2026-05-12T00:00:00.000Z" },
  { _id: "p2", productId: "PRD-1002", name: "High-Visibility Work Vest", group: "Safety", subGroup: "Protective Clothing", price: 1650, purchaseRate: 1180, imagePaths: [], isOutOfStock: false, createdAt: "2026-05-14T00:00:00.000Z" },
  { _id: "p3", productId: "PRD-2001", name: "Cordless Impact Drill", group: "Power Tools", subGroup: "Drills", price: 24750, purchaseRate: 21100, imagePaths: [], isOutOfStock: true, createdAt: "2026-06-03T00:00:00.000Z" },
  { _id: "p4", productId: "PRD-3004", name: "Heavy-Duty Extension Cable", group: "Electrical", subGroup: "Cables", price: 8900, purchaseRate: 7100, imagePaths: [], isOutOfStock: false, createdAt: "2026-07-19T00:00:00.000Z" },
]

const quotations = [
  { _id: "66f001abc001", customerName: "Apex Engineering", customerPhone: "+92 300 1234567", customerAddress: "Korangi Industrial Area, Karachi", totalAmount: 68300, status: "pending", createdAt: "2026-08-28T09:30:00.000Z", items: [{ productId: "PRD-1001", productName: "Industrial Safety Helmet", quantity: 4, price: 2850 }, { productId: "PRD-1002", productName: "High-Visibility Work Vest", quantity: 5, price: 1650 }] },
  { _id: "66f001abc002", customerName: "Northline Contractors", customerPhone: "+92 321 7654321", customerAddress: "Gulberg, Lahore", totalAmount: 49500, status: "sent", createdAt: "2026-08-27T12:15:00.000Z", items: [{ productId: "PRD-2001", productName: "Cordless Impact Drill", quantity: 2, price: 24750 }] },
  { _id: "66f001abc003", customerName: "Crescent Facilities", customerPhone: "+92 333 4455667", customerAddress: "Blue Area, Islamabad", totalAmount: 35600, status: "completed", createdAt: "2026-08-24T10:45:00.000Z", items: [{ productId: "PRD-3004", productName: "Heavy-Duty Extension Cable", quantity: 4, price: 8900 }] },
]

async function clickButton(page, label) {
  await page.waitForFunction(
    (text) => [...document.querySelectorAll("button")].some((item) => item.textContent.trim().includes(text)),
    { timeout: 15000 },
    label,
  )
  const clicked = await page.evaluate((text) => {
    const button = [...document.querySelectorAll("button")].find((item) => item.textContent.trim().includes(text))
    if (!button) return false
    button.click()
    return true
  }, label)
  if (!clicked) throw new Error(`Button not found: ${label}`)
  await pause()
}

async function shot(page, name) {
  await page.evaluate(() => window.scrollTo(0, 0))
  await pause(300)
  await page.screenshot({ path: `${outputDir}/${name}.png`, fullPage: true })
  console.log(`${name}: ${page.url()}`)
}

async function visit(page, route) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector("body", { timeout: 15000 })
  await pause(4000)
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true })
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  })
  const page = await browser.newPage()
  page.setDefaultTimeout(30000)
  page.on("console", (message) => console.log(`browser:${message.type()}: ${message.text()}`))
  page.on("pageerror", (error) => console.log(`pageerror: ${error.message}`))
  page.on("requestfailed", (request) => console.log(`requestfailed: ${request.url()} ${request.failure()?.errorText || ""}`))

  await page.setRequestInterception(true)
  page.on("request", (request) => {
    const url = new URL(request.url())
    if (!url.pathname.startsWith("/api/")) return request.continue()
    let body = { ok: true }
    if (url.pathname === "/api/auth/session") body = { user: { id: "audit-manager", name: "Portal Manager", email: "admin@inventory.com", role: "manager", status: "active", allowedIps: [] }, expires: "2027-08-29T00:00:00.000Z" }
    else if (url.pathname === "/api/products") body = products
    else if (url.pathname === "/api/products/last-id") body = { lastId: "PRD-3004" }
    else if (url.pathname === "/api/products/check-id") body = { isUnique: true }
    else if (url.pathname === "/api/quotations") body = quotations
    return request.respond({ status: 200, contentType: "application/json", body: JSON.stringify(body) })
  })

  const token = await encode({
    secret: process.env.NEXTAUTH_SECRET,
    token: { id: "audit-manager", name: "Portal Manager", email: "admin@inventory.com", role: "manager", status: "active", allowedIps: [] },
  })
  await page.setCookie({ name: "next-auth.session-token", value: token, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" })

  if (scope === "all" || scope === "products") {
    await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 })
    await visit(page, "/products")
    await shot(page, "01-products-list-desktop")
    await clickButton(page, "View Details")
    await shot(page, "02-product-detail-desktop")
    await page.keyboard.press("Escape")
    await pause(500)
    const search = await page.waitForSelector('input[placeholder="Search products..."]', { timeout: 15000 })
    await search.type("nonexistent inventory item")
    await pause(900)
    await shot(page, "03-products-no-results-desktop")

  }

  if (scope === "all" || scope === "products" || scope === "products-mobile") {
    await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 })
    await visit(page, "/products")
    await page.waitForFunction(
      () => [...document.querySelectorAll("button")].some((item) => item.textContent.trim().includes("View Details")),
      { timeout: 15000 },
    )
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 })
    await pause(1200)
    await shot(page, "08-products-list-mobile")
    await clickButton(page, "View Details")
    await shot(page, "09-product-detail-mobile")
  }

  if (scope === "all" || scope === "quotations") {
    await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 })
    await visit(page, "/quotations")
    await clickButton(page, "View")
    await page.keyboard.press("Escape")
    await pause(400)
    await shot(page, "04-quotations-list-desktop")
    await clickButton(page, "View")
    await shot(page, "05-quotation-detail-desktop")
    await page.keyboard.press("Escape")
    await visit(page, "/quotations/create")
    await shot(page, "06-quotation-create-empty-desktop")
    await clickButton(page, "Add Item")
    await shot(page, "07-quotation-create-item-desktop")

  }

  if (scope === "all" || scope === "quotations" || scope === "quotations-mobile") {
    await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 })
    await visit(page, "/quotations")
    await page.waitForFunction(
      () => [...document.querySelectorAll("button")].some((item) => item.textContent.trim() === "View"),
      { timeout: 15000 },
    )
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 })
    await pause(1200)
    await clickButton(page, "View")
    await page.keyboard.press("Escape")
    await pause(400)
    await shot(page, "10-quotations-list-mobile")
    await clickButton(page, "View")
    await shot(page, "11-quotation-detail-mobile")
    await page.keyboard.press("Escape")
    await visit(page, "/quotations/create")
    await clickButton(page, "Add Item")
    await shot(page, "12-quotation-create-mobile")
  }

  if (scope === "quotation-item") {
    await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 })
    await visit(page, "/quotations/create")
    await page.evaluate(() => {
      const button = [...document.querySelectorAll("button")].find((item) => item.textContent.trim().includes("Add Item"))
      button?.click()
    })
    await page.waitForFunction(() => document.body.textContent.includes("Item #1"), { timeout: 5000 })
    await page.evaluate(() => {
      const item = [...document.querySelectorAll("span")].find((node) => node.textContent.trim() === "Item #1")
      item?.scrollIntoView({ block: "center" })
    })
    await page.screenshot({ path: `${outputDir}/07-quotation-create-item-desktop.png`, fullPage: false })
    console.log(`07-quotation-create-item-desktop: ${page.url()}`)
  }

  await browser.close()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
