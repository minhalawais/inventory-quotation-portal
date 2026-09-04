const fs = require("fs")
const path = require("path")
const puppeteer = require("puppeteer")

const baseUrl = process.env.UI_BASE_URL || "http://localhost:3001"
const outputDir = path.join(process.cwd(), "tmp", "ui-final")
const executablePath = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
const skipAuth = process.env.SKIP_AUTH === "1"

const viewports = [
  { name: "320", width: 320, height: 812 },
  { name: "375", width: 375, height: 812 },
  { name: "430", width: 430, height: 932 },
  { name: "768", width: 768, height: 1024 },
  { name: "1024", width: 1024, height: 768 },
  { name: "1280", width: 1280, height: 900 },
  { name: "1440", width: 1440, height: 900 },
  { name: "1920", width: 1920, height: 1080 },
]

async function settle(page) {
  await page.waitForNetworkIdle({ idleTime: 500, timeout: 5000 }).catch(() => null)
  await new Promise((resolve) => setTimeout(resolve, 500))
}

async function assertNoHorizontalOverflow(page, label) {
  let overflow
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      overflow = await page.evaluate(() => {
        const doc = document.documentElement
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          bodyScrollWidth: document.body.scrollWidth,
          bodyClientWidth: document.body.clientWidth,
        }
      })
      break
    } catch (error) {
      await settle(page)
      if (attempt === 2) throw error
    }
  }

  if (overflow.scrollWidth > overflow.clientWidth + 1 || overflow.bodyScrollWidth > overflow.bodyClientWidth + 1) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(overflow)}`)
  }
}

async function captureRoute(page, route, name) {
  for (const viewport of viewports) {
    console.log(`capture ${name}-${viewport.name}`)
    await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 })
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 20000 }).catch((error) => {
      if (!String(error.message || error).includes("ERR_ABORTED")) throw error
    })
    await page.evaluate(() => {
      document.documentElement.style.zoom = ""
    }).catch(() => null)
    await settle(page)
    await assertNoHorizontalOverflow(page, `${name}-${viewport.name}`)
    await page.screenshot({
      path: path.join(outputDir, `${name}-${viewport.name}.png`),
      fullPage: true,
    })
  }
}

async function captureZoom(page, route, name, width, height, zoom) {
  console.log(`capture ${name}-${Math.round(zoom * 100)}zoom`)
  await page.setViewport({ width, height, deviceScaleFactor: 1 })
  await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 20000 }).catch((error) => {
    if (!String(error.message || error).includes("ERR_ABORTED")) throw error
  })
  await page.evaluate((value) => {
    document.documentElement.style.zoom = value
  }, String(zoom))
  await settle(page)
  await assertNoHorizontalOverflow(page, `${name}-${Math.round(zoom * 100)}zoom`)
  await page.screenshot({
    path: path.join(outputDir, `${name}-${Math.round(zoom * 100)}zoom.png`),
    fullPage: true,
  })
}

async function trySignIn(page, account) {
  await page.goto(`${baseUrl}/auth/signin`, { waitUntil: "load", timeout: 20000 })
  await settle(page)
  await page.click("#email", { clickCount: 3 })
  await page.type("#email", account.email)
  await page.click("#password", { clickCount: 3 })
  await page.type("#password", account.password)
  await page.click('button[type="submit"]')
  await page.waitForFunction(() => !window.location.pathname.startsWith("/auth/signin"), { timeout: 15000 }).catch(() => null)
  await settle(page)
  return new URL(page.url()).pathname
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true })
  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  })

  try {
    const page = await browser.newPage()
    await page.deleteCookie(...(await page.cookies(baseUrl)))
    const summary = {
      baseUrl,
      outputDir,
      captures: [],
      auth: {},
    }

    await captureRoute(page, "/auth/signin", "signin")
    summary.captures.push("signin")

    await captureZoom(page, "/auth/signin", "signin-desktop", 1440, 900, 1.25)
    await captureZoom(page, "/auth/signin", "signin-desktop", 1440, 900, 2)
    await captureZoom(page, "/auth/signin", "signin-mobile", 375, 812, 1.25)
    summary.captures.push("signin zoom 125/200")

    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
    console.log("capture signin-invalid")
    await page.goto(`${baseUrl}/auth/signin`, { waitUntil: "load", timeout: 20000 })
    await page.evaluate(() => {
      document.documentElement.style.zoom = ""
    }).catch(() => null)
    await settle(page)
    await page.waitForSelector("#email", { timeout: 10000 }).catch(() => {
      throw new Error(`Sign-in form did not render on ${page.url()}`)
    })
    await page.type("#email", "invalid@example.com")
    await page.type("#password", "wrong-password")
    await page.click('button[type="submit"]')
    await page.waitForSelector('[role="alert"]', { timeout: 35000 }).catch(() => null)
    await settle(page)
    await assertNoHorizontalOverflow(page, "signin-invalid")
    await page.screenshot({ path: path.join(outputDir, "signin-invalid.png"), fullPage: true })
    summary.captures.push("signin invalid")

    await captureRoute(page, "/auth/inactive", "inactive")
    await captureRoute(page, "/restricted", "restricted")
    summary.captures.push("inactive", "restricted")

    if (skipAuth) {
      summary.auth.skipped = "SKIP_AUTH=1"
    } else {
      const accounts = [
        { role: "manager", email: "admin@inventory.com", password: "admin123", expected: "/dashboard" },
        { role: "rider", email: "rider@inventory.com", password: "rider123", expected: "/products" },
        { role: "product_manager", email: "p_manager@gmail.com", password: "password123", expected: "/products" },
      ]

      for (const account of accounts) {
        await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
        console.log(`auth ${account.role}`)
        const landed = await trySignIn(page, account)
        summary.auth[account.role] = { expected: account.expected, landed }
        if (landed === account.expected) {
          await assertNoHorizontalOverflow(page, `${account.role}-landing`)
          await page.screenshot({ path: path.join(outputDir, `${account.role}-landing.png`), fullPage: true })
          const navLabels = await page.$$eval("nav a", (links) => links.map((link) => link.textContent?.trim()).filter(Boolean))
          summary.auth[account.role].navLabels = navLabels
          await page.goto(`${baseUrl}/api/auth/signout`, { waitUntil: "load", timeout: 10000 }).catch(() => null)
        }
      }
    }

    fs.writeFileSync(path.join(outputDir, "summary.json"), JSON.stringify(summary, null, 2))
    console.log(JSON.stringify(summary, null, 2))
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
