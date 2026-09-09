import MACHINES from "./machines.js"
import execute from "./executor.js"
import html from "./html.js"

function pictureFrom({ image, width, height }) {
  const picture = document.createElement("img")

  picture.src = image
  picture.width = width
  picture.height = height

  return picture
}

function textFrom(value) {
  const asJson = JSON.stringify(value, null, 2),
    isRepresentable = asJson != null

  return isRepresentable ? asJson : String(value)
}

class Cell extends HTMLElement {
  #button
  #output
  #result
  #teardown

  get result() {
    this.#result ??= this.#resolve()

    return this.#result
  }

  connectedCallback() {
    this.#teardown = new AbortController()
    const { signal } = this.#teardown

    const block = this.querySelector("pre")

    this.innerHTML = html`
      <output class="pending">not yet derived</output>
      <menu>
        <li><button type="button">Run</button></li>
      </menu>
      <details>
        <summary>The working</summary>
        ${block.outerHTML}
      </details>
    `

    this.#button = this.querySelector("button")
    this.#output = this.querySelector("output")

    this.#button.addEventListener("click", this.run.bind(this), { signal })

    this.#showAgain()
  }

  disconnectedCallback() {
    this.#teardown.abort()
  }

  run() {
    return this.result
  }

  #above(id) {
    const found = this.getRootNode().querySelectorAll("colophon-cell"),
      cells = [...found],
      above = cells.slice(0, cells.indexOf(this))

    return above.find(cell => cell.id == id)
  }

  async #showAgain() {
    const derived = this.#result
    if (!derived) {
      return
    }

    const result = await derived
    this.#show(result)
  }

  async #resolve() {
    const { signal } = this.#teardown

    this.#button.disabled = true

    const result = await this.#derive()
    if (signal.aborted) {
      return result
    }

    this.#show(result)
    this.#button.disabled = false

    return result
  }

  async #derive() {
    const inputs = {}

    for (const name of this.#namesIn("uses")) {
      const machine = MACHINES[name]
      if (!machine) {
        return { error: `uses ${name}, which is no machine the archive stands up` }
      }

      inputs[name] = machine
    }

    for (const id of this.#namesIn("from")) {
      const cell = this.#above(id)
      if (!cell) {
        return { error: `derives from ${id}, which no cell above it is` }
      }

      const input = await cell.result
      if (input.error) {
        return { error: `derives from ${id}, which failed` }
      }

      inputs[id] = input.value
    }

    const block = this.querySelector("pre"),
      source = block.textContent

    return execute(source, inputs)
  }

  #namesIn(attribute) {
    const named = this.getAttribute(attribute)

    return named ? named.trim().split(/\s+/u) : []
  }

  #show(result) {
    const failed = result.error != null,
      image = result.value?.image

    if (image) {
      const picture = pictureFrom(result.value)

      this.#output.replaceChildren(picture)
    } else {
      this.#output.textContent = failed ? result.error : textFrom(result.value)
    }

    this.#output.classList.toggle("failed", failed)
    this.#output.classList.remove("pending")
  }
}

export default Cell
