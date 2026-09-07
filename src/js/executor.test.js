import { describe, expect, it } from "vitest"
import execute from "./executor.js"

describe("execute, which runs where there is no document at all", function () {
  it("answers with what the cell returned", async function () {
    const result = await execute("return 2 + 2")

    expect(result).toEqual({ value: 4 })
  })

  it("waits for a cell that returns a promise", async function () {
    const result = await execute("return await Promise.resolve(7)")

    expect(result).toEqual({ value: 7 })
  })

  it("answers with nothing when the cell returns nothing", async function () {
    const result = await execute("const x = 1")

    expect(result.value).toBeUndefined()
    expect(result.error).toBeUndefined()
  })

  it("reports a failure the cell raised as the result", async function () {
    const result = await execute("return missing.value")

    expect(result).toEqual({ error: "ReferenceError: missing is not defined" })
  })

  it("reports source that cannot be parsed the same way", async function () {
    const result = await execute("return (")

    expect(result.error).toMatch(/^SyntaxError: /u)
  })

  it("shares the globals of its host with every other cell, which nothing prevents", async function () {
    await execute("globalThis.left = 1")

    const result = await execute("return globalThis.left")

    expect(result).toEqual({ value: 1 })
  })
})
