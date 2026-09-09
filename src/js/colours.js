function colourFrom(rgb, code) {
  const value = rgb(code)

  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff]
}

export default colourFrom
