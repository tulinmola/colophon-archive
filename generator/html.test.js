import * as client from "../src/js/html.js"
import * as generator from "./html.js"
import { describe, expect, it } from "vitest"

describe("escapeHtml", function () {
  it("escapes the ampersand first, so nothing is escaped twice", function () {
    const escaped = generator.escapeHtml("&<")

    expect(escaped).toBe("&amp;&lt;")
  })

  it("escapes what would end an attribute or a tag", function () {
    const escaped = generator.escapeHtml(`a "b" <c> &d`)

    expect(escaped).toBe("a &quot;b&quot; &lt;c&gt; &amp;d")
  })

  it("leaves text with nothing to escape as it was", function () {
    const escaped = generator.escapeHtml("return 2 + 2")

    expect(escaped).toBe("return 2 + 2")
  })

  it("refuses what is not text, rather than printing it", function () {
    expect(() => generator.escapeHtml(null)).toThrow(TypeError)
  })
})

describe("html", function () {
  it("composes a template with no values", function () {
    const markup = generator.html`<p>x</p>`

    expect(markup).toBe("<p>x</p>")
  })

  it("interpolates every value in order", function () {
    const markup = generator.html`<a href="${"/p"}">${"T"}</a>${"!"}`

    expect(markup).toBe('<a href="/p">T</a>!')
  })

  it("does not escape: escaping is the caller's, where the markup is", function () {
    const markup = generator.html`<p>${"<b>"}</p>`

    expect(markup).toBe("<p><b></p>")
  })
})

describe("the client's copy, which must answer alike until it grows a DOM", function () {
  it("escapes the same", function () {
    const text = `a "b" <c> &d`,
      byClient = client.escapeHtml(text),
      byGenerator = generator.escapeHtml(text)

    expect(byClient).toBe(byGenerator)
  })

  it("composes the same", function () {
    const byClient = client.html`<p>${"x"}</p>`,
      byGenerator = generator.html`<p>${"x"}</p>`

    expect(byClient).toBe(byGenerator)
  })
})
