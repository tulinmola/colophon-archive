function imageFrom({ pixels, width, height }) {
  const canvas = document.createElement("canvas")

  canvas.width = width
  canvas.height = height

  const context = canvas.getContext("2d"),
    data = new ImageData(pixels, width, height)

  context.putImageData(data, 0, 0)

  const image = canvas.toDataURL("image/png")

  return { image, width, height }
}

export default imageFrom
