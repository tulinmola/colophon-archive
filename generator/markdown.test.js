import { describe, expect, it } from "vitest"
import renderMarkdown from "./markdown.js"

describe("renderMarkdown", function () {
  it("makes a cell of a fence whose language is braced", function () {
    const markup = renderMarkdown("```{js}\nreturn 2 + 2\n```\n")

    expect(markup).toContain('<colophon-cell language="js">')
    expect(markup).toContain("return 2 + 2")
  })

  it("leaves a plain fence as code being shown", function () {
    const markup = renderMarkdown("```js\nreturn 2 + 2\n```\n")

    expect(markup).not.toContain("colophon-cell")
    expect(markup).toContain('<code class="language-js">')
  })

  it("carries the language on the element, so the class need not survive upgrade", function () {
    const markup = renderMarkdown("```{js}\nreturn 1\n```\n")

    expect(markup).toContain('language="js"')
  })

  it("emits no controls: they are the element's to build", function () {
    const markup = renderMarkdown("```{js}\nreturn 1\n```\n")

    expect(markup).not.toContain("<button")
    expect(markup).not.toContain("<output")
  })

  it("renders prose around a cell as prose", function () {
    const markup = renderMarkdown("## A cell\n\n```{js}\nreturn 1\n```\n")

    expect(markup).toContain("<h2")
  })
})
