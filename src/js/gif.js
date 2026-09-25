import { applyPalette, GIFEncoder as gifEncoder, quantize } from "./vendor/gifenc-1.0.3.mjs"

// writeFrame in gifenc (https://github.com/mattdesl/gifenc) takes its delay in
// milliseconds, and stores it in GIF89a's unit, hundredths of a second.
const MILLISECONDS_PER_HUNDREDTH = 10,
  COLOURS = 256

async function pixelsOf(image) {
  const picture = new Image()

  picture.src = image
  await picture.decode()

  const canvas = document.createElement("canvas")

  canvas.width = picture.naturalWidth
  canvas.height = picture.naturalHeight

  const context = canvas.getContext("2d")

  context.drawImage(picture, 0, 0)

  return context.getImageData(0, 0, canvas.width, canvas.height)
}

function dataUrlOf(bytes) {
  const blob = new Blob([bytes], { type: "image/gif" }),
    reader = new FileReader()

  return new Promise(function (resolve) {
    reader.addEventListener("load", () => resolve(reader.result))
    reader.readAsDataURL(blob)
  })
}

async function gif(frames) {
  const encoder = gifEncoder()

  for (const { image, hundredths } of frames) {
    const { data, width, height } = await pixelsOf(image),
      palette = quantize(data, COLOURS),
      indices = applyPalette(data, palette)

    encoder.writeFrame(indices, width, height, {
      palette,
      delay: hundredths * MILLISECONDS_PER_HUNDREDTH
    })
  }

  encoder.finish()

  const bytes = encoder.bytes(),
    image = await dataUrlOf(bytes)

  return { image }
}

export default gif
