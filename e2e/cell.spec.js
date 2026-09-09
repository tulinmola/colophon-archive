import { cell, standUp } from "./fixture.js"
import { expect, test } from "@playwright/test"

test("waits with its code folded until a reader asks", async function ({ page }) {
  const cells = [cell({ source: "return 2 + 2" })]

  await standUp(page, cells)

  await expect(page.locator("colophon-cell output")).toHaveText("not yet derived")
  await expect(page.locator("colophon-cell pre")).toBeHidden()
  await expect(page.locator("colophon-cell [data-derive]")).toBeVisible()
})

test("answers with what the code returned", async function ({ page }) {
  const cells = [cell({ source: "return 2 + 2" })]

  await standUp(page, cells)
  await page.locator("[data-derive]").click()

  await expect(page.locator("output")).toHaveText("4")
})

test("answers with the failure when the code raised one", async function ({ page }) {
  const cells = [cell({ source: "return missing.value" })]

  await standUp(page, cells)
  await page.locator("[data-derive]").click()

  await expect(page.locator("output")).toHaveText("ReferenceError: missing is not defined")
  await expect(page.locator("colophon-cell")).toHaveAttribute("data-state", "failed")
})

test("stands at a state a reader can see, from unasked to derived", async function ({ page }) {
  const cells = [cell({ source: "return 2 + 2" })]

  await standUp(page, cells)

  await expect(page.locator("colophon-cell")).toHaveAttribute("data-state", "unasked")

  await page.locator("[data-derive]").click()

  await expect(page.locator("colophon-cell")).toHaveAttribute("data-state", "derived")
})

test("gives the whole width to what it found, not to its controls", async function ({ page }) {
  const source = `const canvas = document.createElement("canvas")

canvas.width = 384
canvas.height = 100

return { image: canvas.toDataURL(), width: 384, height: 100 }`

  await page.setViewportSize({ width: 470, height: 600 })
  await standUp(page, [cell({ source })])
  await page.locator("[data-derive]").click()

  const picture = page.locator("output img")

  await expect(picture).toBeVisible()

  const size = await picture.evaluate(img => ({ shown: img.width, natural: img.naturalWidth }))

  expect(size.shown).toBe(size.natural)
})

test("scrolls a working too wide for the page rather than pushing the controls off it", async function ({
  page
}) {
  const wide = `return "${"x".repeat(400)}".length`,
    cells = [cell({ source: wide })]

  await standUp(page, cells)
  await page.locator("[data-fold]").click()

  const cellBox = await page.locator("colophon-cell").boundingBox(),
    blockBox = await page.locator("pre").boundingBox(),
    pageWidth = await page.evaluate(() => document.documentElement.scrollWidth)

  expect(blockBox.width).toBeLessThanOrEqual(cellBox.width)
  expect(pageWidth).toBeLessThanOrEqual(await page.evaluate(() => window.innerWidth))
})

test("unfolds the working when a reader asks to see it", async function ({ page }) {
  const cells = [cell({ source: "return 2 + 2" })]

  await standUp(page, cells)

  await expect(page.locator("colophon-cell pre")).toBeHidden()

  await page.locator("[data-fold]").click()

  await expect(page.locator("colophon-cell pre")).toBeVisible()
})

test("derives again when asked again, and takes back what rested on it", async function ({ page }) {
  const once = cell({ id: "once", source: "return (window.asked = (window.asked ?? 0) + 1)" }),
    resting = cell({ id: "resting", from: "once", source: "return once * 10" })

  await standUp(page, [once, resting])
  await page.locator("#resting [data-derive]").click()

  await expect(page.locator("#once output")).toHaveText("1")
  await expect(page.locator("#resting output")).toHaveText("10")

  await page.locator("#once [data-derive]").click()

  await expect(page.locator("#once output")).toHaveText("2")
  await expect(page.locator("#resting output")).toHaveText("not yet derived")
  await expect(page.locator("#resting")).toHaveAttribute("data-state", "unasked")
})

test("runs what it carries, not what it shows", async function ({ page }) {
  const dressed = `<colophon-cell source="return 41 + 1"><pre><code>nothing like it</code></pre></colophon-cell>`

  await standUp(page, [dressed])
  await page.locator("[data-derive]").click()

  await expect(page.locator("output")).toHaveText("42")
})

