import { escapeHtml, html } from "./html.js"

const ENTRY = "/src/js/index.js",
  STYLESHEET = "/src/css/colophon.css"

function renderDocument(title, content) {
  return html`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(title)}</title>
        <link rel="stylesheet" href="${STYLESHEET}" />
        <script type="module" src="${ENTRY}"></script>
      </head>
      <body>
        <main>
          <h1>${escapeHtml(title)}</h1>
          ${content}
        </main>
      </body>
    </html>
  `
}

export default renderDocument
