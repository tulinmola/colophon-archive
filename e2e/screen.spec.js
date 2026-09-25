import { cell, standUp } from "./fixture"
import { expect, test } from "@playwright/test"

const SNAPSHOT = "/playground/abduction/abduction.sna"

async function pictureIn(page, id) {
  await page.locator(`#${id} [data-derive]`).click()

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
  await page.locator("#unplugged [data-derive]").click()

  await expect(page.locator("#unplugged output")).toHaveText(/no monitor plugged in/u)
})

// LD A,#42 / LD (&4000),A / RET
const ROUTINE = "0x3e, 0x42, 0x32, 0x00, 0x40, 0xc9"

test("calls a routine the machine holds, and comes back", async function ({ page }) {
  const source = `const machine = await cpc({ snapshot: "${SNAPSHOT}" })

machine.ram.set([${ROUTINE}], 0x4100)

machine.call(0x4100)

return machine.ram[0x4000]`

  await standUp(page, [cell({ id: "called", uses: "cpc", source })])
  await page.locator("#called [data-derive]").click()

  await expect(page.locator("#called output")).toHaveText("66")
})

test("gives up on a routine that never returns", async function ({ page }) {
  const source = `const machine = await cpc({ snapshot: "${SNAPSHOT}" })

machine.ram.set([0x18, 0xfe], 0x4100)

machine.call(0x4100)

return "never reached"`

  await standUp(page, [cell({ id: "endless", uses: "cpc", source })])
  await page.locator("#endless [data-derive]").click()

  await expect(page.locator("#endless output")).toHaveText(
    "Error: &4100 did not return within a frame"
  )
})

test("hands a call the registers it names, and answers with them", async function ({ page }) {
  // PUSH IX / POP HL / RET. Under DD both halves of an HL operand become IX
  // halves, so there is no LD H,IXH to encode.
  const source = `const machine = await cpc({ snapshot: "${SNAPSHOT}" })

machine.ram.set([0xdd, 0xe5, 0xe1, 0xc9], 0x4100)

const answer = machine.call(0x4100, { ix: 0xabcd, interrupts: false })

return answer.hl`

  await standUp(page, [cell({ id: "given", uses: "cpc", source })])
  await page.locator("#given [data-derive]").click()

  await expect(page.locator("#given output")).toHaveText("43981")
})

test("refuses a register the machine does not keep", async function ({ page }) {
  const source = `const machine = await cpc({ snapshot: "${SNAPSHOT}" })

machine.ram.set([0xc9], 0x4100)

return machine.call(0x4100, { hx: 1 })`

  await standUp(page, [cell({ id: "unknown", uses: "cpc", source })])
  await page.locator("#unknown [data-derive]").click()

  await expect(page.locator("#unknown output")).toHaveText(
    "Error: hx is no register a call is given"
  )
})

test("stands a machine at a state another cell handed it", async function ({ page }) {
  const kept = `const machine = await cpc({ snapshot: "${SNAPSHOT}" })

machine.ram[0x4000] = 0x5a

return { state: machine.state() }`,
    again = `const machine = await cpc({ state: kept.state })

return machine.ram[0x4000]`

  await standUp(page, [
    cell({ id: "kept", uses: "cpc", source: kept }),
    cell({ id: "again", from: "kept", uses: "cpc", source: again })
  ])
  await page.locator("#again [data-derive]").click()

  await expect(page.locator("#again output")).toHaveText("90")
})
