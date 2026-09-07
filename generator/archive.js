import { escapeHtml, html } from "./html.js"
import renderDocument from "./document.js"

function renderItem(page) {
  return html`<li>
    <a href="/${escapeHtml(page.path)}">${escapeHtml(page.title)}</a> —
    ${escapeHtml(page.description)}
  </li>`
}

function renderArchive(pages) {
  const items = pages.map(renderItem)

  return renderDocument(
    "The archive",
    html`<ul>
      ${items.join("")}
    </ul>`
  )
}

export default renderArchive
