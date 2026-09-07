import { describe, expect, it } from "vitest"
import renderMarkdown from "./markdown.js"

describe("renderMarkdown", function () {
  it("passes an element through, because a cell is written as one", function () {
    const markup = renderMarkdown(
      '<colophon-cell id="sum">\n\n```js\nreturn 1\n```\n\n</colophon-cell>\n'
    )

    expect(markup).toContain('<colophon-cell id="sum">')
    expect(markup).toContain('<code class="language-js">return 1')
  })
})
