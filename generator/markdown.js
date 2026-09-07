import MarkdownIt from "markdown-it"
import { html } from "./html.js"

const BRACED_LANGUAGE = /^\{(?<language>[a-z0-9]+)\}$/u

const markdownIt = new MarkdownIt({ html: true, typographer: true })

const defaultFence = markdownIt.renderer.rules.fence

function cellLanguageOf(token) {
  const isFence = token.type == "fence"

  if (!isFence) {
    return null
  }

  const info = token.info.trim(),
    braced = BRACED_LANGUAGE.exec(info)

  return braced ? braced.groups.language : null
}

function unbraceAndCollect(tokens) {
  const cells = new Set()

  for (const token of tokens) {
    const language = cellLanguageOf(token)

    if (language) {
      token.info = language
      cells.add(token)
    }
  }

  return cells
}

markdownIt.renderer.rules.fence = function (tokens, index, options, env, renderer) {
  const token = tokens[index],
    block = defaultFence(tokens, index, options, env, renderer),
    isCell = env.cells.has(token)

  if (!isCell) {
    return block
  }

  return html` <colophon-cell language="${token.info}"> ${block} </colophon-cell> `
}

function renderMarkdown(text) {
  const tokens = markdownIt.parse(text, {}),
    cells = unbraceAndCollect(tokens)

  return markdownIt.renderer.render(tokens, markdownIt.options, { cells })
}

export default renderMarkdown
