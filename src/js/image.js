function imageFrom({ pixels, width, height }) {
  const canvas = document.createElement("canvas")

  canvas.width = width
  canvas.height = height

  const context = canvas.getContext("2d"),
    data = new ImageData(pixels, width, height)

  context.putImageData(data, 0, 0)

  return { image: canvas.toDataURL("image/png") }
}

export default imageFrom
