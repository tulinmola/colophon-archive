import { escapeHtml, html } from "./html.js"
import execute from "./executor.js"

function shownValue(value) {
  const asJson = JSON.stringify(value, null, 2),
    isRepresentable = asJson != null

  return isRepresentable ? asJson : String(value)
}

class Cell extends HTMLElement {
  #button
  #output
  #teardown

  get signal() {
    return this.#teardown.signal
  }

  connectedCallback() {
    this.#teardown = new AbortController()

    const source = this.querySelector("code").textContent

    this.innerHTML = html`
      <pre><code>${escapeHtml(source)}</code></pre>
      <menu>
        <li><button type="button">Run</button></li>
      </menu>
      <output hidden></output>
    `

    this.#button = this.querySelector("button")
    this.#output = this.querySelector("output")

    this.#button.addEventListener("click", this.run.bind(this), { signal: this.signal })
  }

  disconnectedCallback() {
    this.#teardown.abort()
  }

  async run() {
    const { signal } = this,
      code = this.querySelector("code")

    this.#button.disabled = true

    const result = await execute(code.textContent),
      failed = result.error != null

    if (signal.aborted) {
      return
    }

    this.#output.textContent = failed ? result.error : shownValue(result.value)
    this.#output.classList.toggle("failed", failed)
    this.#output.hidden = false
    this.#button.disabled = false
  }
}

export default Cell
