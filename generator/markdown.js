import MarkdownIt from "markdown-it"

// Quarto's spelling: a fence whose language is braced is executable, and a
// plain one is code being shown. Every other renderer, GitHub included, leaves
// an unknown language alone, so a cell degrades to a code block everywhere.
const CELL = /^\{(?<language>[a-z0-9]+)\}$/u

const markdownIt = new MarkdownIt({ html: true, typographer: true })

const defaultFence = markdownIt.renderer.rules.fence

markdownIt.renderer.rules.fence = function (tokens, index, options, env, renderer) {
  const token = tokens[index],
    cell = CELL.exec(token.info.trim())

  if (!cell) {
    return defaultFence(tokens, index, options, env, renderer)
  }

  const language = cell.groups.language

  token.info = language

  const block = defaultFence(tokens, index, options, env, renderer)

  return `<div class="cell" data-language="${language}">\n${block}</div>\n`
}

export function renderMarkdown(text) {
  return markdownIt.render(text)
}
