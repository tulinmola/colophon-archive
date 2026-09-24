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

export { answeredBy, writeRegister }
