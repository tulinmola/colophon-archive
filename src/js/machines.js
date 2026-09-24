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

// gate_array_t.inks in the emulator's gate_array.h holds seventeen: sixteen
// pens and the border, which no screen reading shows.
const PENS = 16

function inksIn(machine) {
  return Array.from({ length: PENS }, (unused, pen) => machine.ink(pen))
}

// The order archive.c keeps them in.
const HALVES = { a: 0, f: 1, b: 2, c: 3, d: 4, e: 5, h: 6, l: 7, ixh: 8, ixl: 9, iyh: 10, iyl: 11 }

const PAIRS = {
  af: ["a", "f"],
  bc: ["b", "c"],
  de: ["d", "e"],
  hl: ["h", "l"],
  ix: ["ixh", "ixl"],
  iy: ["iyh", "iyl"]
}

function writeRegister(registers, name, value) {
  const pair = PAIRS[name]

  if (pair) {
    const [high, low] = pair

    registers[HALVES[high]] = value >> 8
    registers[HALVES[low]] = value & 0xff

    return
  }

  const half = HALVES[name],
    kept = half != null

  if (!kept) {
    throw new Error(`${name} is no register a call is given`)
  }

  registers[half] = value
}

function answeredBy(registers) {
  const answer = {}

  for (const [name, at] of Object.entries(HALVES)) {
    answer[name] = registers[at]
  }

  for (const [name, [high, low]] of Object.entries(PAIRS)) {
    answer[name] = (registers[HALVES[high]] << 8) | registers[HALVES[low]]
  }

  return answer
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
    call: function (address, options) {
      const { interrupts = true, withinFrames = 1, ...wanted } = options ?? {}

      machine.readRegisters()

      for (const [name, value] of Object.entries(wanted)) {
        writeRegister(machine.registers, name, value)
      }

      const returned = machine.call(address, interrupts, withinFrames)
      if (!returned) {
        const named = address.toString(16).toUpperCase(),
          waited = withinFrames == 1 ? "a frame" : `${withinFrames} frames`

        throw new Error(`&${named} did not return within ${waited}`)
      }

      return answeredBy(machine.registers)
    },
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
