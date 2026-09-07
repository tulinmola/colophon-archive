import { describe, expect, it } from "vitest"
import { mkdtempSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import readColophon from "./colophon.js"
import { tmpdir } from "node:os"

function colophonNamed(fileName, source) {
  const prefix = join(tmpdir(), "colophon-"),
    directory = mkdtempSync(prefix),
    path = join(directory, fileName)

  writeFileSync(path, source)

  return path
}

const SOURCE = `---
title: Cells
description: What a cell is.
---

Prose.
`

describe("readColophon", function () {
  it("reads the front matter and the body apart", function () {
    const path = colophonNamed("index.en.md", SOURCE),
      colophon = readColophon(path)

    expect(colophon.title).toBe("Cells")
    expect(colophon.description).toBe("What a cell is.")
    expect(colophon.language).toBe("en")
    expect(colophon.body.trim()).toBe("Prose.")
  })

  it("refuses a file not named for its language", function () {
    const path = colophonNamed("index.md", SOURCE)

    expect(() => readColophon(path)).toThrow(/named <name>\.<language>\.md/u)
  })

  it("refuses a file that opens with no front matter", function () {
    const path = colophonNamed("index.en.md", "Prose.\n")

    expect(() => readColophon(path)).toThrow(/opens with a YAML front matter block/u)
  })
})
