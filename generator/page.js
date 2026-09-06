const ESCAPED = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }

const RELOAD = "/-/js/reload.js",
  STYLESHEET = "/-/css/colophon.css"

function escapeHtml(text) {
  return text.replace(/[&<>"]/gu, character => ESCAPED[character])
}

export function renderPage(title, content) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" href="${STYLESHEET}" />
    <script type="module" src="${RELOAD}"></script>
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
