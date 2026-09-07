import { basename } from "node:path"
import { parse as parseYaml } from "yaml"
import { readFileSync } from "node:fs"

const COLOPHON_FILE = /^(?<name>[a-z0-9-]+)\.(?<language>[a-z]{2,3}(?:-[A-Za-z0-9]+)*)\.md$/u,
  FRONT_MATTER = /^---\r?\n(?<metadata>[\s\S]*?)\r?\n---\r?\n(?<body>[\s\S]*)$/u

function readColophon(path) {
  const fileName = basename(path),
    named = COLOPHON_FILE.exec(fileName)

  if (!named) {
    throw new Error(`${path}: a colophon is named <name>.<language>.md`)
  }

  const source = readFileSync(path, "utf8"),
    parted = FRONT_MATTER.exec(source)

  if (!parted) {
    throw new Error(`${path}: a colophon opens with a YAML front matter block`)
  }

  const metadata = parseYaml(parted.groups.metadata)

  return {
    body: parted.groups.body,
    description: metadata.description,
    language: named.groups.language,
    title: metadata.title
  }
}

export default readColophon
