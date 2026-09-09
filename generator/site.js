import { join, sep } from "node:path"
import readColophon from "./colophon.js"
import { readdirSync } from "node:fs"
import renderDocument from "./document.js"
import renderMarkdown from "./markdown.js"

const PAGES = "playground"

const COLOPHON_INDEX = /^index\.[a-z]{2,3}(?:-[A-Za-z0-9]+)*\.md$/u

function isColophonIndex(fileName) {
  return COLOPHON_INDEX.test(fileName)
}

function fileNameOf(path) {
  return path.split("/").at(-1)
}

function directoryOf(path) {
  return path.replace(/[^/]*$/u, "")
}

function findPages(root) {
  const directory = join(root, PAGES),
    names = readdirSync(directory, { recursive: true }),
    pages = []

  names.sort()

  for (const name of names) {
    const relativePath = name.split(sep).join("/"),
      fileName = fileNameOf(relativePath)

    if (!isColophonIndex(fileName)) {
      continue
    }

    const file = join(directory, name),
      colophon = readColophon(file),
      within = directoryOf(relativePath)

    pages.push({
      description: colophon.description,
      file,
      path: `${PAGES}/${within}`,
      title: colophon.title
    })
  }

  return pages
}

function pageAt(pages, path) {
  const wanted = path.replace(/^\//u, "")

  return pages.find(page => page.path == wanted)
}

function renderColophon(file) {
  const colophon = readColophon(file),
    content = renderMarkdown(colophon.body)

  return renderDocument(colophon.title, content)
}

export { findPages, pageAt, renderColophon }
