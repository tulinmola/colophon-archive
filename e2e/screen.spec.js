import { cell, standUp } from "./fixture.js"
import { expect, test } from "@playwright/test"

// The colophon's own artifact, which is where a witness lives: no second copy
// is kept for the tests, and none is committed.
const SNAPSHOT = "/playground/abduction/abduction.sna"

async function pictureIn(page, id) {
  await page.locator(`#${id} button`).click()

  const picture = page.locator(`#${id} output img`)

  await expect(picture).toBeVisible({ timeout: 30000 })

  return page.evaluate(function (of) {
    const shown = document.querySelector(`#${of} output img`),
      canvas = document.createElement("canvas")

    canvas.width = shown.naturalWidth
    canvas.height = shown.naturalHeight

    const context = canvas.getContext("2d")

    context.drawImage(shown, 0, 0)

    const { data } = context.getImageData(0, 0, canvas.width, canvas.height),
      seen = new Set()

    for (let at = 0; at < data.length; at += 4) {
      seen.add((data[at] << 16) | (data[at + 1] << 8) | data[at + 2])
    }

    return { width: canvas.width, height: canvas.height, colours: seen.size }
  }, id)
}

test("reads a picture out of a machine's memory", async function ({ page }) {
  const source = `const machine = await cpc({ snapshot: "${SNAPSHOT}" }),
  inks = [0x1f, 0x14, 0x04, 0x0e, 0x18, 0x0c, 0x0d, 0x16, 0x00, 0x15, 0x07, 0x0f, 0x13, 0x1a, 0x0a, 0x0b]

machine.runFrames(149)

return machine.video({ start: 0xc000, characters: 51, rows: 20, rasters: 8, mode: 0, inks })`

  await standUp(page, [cell({ id: "written", uses: "cpc", source })])

  const drawn = await pictureIn(page, "written")

  expect(drawn.width).toBe(408)
  expect(drawn.height).toBe(160)
  expect(drawn.colours).toBeGreaterThan(1)
})

test("reads what the machine says when the code says nothing", async function ({ page }) {
  const source = `const machine = await cpc({ snapshot: "${SNAPSHOT}" })

machine.runFrames(149)

return machine.video()`

  await standUp(page, [cell({ id: "asked", uses: "cpc", source })])

  const drawn = await pictureIn(page, "asked")

  expect(drawn.width).toBe(400)
  expect(drawn.height).toBe(40)
})

test("shows what the tube was given, every band of it", async function ({ page }) {
  const source = `const machine = await cpc({ snapshot: "${SNAPSHOT}", monitor: true })

machine.runFrames(200)

return machine.monitor()`

  await standUp(page, [cell({ id: "shown", uses: "cpc", source })])

  const drawn = await pictureIn(page, "shown")

  expect(drawn.width).toBe(384)
  expect(drawn.height).toBe(272)
  expect(drawn.colours).toBeGreaterThan(5)
})

test("refuses a picture of a tube that was never plugged in", async function ({ page }) {
  const source = `const machine = await cpc({ snapshot: "${SNAPSHOT}" })

return machine.monitor()`

  await standUp(page, [cell({ id: "unplugged", uses: "cpc", source })])
  await page.locator("#unplugged button").click()

  await expect(page.locator("#unplugged output")).toHaveText(/no monitor plugged in/u)
})
