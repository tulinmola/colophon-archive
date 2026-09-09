import { describe, expect, it } from "vitest"
import cpcVideoFrom from "./cpc_video.js"

const INKS = Array.from({ length: 16 }, (unused, pen) => pen),
  BLUE = 2

function screenFrom(bytes, mode) {
  const ram = new Uint8Array(0x4000)

  for (const [at, byte] of Object.entries(bytes)) {
    ram[at] = byte
  }

  return cpcVideoFrom(ram, {
    start: 0,
    characters: 40,
    rows: 25,
    rasters: 8,
    mode,
    inks: INKS,
    rgb: pen => pen
  })
}

function pensAcross(screen, line, count) {
  const across = 4 / count,
    pens = []

  for (let pixel = 0; pixel < count; pixel++) {
    pens.push(screen.pixels[(line * screen.width + pixel * across) * 4 + BLUE])
  }

  return pens
}

describe("cpcVideoFrom", function () {
  it("reads two pens from a byte in mode 0, from the bits the chip reads them from", function () {
    const screen = screenFrom({ 0: 0xaa }, 0),
      pens = pensAcross(screen, 0, 2)

    expect(pens).toEqual([15, 0])
  })

  it("reads the other two in mode 0 from the bits between them", function () {
    const screen = screenFrom({ 0: 0x55 }, 0),
      pens = pensAcross(screen, 0, 2)

    expect(pens).toEqual([0, 15])
  })

  it("reads four pens from a byte in mode 1", function () {
    const screen = screenFrom({ 0: 0x88 }, 1),
      pens = pensAcross(screen, 0, 4)

    expect(pens).toEqual([3, 0, 0, 0])
  })

  it("finds the next line of a character row two kilobytes on", function () {
    const screen = screenFrom({ 0x800: 0xaa }, 0),
      pens = pensAcross(screen, 1, 2)

    expect(pens).toEqual([15, 0])
  })

  it("is as wide whatever the mode, because a wider pixel takes more of the byte", function () {
    const fewer = screenFrom({}, 0),
      more = screenFrom({}, 1)

    expect(fewer.width).toBe(320)
    expect(more.width).toBe(320)
    expect(fewer.height).toBe(200)
  })

  it("takes its size from the CRTC's own counts", function () {
    const strip = cpcVideoFrom(new Uint8Array(0x4000), {
      start: 0,
      characters: 50,
      rows: 20,
      rasters: 2,
      mode: 0,
      inks: INKS,
      rgb: pen => pen
    })

    expect(strip.width).toBe(400)
    expect(strip.height).toBe(40)
  })

  it("refuses a reading it was not told the counts for", function () {
    const ram = new Uint8Array(0x4000)

    expect(() => cpcVideoFrom(ram, { start: 0, mode: 0, inks: INKS })).toThrow(
      /taken by characters/u
    )
  })

  it("refuses a mode it does not read", function () {
    expect(() => screenFrom({ 0: 0 }, 2)).toThrow(/mode 2/u)
  })
})
