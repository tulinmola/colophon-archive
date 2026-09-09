import colourFrom from "./colours.js"

// The Gate Array puts sixteen samples on the cable for each character the
// CRTC counts out, and a character is two bytes; a mode decides how many of
// those sixteen a pixel keeps, never how many there are. See "The Gate Array"
// (https://www.grimware.org/doku.php/documentations/devices/gatearray) and
// GATE_ARRAY_SAMPLES_PER_CHARACTER in the emulator's gate_array.h.
const SAMPLES_PER_BYTE = 8,
  BYTES_PER_CHARACTER = 2

// Sixteen samples to the microsecond make a sample half a pixel wide, which is
// what brings a picture back to four by three: PICTURE in colophon-player's
// src/js/emulator/cpc.js. So a byte is four pixels across however the mode
// divides them, and the firmware's eighty bytes are the three hundred and
// twenty of mode 1.
const SAMPLES_PER_PIXEL = 2,
  PIXELS_PER_BYTE = SAMPLES_PER_BYTE / SAMPLES_PER_PIXEL

// The pen bit orders mirror decode_pens in the emulator's gate_array.c.
function mode0Pens(byte) {
  return [
    ((byte & 0x80) >> 7) | ((byte & 0x08) >> 2) | ((byte & 0x20) >> 3) | ((byte & 0x02) << 2),
    ((byte & 0x40) >> 6) | ((byte & 0x04) >> 1) | ((byte & 0x10) >> 2) | ((byte & 0x01) << 3)
  ]
}

function mode1Pens(byte) {
  return [
    ((byte >> 7) & 1) | (((byte >> 3) & 1) << 1),
    ((byte >> 6) & 1) | (((byte >> 2) & 1) << 1),
    ((byte >> 5) & 1) | (((byte >> 1) & 1) << 1),
    ((byte >> 4) & 1) | ((byte & 1) << 1)
  ]
}

const MODES = { 0: mode0Pens, 1: mode1Pens }

// The board's video address wiring, cpc_video_address in the emulator's
// cpc.c, after Kevin Thacker's "Screen memory addressess"
// (https://cpctech.cpcwiki.de/docs/scraddr.html): MA9..MA0 land on A10..A1,
// RA on A13..A11 and MA13..MA12 on A15..A14. The counter is fourteen bits,
// which is what makes a hardware-scrolled screen come round on itself.
const MA_BITS = 0x3fff

function addressesFrom({ start, width, height, rasters }) {
  const firstCharacter = ((start & 0xc000) >> 2) | ((start & 0x7fe) >> 1),
    firstByte = start & 1,
    addresses = new Uint32Array(width * height)

  let index = 0

  for (let line = 0; line < height; line++) {
    const raster = line % rasters,
      row = Math.floor(line / rasters),
      rowStart = firstByte + row * width

    for (let column = 0; column < width; column++) {
      const offset = rowStart + column,
        ma = (firstCharacter + (offset >> 1)) & MA_BITS,
        at = ((ma & 0x3000) << 2) | ((raster & 7) << 11) | ((ma & 0x3ff) << 1)

      addresses[index] = at | (offset & 1)
      index++
    }
  }

  return addresses
}

function cpcVideoFrom(ram, { start, characters, rows, rasters, mode, inks, rgb }) {
  const pensOf = MODES[mode]
  if (!pensOf) {
    throw new Error(`mode ${mode} is not one this reads`)
  }

  for (const [name, value] of Object.entries({ start, characters, rows, rasters })) {
    const counted = typeof value == "number"
    if (!counted) {
      throw new Error(`a video reading is taken by ${name}, and none was given`)
    }
  }

  const width = characters * BYTES_PER_CHARACTER,
    height = rows * rasters,
    colours = inks.map(code => colourFrom(rgb, code)),
    addresses = addressesFrom({ start, width, height, rasters }),
    pixelsPerLine = width * PIXELS_PER_BYTE,
    pixels = new Uint8ClampedArray(pixelsPerLine * height * 4)

  for (let index = 0; index < addresses.length; index++) {
    const byte = ram[addresses[index]],
      pens = pensOf(byte),
      across = PIXELS_PER_BYTE / pens.length,
      line = Math.floor(index / width),
      column = index % width,
      top = line * pixelsPerLine * 4

    for (let pixel = 0; pixel < pens.length; pixel++) {
      const [red, green, blue] = colours[pens[pixel]]

      for (let step = 0; step < across; step++) {
        const at = top + (column * PIXELS_PER_BYTE + pixel * across + step) * 4

        pixels[at] = red
        pixels[at + 1] = green
        pixels[at + 2] = blue
        pixels[at + 3] = 0xff
      }
    }
  }

  return { pixels, width: pixelsPerLine, height }
}

export default cpcVideoFrom
