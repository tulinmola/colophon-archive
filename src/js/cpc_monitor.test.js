import { describe, expect, it } from "vitest"
import cpcMonitorFrom from "./cpc_monitor.js"

const RASTER = 1024,
  LINES = 312,
  LEFT = 208,
  TOP = 34,
  RED = 0,
  BLUE = 2

function tubeFrom(painted, rgb = code => code) {
  const framebuffer = new Uint8Array(RASTER * LINES)

  for (const [at, code] of Object.entries(painted)) {
    framebuffer[at] = code
  }

  return cpcMonitorFrom(framebuffer, { raster: RASTER, rgb })
}

function channelAt(picture, channel, x, y) {
  return picture.pixels[(y * picture.width + x) * 4 + channel]
}

describe("cpcMonitorFrom", function () {
  it("takes the window the emulator crops its own screenshots to", function () {
    const picture = tubeFrom({})

    expect(picture.width).toBe(384)
    expect(picture.height).toBe(272)
  })

  it("begins at the window's corner and not the raster's", function () {
    const picture = tubeFrom({ [TOP * RASTER + LEFT]: 26 })

    expect(channelAt(picture, BLUE, 0, 0)).toBe(26)
    expect(channelAt(picture, BLUE, 1, 0)).toBe(0)
  })

  it("makes one pixel of the pair of samples a pixel is wide", function () {
    const picture = tubeFrom({ [TOP * RASTER + LEFT + 2]: 26 })

    expect(channelAt(picture, BLUE, 1, 0)).toBe(26)
  })

  it("steps a whole raster between lines, the sync and the border with it", function () {
    const picture = tubeFrom({ [(TOP + 1) * RASTER + LEFT]: 26 })

    expect(channelAt(picture, BLUE, 0, 1)).toBe(26)
  })

  it("asks what colour a sample was rather than showing the code", function () {
    const picture = tubeFrom({ [TOP * RASTER + LEFT]: 26 }, code => code << 16)

    expect(channelAt(picture, RED, 0, 0)).toBe(26)
    expect(channelAt(picture, BLUE, 0, 0)).toBe(0)
  })
})
