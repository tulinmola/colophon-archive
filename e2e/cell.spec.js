import { cell, standUp } from "./fixture.js"
import { expect, test } from "@playwright/test"

test("waits with its code folded until a reader asks", async function ({ page }) {
  const cells = [cell({ source: "return 2 + 2" })]

  await standUp(page, cells)

  await expect(page.locator("colophon-cell output")).toHaveText("not yet derived")
  await expect(page.locator("colophon-cell pre")).toBeHidden()
  await expect(page.locator("colophon-cell button")).toBeVisible()
})

test("answers with what the code returned", async function ({ page }) {
  const cells = [cell({ source: "return 2 + 2" })]

  await standUp(page, cells)
  await page.locator("button").click()

  await expect(page.locator("output")).toHaveText("4")
})

test("answers with the failure when the code raised one", async function ({ page }) {
  const cells = [cell({ source: "return missing.value" })]

  await standUp(page, cells)
  await page.locator("button").click()

  await expect(page.locator("output")).toHaveText("ReferenceError: missing is not defined")
  await expect(page.locator("output")).toHaveClass(/failed/u)
})

test("keeps the source it was given, whatever stands in it", async function ({ page }) {
  const awkward = `return "<b>&</b>" + '</code>'`,
    cells = [cell({ source: awkward })]

  await standUp(page, cells)

  await expect(page.locator("colophon-cell pre")).toHaveText(awkward)
})

test("answers under the block of every cell it derived from, not only its own", async function ({
  page
}) {
  const two = cell({ id: "two", source: "return 2" }),
    sum = cell({ id: "sum", from: "two", source: "return two + 2" }),
    cells = [two, sum]

  await standUp(page, cells)
  await page.locator("#sum button").click()

  await expect(page.locator("#two output")).toHaveText("2")
  await expect(page.locator("#sum output")).toHaveText("4")
})

test("refuses to derive from a cell written below it", async function ({ page }) {
  const asking = cell({ id: "asking", from: "later", source: "return later" }),
    later = cell({ id: "later", source: "return 2" }),
    cells = [asking, later]

  await standUp(page, cells)
  await page.locator("#asking button").click()

  await expect(page.locator("#asking output")).toHaveText(
    "derives from later, which no cell above it is"
  )
})

test("reports an input that failed rather than running without it", async function ({ page }) {
  const broken = cell({ id: "broken", source: "return missing.value" }),
    resting = cell({ id: "resting", from: "broken", source: "return 1" }),
    cells = [broken, resting]

  await standUp(page, cells)
  await page.locator("#resting button").click()

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
  await page.locator("#first button").click()
  await page.locator("#second button").click()

  await expect(page.locator("#first output")).toHaveText("1")
  await expect(page.locator("#second output")).toHaveText("1")
})

test("shows again what it had already found when it is moved", async function ({ page }) {
  const cells = [cell({ id: "moved", source: "return 2" })]

  await standUp(page, cells)
  await page.locator("#moved button").click()
  await expect(page.locator("#moved output")).toHaveText("2")

  await page.evaluate(function () {
    const moved = document.querySelector("#moved")

    document.body.append(moved)
  })

  await expect(page.locator("#moved output")).toHaveText("2")
  await expect(page.locator("#moved button")).toHaveCount(1)
})

test("hands a cell the machine it says it uses", async function ({ page }) {
  const cells = [cell({ uses: "cpc", source: "return typeof cpc" })]

  await standUp(page, cells)
  await page.locator("button").click()

  await expect(page.locator("output")).toHaveText('"function"')
})

test("refuses a machine the archive does not stand up", async function ({ page }) {
  const cells = [cell({ uses: "ghost", source: "return 1" })]

  await standUp(page, cells)
  await page.locator("button").click()

  await expect(page.locator("output")).toHaveText(
    "uses ghost, which is no machine the archive stands up"
  )
})

test("shows a result that carries an image as a picture", async function ({ page }) {
  const pixel = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    source = `return { image: "${pixel}", width: 4, height: 2 }`,
    cells = [cell({ source })]

  await standUp(page, cells)
  await page.locator("button").click()

  const picture = page.locator("output img")

  await expect(picture).toHaveAttribute("src", pixel)
  await expect(picture).toHaveAttribute("width", "4")
})

test("a cell written in a colophon becomes one on the page", async function ({ page }) {
  await page.goto("/playground/cells/")

  const cells = await page.locator("colophon-cell").count(),
    buttons = await page.locator("colophon-cell button").count()

  expect(cells).toBeGreaterThan(0)
  expect(buttons).toBe(cells)
})
