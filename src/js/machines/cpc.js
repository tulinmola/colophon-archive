import { answeredBy, writeRegister } from "./z80"
import cpcFrom from "../emulator"
import cpcMonitorFrom from "./cpc_monitor"
import cpcVideoFrom from "./cpc_video"
import imageFrom from "../image"

const RAM_BYTES = { 464: 0x10000, 664: 0x10000, 6128: 0x20000 }

// gate_array_t.inks in the emulator's gate_array.h holds seventeen: sixteen
// pens and the border, which no screen reading shows.
const PENS = 16

async function fetchBytes(name) {
  const response = await fetch(name)

  if (!response.ok) {
    throw new Error(`${name}: ${response.status}`)
  }

  const bytes = await response.arrayBuffer()

  return new Uint8Array(bytes)
}

class Cpc {
  #connected
  #machine

  constructor(machine, connected) {
    this.#machine = machine
    this.#connected = connected
  }

  get ram() {
    return this.#machine.ram
  }

  rgb(code) {
    return this.#machine.rgb(code)
  }

  runFrames(frames) {
    this.#machine.runFrames(frames)
  }

  call(address, options) {
    const { interrupts = true, withinFrames = 1, ...wanted } = options ?? {},
      machine = this.#machine

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
  }

  video(options) {
    const machine = this.#machine,
      drawn = cpcVideoFrom(machine.ram, {
        start: machine.videoStart(),
        characters: machine.videoCharacters(),
        rows: machine.videoRows(),
        rasters: machine.videoRasters(),
        mode: machine.videoMode(),
        inks: this.#inks(),
        ...options,
        rgb: machine.rgb
      })

    return imageFrom(drawn)
  }

  monitor() {
    if (!this.#connected) {
      throw new Error("this machine was stood up with no monitor plugged in")
    }

    const machine = this.#machine,
      drawn = cpcMonitorFrom(machine.framebuffer, {
        raster: machine.raster,
        rgb: machine.rgb
      })

    return imageFrom(drawn)
  }

  #inks() {
    const machine = this.#machine

    return Array.from({ length: PENS }, (unused, pen) => machine.ink(pen))
  }
}

async function cpc({ model = 6128, snapshot, monitor = false }) {
  const ramBytes = RAM_BYTES[model]

  if (!ramBytes) {
    throw new Error(`${model} is not a CPC this stands up`)
  }

  const bytes = await fetchBytes(snapshot),
    machine = await cpcFrom({ snapshot: bytes, ramBytes, monitor })

  return new Cpc(machine, monitor)
}

export default cpc
