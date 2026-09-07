const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

async function execute(source) {
  try {
    const body = new AsyncFunction(source),
      value = await body()

    return { value }
  } catch (failure) {
    return { error: `${failure.name}: ${failure.message}` }
  }
}

export default execute
