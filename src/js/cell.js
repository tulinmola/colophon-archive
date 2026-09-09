import MACHINES from "./machines.js"
import execute from "./executor.js"
import html from "./html.js"

const PLAY = html`<svg data-play viewBox="0 0 16 16" aria-hidden="true">
  <path d="M5 3.2v9.6l8-4.8z" fill="currentColor" />
</svg>`

const AGAIN = html`<svg data-again viewBox="0 0 16 16" aria-hidden="true">
  <path d="M13.2 8a5.2 5.2 0 1 1-1.8-3.9" fill="none" stroke="currentColor" stroke-width="1.5" />
  <path d="M13.2 1.9v3.4H9.8" fill="none" stroke="currentColor" stroke-width="1.5" />
</svg>`

const WORKING = html`<svg viewBox="0 0 16 16" aria-hidden="true">
  <path
    d="M6 3.4 2.4 8 6 12.6M10 3.4 13.6 8 10 12.6"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
  />
</svg>`

const UNASKED = "not yet derived"

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
  #fold
  #output
  #result
  #teardown
  #working

  get result() {
    this.#result ??= this.#resolve()

    return this.#result
  }

  connectedCallback() {
    this.#teardown = new AbortController()
    const { signal } = this.#teardown

    const block = this.querySelector("pre")

    this.innerHTML = html`
      <output>${UNASKED}</output>
      <button type="button" data-derive title="Derive">${PLAY}${AGAIN}</button>
      <button type="button" data-fold title="The working" aria-expanded="false">${WORKING}</button>
      ${block.outerHTML}
    `

    this.#button = this.querySelector("[data-derive]")
    this.#fold = this.querySelector("[data-fold]")
    this.#output = this.querySelector("output")
    this.#working = this.querySelector("pre")

    this.#working.hidden = true

    this.#button.addEventListener("click", this.run.bind(this), { signal })
    this.#fold.addEventListener("click", this.unfold.bind(this), { signal })

    this.dataset.state = "unasked"

    this.#showAgain()
  }

  disconnectedCallback() {
    this.#teardown.abort()
  }

  run() {
    const asked = this.#result != null
    if (asked) {
      this.forget()

      for (const cell of this.#dependents()) {
        cell.forget()
      }
    }

    return this.result
  }

  unfold() {
    const folded = this.#working.hidden

    this.#working.hidden = !folded
    this.#fold.setAttribute("aria-expanded", folded)
  }

  forget() {
    this.#result = null

    this.#output.replaceChildren(UNASKED)
    this.dataset.state = "unasked"
  }

  #cells() {
    const found = this.getRootNode().querySelectorAll("colophon-cell")

    return [...found]
  }

  #above(id) {
    const cells = this.#cells(),
      above = cells.slice(0, cells.indexOf(this))

    return above.find(cell => cell.id == id)
  }

  #dependents() {
    const cells = this.#cells(),
      below = cells.slice(cells.indexOf(this) + 1),
      stale = new Set([this.id]),
      resting = []

    for (const cell of below) {
      const names = cell.#namesIn("from"),
        rests = names.some(name => stale.has(name))

      if (rests) {
        stale.add(cell.id)
        resting.push(cell)
      }
    }

    return resting
  }

  async #showAgain() {
    const asked = this.#result
    if (!asked) {
      return
    }

    this.dataset.state = "deriving"

    const result = await asked
    this.#show(result)
  }

  async #resolve() {
    const { signal } = this.#teardown

    this.dataset.state = "deriving"
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

    const source = this.getAttribute("source")

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

    this.dataset.state = failed ? "failed" : "derived"
  }
}

export default Cell
