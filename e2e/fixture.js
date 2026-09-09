import { escapeHtml } from "../generator/html.js"

const DOCUMENT = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="/src/css/colophon.css" />
    <script type="module" src="/src/js/index.js"></script>
  </head>
  <body>
    <main></main>
  </body>
</html>`

export function cell({ id = "", from = "", uses = "", source }) {
  const named = id ? ` id="${id}"` : "",
    derived = from ? ` from="${from}"` : "",
    given = uses ? ` uses="${uses}"` : "",
    written = escapeHtml(source)

  return `<colophon-cell${named}${derived}${given}><pre><code>${written}</code></pre></colophon-cell>`
}

export async function standUp(page, cells) {
  const written = cells.join("\n"),
    document = DOCUMENT.replace("<main></main>", `<main>${written}</main>`)

  await page.route("**/under-test", function (route) {
    route.fulfill({ body: document, contentType: "text/html" })
  })

  await page.goto("/under-test")
}
