import { describe, expect, it } from "vitest"
import renderMarkdown from "./markdown.js"

const FENCE = "```"

function fence(info, source = "return 1") {
  return renderMarkdown(`${FENCE}${info}\n${source}\n${FENCE}\n`)
}

describe("renderMarkdown", function () {
  it("makes an element of a block the info string marks as a cell", function () {
    const markup = fence("js cell")

    expect(markup).toContain("<colophon-cell>")
    expect(markup).toContain("</colophon-cell>")
  })

  it("leaves a block that is not marked as it found it", function () {
    const markup = fence("js")

    expect(markup).not.toContain("colophon-cell")
  })

  it("carries what the info string wrote onto the element", function () {
    const markup = fence('js cell id="sum" from="two" uses="cpc"')

    expect(markup).toContain('<colophon-cell id="sum" from="two" uses="cpc">')
  })

  it("keeps the language first, so a reader with no archive still sees JavaScript", function () {
    const markup = fence('js cell id="sum"')

    expect(markup).toContain('<code class="language-js">return 1')
  })

  it("carries the block itself, so what runs is not what is shown", function () {
    const markup = fence("js cell", `return "<b>&</b>"`)

    expect(markup).toContain('source="return &quot;&lt;b&gt;&amp;&lt;/b&gt;&quot;')
  })

  it("escapes what an attribute carries", function () {
    const markup = fence('js cell id="a<b&c"')

    expect(markup).toContain('<colophon-cell id="a&lt;b&amp;c">')
  })

  it("does not take a word inside an attribute for a marking", function () {
    const markup = fence('js id="a cell b"')

    expect(markup).not.toContain("colophon-cell")
  })
})
