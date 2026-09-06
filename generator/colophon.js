import { basename, dirname } from "node:path"
import { parse as parseYaml } from "yaml"
import { readFileSync } from "node:fs"

const FILE_NAME = /^(?<name>[a-z0-9-]+)\.(?<language>[a-z]{2,3}(?:-[A-Za-z0-9]+)*)\.md$/u,
  FRONT_MATTER = /^---\r?\n(?<metadata>[\s\S]*?)\r?\n---\r?\n(?<body>[\s\S]*)$/u

export class Colophon {
  #body
  #directory
  #language
  #metadata

  constructor(path) {
    const source = readFileSync(path, "utf8"),
      fileName = basename(path),
      name = FILE_NAME.exec(fileName),
      frontMatter = FRONT_MATTER.exec(source)

    if (!name) {
      throw new Error(`${path}: a colophon is named <name>.<language>.md`)
    }

    if (!frontMatter) {
      throw new Error(`${path}: a colophon opens with a YAML front matter block`)
    }

    this.#body = frontMatter.groups.body
    this.#directory = dirname(path)
    this.#language = name.groups.language
    this.#metadata = parseYaml(frontMatter.groups.metadata)
  }

  get body() {
    return this.#body
  }

  get description() {
    return this.#metadata.description
  }

  get directory() {
    return this.#directory
  }

  get language() {
    return this.#language
  }

  get title() {
    return this.#metadata.title
  }

  get witness() {
    return this.#metadata.witness
  }

  get work() {
    return this.#metadata.work
  }
}
