import cpcFrom from "./emulator/index.js"
import cpcMonitorFrom from "./cpc_monitor.js"
import cpcVideoFrom from "./cpc_video.js"
import imageFrom from "./image.js"

const RAM_BYTES = { 464: 0x10000, 664: 0x10000, 6128: 0x20000 }

async function fetchBytes(name) {
  const response = await fetch(name)

  if (!response.ok) {
    throw new Error(`${name}: ${response.status}`)
  }

  const bytes = await response.arrayBuffer()

  return new Uint8Array(bytes)
}

// The Gate Array holds a hardware colour code for each of the sixteen pens
// and one more for the border, which the screen never shows: gate_array_t.inks
// in the emulator's gate_array.h.
const PENS = 16

function inksIn(machine) {
  return Array.from({ length: PENS }, (unused, pen) => machine.ink(pen))
}

async function cpc({ model = 6128, snapshot, monitor: connected = false }) {
  const ramBytes = RAM_BYTES[model]

  if (!ramBytes) {
    throw new Error(`${model} is not a CPC this stands up`)
  }

  const bytes = await fetchBytes(snapshot),
    machine = await cpcFrom({ snapshot: bytes, ramBytes, monitor: connected })

  return {
    ram: machine.ram,
    runFrames: machine.runFrames,
    video: function (options) {
      const drawn = cpcVideoFrom(machine.ram, {
        start: machine.videoStart(),
        characters: machine.videoCharacters(),
        rows: machine.videoRows(),
        rasters: machine.videoRasters(),
        mode: machine.videoMode(),
        inks: inksIn(machine),
        ...options,
        rgb: machine.rgb
      })

      return imageFrom(drawn)
    },
    monitor: function () {
      if (!connected) {
        throw new Error("this machine was stood up with no monitor plugged in")
      }

      const drawn = cpcMonitorFrom(machine.framebuffer, {
        raster: machine.raster,
        rgb: machine.rgb
      })

      return imageFrom(drawn)
    }
  }
}

export default { cpc }
