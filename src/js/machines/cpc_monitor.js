import colourFrom from "./colours"

// PICTURE in colophon-player's src/js/emulator/cpc.js: the window the emulator
// crops its own screenshots to.
const LEFT = 208,
  TOP = 34,
  SAMPLES = 768,
  HEIGHT = 272

// PICTURE in colophon-player's src/js/emulator/cpc.js: a sample is half a
// pixel wide.
const SAMPLES_PER_PIXEL = 2,
  WIDTH = SAMPLES / SAMPLES_PER_PIXEL

// gate_array_rgb in the emulator's gate_array.c: the five bits INKR keeps.
const COLOUR_CODES = 32

function cpcMonitorFrom(framebuffer, { raster, rgb }) {
  const colours = Array.from({ length: COLOUR_CODES }, (unused, code) => colourFrom(rgb, code)),
    pixels = new Uint8ClampedArray(WIDTH * HEIGHT * 4)

  let at = 0

  for (let line = 0; line < HEIGHT; line++) {
    const from = (TOP + line) * raster + LEFT

    for (let pixel = 0; pixel < WIDTH; pixel++) {
      const [red, green, blue] = colours[framebuffer[from + pixel * SAMPLES_PER_PIXEL]]

      pixels[at] = red
      pixels[at + 1] = green
      pixels[at + 2] = blue
      pixels[at + 3] = 0xff
      at += 4
    }
  }

  return { pixels, width: WIDTH, height: HEIGHT }
}

export default cpcMonitorFrom
