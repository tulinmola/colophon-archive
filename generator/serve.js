import { existsSync, readFileSync, readdirSync, statSync, watch } from "node:fs"
import { extname, join, resolve, sep } from "node:path"
import { Colophon } from "./colophon.js"
import { createServer } from "node:http"
import { renderMarkdown } from "./markdown.js"
import { renderPage } from "./page.js"

const ROOT = join(import.meta.dirname, ".."),
  ASSETS = join(ROOT, "src"),
  COLOPHONS = join(ROOT, "colophons"),
  PORT = Number(process.env.PORT ?? 3000),
  SETTLE_MILLISECONDS = 50

// Everything under the root is a colophon's own directory, so the archive's
// own files are addressed under a prefix no colophon can be named.
const ARCHIVE = "/-/",
  RELOAD = "/-/reload"

// A page is told to reload, never patched, so the generation is the whole of
// what a client remembers: a different one means the server was restarted.
const GENERATION = Date.now(),
  listeners = new Set()

const INDEX_FILE = /^index\.[a-z]{2,3}(?:-[A-Za-z0-9]+)*\.md$/u

const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".sna": "application/octet-stream",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8"
}

function fileWithin(root, pathname) {
  const path = resolve(root, `.${decodeURIComponent(pathname)}`)

  return path.startsWith(root) && existsSync(path) ? path : null
}

function indexIn(directory) {
  const names = readdirSync(directory)

  names.sort()

  for (const name of names) {
    if (INDEX_FILE.test(name)) {
      return join(directory, name)
    }
  }

  return null
}

function colophonFiles() {
  const names = readdirSync(COLOPHONS, { recursive: true }),
    files = []

  names.sort()

  for (const name of names) {
    const relativePath = name.split(sep).join("/")

    if (INDEX_FILE.test(relativePath.split("/").at(-1))) {
      files.push(relativePath)
    }
  }

  return files
}

function renderIndex() {
  const files = colophonFiles(),
    lines = []

  for (const file of files) {
    const colophon = new Colophon(join(COLOPHONS, file)),
      directory = file.replace(/[^/]*$/u, "")

    lines.push(`- [${colophon.title}](/${directory}) — ${colophon.description}`)
  }

  const list = lines.length ? lines.join("\n") : "Nothing yet."

  return renderPage("Colophons", renderMarkdown(list))
}

function renderColophon(directory) {
  const file = indexIn(directory)

  if (!file) {
    return null
  }

  const colophon = new Colophon(file),
    markup = renderMarkdown(colophon.body)

  return renderPage(colophon.title, markup)
}

function sendHtml(response, markup) {
  response.writeHead(200, { "content-type": CONTENT_TYPES[".html"] })
  response.end(markup)
}

function sendFile(response, path) {
  const type = CONTENT_TYPES[extname(path)] ?? CONTENT_TYPES[".txt"]

  response.writeHead(200, { "content-type": type })
  response.end(readFileSync(path))
}

function sendNotFound(response, message) {
  response.writeHead(404, { "content-type": CONTENT_TYPES[".txt"] })
  response.end(`${message}\n`)
}

function listen(response) {
  response.writeHead(200, {
    "cache-control": "no-cache",
    "content-type": "text/event-stream"
  })
  response.write(`event: hello\ndata: ${GENERATION}\n\n`)

  listeners.add(response)

  response.on("close", function () {
    listeners.delete(response)
  })
}

function announceChange() {
  for (const listener of listeners) {
    listener.write("event: change\ndata: \n\n")
  }
}

function watchForChanges() {
  let settling = null

  function changed() {
    clearTimeout(settling)
    settling = setTimeout(announceChange, SETTLE_MILLISECONDS)
  }

  for (const directory of [ASSETS, COLOPHONS]) {
    watch(directory, { recursive: true }, changed)
  }
}

function respond(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`)

  if (url.pathname == "/") {
    sendHtml(response, renderIndex())

    return
  }

  if (url.pathname == RELOAD) {
    listen(response)

    return
  }

  if (url.pathname.startsWith(ARCHIVE)) {
    const path = fileWithin(ASSETS, url.pathname.slice(ARCHIVE.length - 1))

    if (path) {
      sendFile(response, path)
    } else {
      sendNotFound(response, "Not found")
    }

    return
  }

  const path = fileWithin(COLOPHONS, url.pathname)

  if (!path) {
    sendNotFound(response, "Not found")

    return
  }

  if (!statSync(path).isDirectory()) {
    sendFile(response, path)

    return
  }

  // A colophon carries its artifacts beside it, and a directory addressed
  // without its slash resolves those links against its parent.
  if (!url.pathname.endsWith("/")) {
    response.writeHead(301, { location: `${url.pathname}/` })
    response.end()

    return
  }

  const markup = renderColophon(path)

  if (markup) {
    sendHtml(response, markup)
  } else {
    sendNotFound(response, "No colophon here")
  }
}

watchForChanges()

createServer(respond).listen(PORT, function () {
  console.log(`The archive is at http://localhost:${PORT}/`)
})
