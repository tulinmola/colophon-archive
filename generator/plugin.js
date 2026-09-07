import { findPages, pageAt, renderColophon } from "./site.js"
import renderArchive from "./archive.js"

const OUTSIDE_MODULE_GRAPH = /\.(?:md|css)$/u

function sendHtml(response, markup) {
  response.writeHead(200, { "content-type": "text/html; charset=utf-8" })
  response.end(markup)
}

function colophons(root) {
  return {
    name: "colophons",

    configureServer(server) {
      server.watcher.on("change", function (path) {
        if (OUTSIDE_MODULE_GRAPH.test(path)) {
          server.ws.send({ type: "full-reload" })
        }
      })

      server.middlewares.use(async function (request, response, next) {
        const url = new URL(request.url, `http://${request.headers.host}`),
          pages = findPages(root),
          isArchive = url.pathname == "/"

        if (isArchive) {
          sendHtml(response, renderArchive(pages))

          return
        }

        const page = pageAt(pages, url.pathname)

        if (page) {
          const markup = renderColophon(page.file),
            transformed = await server.transformIndexHtml(url.pathname, markup)

          sendHtml(response, transformed)

          return
        }

        const withSlash = pageAt(pages, `${url.pathname}/`)

        if (withSlash) {
          response.writeHead(301, { location: `${url.pathname}/` })
          response.end()

          return
        }

        next()
      })
    }
  }
}

export default colophons
