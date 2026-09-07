import MarkdownIt from "markdown-it"

const markdownIt = new MarkdownIt({ html: true, typographer: true })

function renderMarkdown(text) {
  return markdownIt.render(text)
}

export default renderMarkdown