test("runs the source it was given, whatever stands in it", async function ({ page }) {
  const awkward = `return "<b>&</b>" + '</code>'`,
    cells = [cell({ source: awkward })]

  await standUp(page, cells)
  await page.locator("[data-derive]").click()

  await expect(page.locator("output")).toHaveText('"<b>&</b></code>"')
})

test("answers under the block of every cell it derived from, not only its own", async function ({
  page
}) {
  const two = cell({ id: "two", source: "return 2" }),
    sum = cell({ id: "sum", from: "two", source: "return two + 2" }),
    cells = [two, sum]

  await standUp(page, cells)
  await page.locator("#sum [data-derive]").click()

  await expect(page.locator("#two output")).toHaveText("2")
  await expect(page.locator("#sum output")).toHaveText("4")
})

test("refuses to derive from a cell written below it", async function ({ page }) {
  const asking = cell({ id: "asking", from: "later", source: "return later" }),
    later = cell({ id: "later", source: "return 2" }),
    cells = [asking, later]

  await standUp(page, cells)
  await page.locator("#asking [data-derive]").click()

  await expect(page.locator("#asking output")).toHaveText(
    "derives from later, which no cell above it is"
  )
})

test("reports an input that failed rather than running without it", async function ({ page }) {
  const broken = cell({ id: "broken", source: "return missing.value" }),
    resting = cell({ id: "resting", from: "broken", source: "return 1" }),
    cells = [broken, resting]

  await standUp(page, cells)
  await page.locator("#resting [data-derive]").click()

  await expect(page.locator("#resting output")).toHaveText("derives from broken, which failed")
})

test("derives a shared cell once, however many rest on it", async function ({ page }) {
  const counted = cell({
      id: "counted",
      source: "return (globalThis.runs = (globalThis.runs ?? 0) + 1)"
    }),
    first = cell({ id: "first", from: "counted", source: "return counted" }),
    second = cell({ id: "second", from: "counted", source: "return counted" }),
    cells = [counted, first, second]

  await standUp(page, cells)
  await page.locator("#first [data-derive]").click()
  await page.locator("#second [data-derive]").click()

  await expect(page.locator("#first output")).toHaveText("1")
  await expect(page.locator("#second output")).toHaveText("1")
})

test("shows again what it had already found when it is moved", async function ({ page }) {
  const cells = [cell({ id: "moved", source: "return 2" })]

  await standUp(page, cells)
  await page.locator("#moved [data-derive]").click()
  await expect(page.locator("#moved output")).toHaveText("2")

  await page.evaluate(function () {
    const moved = document.querySelector("#moved")

    document.body.append(moved)
  })

  await expect(page.locator("#moved output")).toHaveText("2")
  await expect(page.locator("#moved [data-derive]")).toHaveCount(1)
})

test("hands a cell the machine it says it uses", async function ({ page }) {
  const cells = [cell({ uses: "cpc", source: "return typeof cpc" })]

  await standUp(page, cells)
  await page.locator("[data-derive]").click()

  await expect(page.locator("output")).toHaveText('"function"')
})

test("refuses a machine the archive does not stand up", async function ({ page }) {
  const cells = [cell({ uses: "ghost", source: "return 1" })]

  await standUp(page, cells)
  await page.locator("[data-derive]").click()

  await expect(page.locator("output")).toHaveText(
    "uses ghost, which is no machine the archive stands up"
  )
})

test("shows a result that carries an image as a picture", async function ({ page }) {
  const pixel = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    source = `return { image: "${pixel}", width: 4, height: 2 }`,
    cells = [cell({ source })]

  await standUp(page, cells)
  await page.locator("[data-derive]").click()

  const picture = page.locator("output img")

  await expect(picture).toHaveAttribute("src", pixel)
  await expect(picture).toHaveAttribute("width", "4")
})

test("a cell written in a colophon becomes one on the page", async function ({ page }) {
  await page.goto("/playground/cells/")

  const cells = await page.locator("colophon-cell").count(),
    buttons = await page.locator("colophon-cell [data-derive]").count()

  expect(cells).toBeGreaterThan(0)
  expect(buttons).toBe(cells)
})
