import { cell, standUp } from "./fixture"
import { expect, test } from "@playwright/test"

test("makes a GIF of the frames it is given, each held as long as it says", async function ({
  page
}) {
  const source = `function filled(colour) {
  const canvas = document.createElement("canvas")

  canvas.width = 4
  canvas.height = 2

  const context = canvas.getContext("2d")

  context.fillStyle = colour
  context.fillRect(0, 0, 4, 2)

  return canvas.toDataURL("image/png")
}

return gif([
  { image: filled("#0000ff"), hundredths: 4 },
  { image: filled("#ff0000"), hundredths: 8 }
])`

  await standUp(page, [cell({ id: "animated", uses: "gif", source })])
  await page.locator("#animated [data-derive]").click()

  const picture = page.locator("#animated output img")

  await expect(picture).toBeVisible()

  const decoded = await picture.evaluate(async function (shown) {
    const response = await fetch(shown.src),
      data = await response.arrayBuffer(),
      decoder = new ImageDecoder({ data, type: "image/gif" })

    await decoder.tracks.ready

    const frames = decoder.tracks.selectedTrack.frameCount,
      durations = []

    for (let index = 0; index < frames; index++) {
      const { image } = await decoder.decode({ frameIndex: index })

      durations.push(image.duration)
    }

    return { width: shown.naturalWidth, height: shown.naturalHeight, durations }
  })

  expect(decoded).toEqual({ width: 4, height: 2, durations: [40000, 80000] })
})
