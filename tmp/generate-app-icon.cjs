const React = require("react")
const { renderToStaticMarkup } = require("react-dom/server")
const { Boxes } = require("lucide-react")
const { createCanvas, loadImage } = require("canvas")
const fs = require("fs")

async function main() {
  const size = 512
  const canvas = createCanvas(size, size)
  const context = canvas.getContext("2d")
  context.fillStyle = "#111827"
  context.fillRect(0, 0, size, size)

  const markup = renderToStaticMarkup(
    React.createElement(Boxes, {
      width: 296,
      height: 296,
      color: "#ffffff",
      strokeWidth: 1.7,
    }),
  )
  const icon = await loadImage(`data:image/svg+xml;base64,${Buffer.from(markup).toString("base64")}`)
  context.drawImage(icon, 108, 108, 296, 296)
  fs.writeFileSync("public/icon.png", canvas.toBuffer("image/png"))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
