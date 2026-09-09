import { escapeHtml, html } from "./html.js"
import MarkdownIt from "markdown-it"

const markdownIt = new MarkdownIt({ html: true, typographer: true })

const ATTRIBUTE = /(?<name>[a-z]+)="(?<value>[^"]*)"/gu

function attributesIn(info) {
  const written = []

  for (const { groups } of info.matchAll(ATTRIBUTE)) {
    written.push(` ${groups.name}="${escapeHtml(groups.value)}"`)
  }

  return written.join("")
}

function marksACell(info) {
  const words = info.replace(ATTRIBUTE, " ").split(/\s+/u)

  return words.includes("cell")
}

const renderFence = markdownIt.renderer.rules.fence

// The first word of an info string is the language; CommonMark leaves the rest
// to the implementation. https://spec.commonmark.org/0.31.2/#info-string
markdownIt.renderer.rules.fence = function (tokens, index, options, env, renderer) {
  const token = tokens[index],
    block = renderFence(tokens, index, options, env, renderer),
    isCell = marksACell(token.info)

  if (!isCell) {
    return block
  }

  return html`<colophon-cell${attributesIn(token.info)}>${block}</colophon-cell>`
}

function renderMarkdown(text) {
  return markdownIt.render(text)
}

export default renderMarkdown
