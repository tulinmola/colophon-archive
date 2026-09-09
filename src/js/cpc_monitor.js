import colourFrom from "./colours.js"

// The window the emulator crops its own screenshots to, which is what lets a
// picture taken here and a screenshot taken there be compared sample for
// sample: PICTURE in colophon-player's src/js/emulator/cpc.js. The raster
// around it is border the tube overscans, sync and blanking.
const LEFT = 208,
  TOP = 34,
  SAMPLES = 768,
  HEIGHT = 272

// Sixteen samples to the microsecond make a sample half a pixel wide, which is
// what brings the window back to four by three, and is why the same pair holds
// one pixel in every mode the Gate Array widens: PICTURE in colophon-player's
// src/js/emulator/cpc.js.
const SAMPLES_PER_PIXEL = 2,
  WIDTH = SAMPLES / SAMPLES_PER_PIXEL

// Every value the Gate Array can put on the cable, which is the five bits the
// INKR command keeps: gate_array_rgb in the emulator's gate_array.c.
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
