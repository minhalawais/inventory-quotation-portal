const fs = require("fs")
const { createCanvas, loadImage } = require("canvas")

async function main() {
  const image = await loadImage("public/kk-operations-login-source.png")
  const width = Math.min(1600, image.width)
  const height = Math.round((image.height * width) / image.width)
  const canvas = createCanvas(width, height)
  const context = canvas.getContext("2d")

  context.drawImage(image, 0, 0, width, height)
  fs.writeFileSync(
    "public/kk-operations-login.jpg",
    canvas.toBuffer("image/jpeg", {
      quality: 0.86,
      progressive: true,
      chromaSubsampling: true,
    }),
  )

  console.log(`${image.width}x${image.height} -> ${width}x${height}`)
  console.log(`${fs.statSync("public/kk-operations-login.jpg").size} bytes`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
