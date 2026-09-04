const fs = require("fs")
const path = require("path")
const puppeteer = require("puppeteer")

const baseUrl = "http://localhost:3001"
const outputDir = path.join(process.cwd(), "tmp", "ui-baseline")
const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
  { name: "wide", width: 1920, height: 1080 },
]

async function capture(page, name) {
  for (const viewport of viewports) {
    console.log(`capturing ${name}-${viewport.name}`)
    await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 })
    await page.goto(`${baseUrl}${name === "signin" ? "/auth/signin" : "/dashboard"}`, {
      waitUntil: "load",
      timeout: 15000,
    })
    await new Promise((resolve) => setTimeout(resolve, 1200))
    await page.screenshot({
      path: path.join(outputDir, `${name}-${viewport.name}.png`),
      fullPage: true,
    })
  }
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true })
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  })
  console.log("browser launched")
  const page = await browser.newPage()

  await capture(page, "signin")

  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
  await page.goto(`${baseUrl}/auth/signin`, { waitUntil: "load", timeout: 15000 })
  await page.type("#email", "admin@inventory.com")
  await page.type("#password", "admin123")
  await page.click('button[type="submit"]')
  await page
    .waitForFunction(() => window.location.pathname === "/dashboard", { timeout: 20000 })
    .catch(() => null)

  const managerUrl = page.url()
  if (managerUrl.includes("/dashboard")) {
    await capture(page, "dashboard")
  }

  console.log(JSON.stringify({ outputDir, managerUrl }))
  await browser.close()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
