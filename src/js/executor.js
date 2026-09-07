const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

async function execute(source, inputs = {}) {
  const names = Object.keys(inputs),
    values = Object.values(inputs)

  try {
    const body = new AsyncFunction(...names, source),
      value = await body(...values)

    return { value }
  } catch (failure) {
    return { error: `${failure.name}: ${failure.message}` }
  }
}

export default execute
