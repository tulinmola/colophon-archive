import { execFileSync, spawnSync } from "node:child_process"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { createHash } from "node:crypto"
import { fileURLToPath } from "node:url"
import { resolve } from "node:path"

const HERE = fileURLToPath(import.meta.url),
  ROOT = resolve(HERE, "../.."),
  EMULATOR_DIR = resolve(ROOT, process.env.EMULATOR_DIR ?? "../colophon-emulator"),
  HOST_DIR = resolve(ROOT, "emulator"),
  VENDOR_DIR = resolve(ROOT, "src/js/vendor"),
  EXPORTS = resolve(HOST_DIR, "exports.json"),
  HOST = resolve(HOST_DIR, "archive.c"),
  MACHINE_DIR = resolve(EMULATOR_DIR, "src")

function git(...args) {
  const output = execFileSync("git", ["-C", EMULATOR_DIR, ...args], { encoding: "utf8" })

  return output.trim()
}

function hostDigest() {
  const digest = createHash("sha256")

  for (const path of [EXPORTS, HOST]) {
    const bytes = readFileSync(path)

    digest.update(bytes)
  }

  return digest.digest("hex").slice(0, 7)
}

function machineVersion() {
  const commit = git("rev-parse", "--short", "HEAD"),
    clean = spawnSync("git", ["-C", EMULATOR_DIR, "diff", "--quiet", "HEAD", "--", "src"]).status

  return clean == 0 ? commit : `${commit}-dirty`
}

function machineSources() {
  const names = readdirSync(MACHINE_DIR),
    sources = names.filter(name => name.endsWith(".c"))

  return sources.map(name => resolve(MACHINE_DIR, name))
}

const wanted = resolve(MACHINE_DIR, "cpc_snapshot.h")
if (!existsSync(wanted)) {
  console.error(`no machine at ${EMULATOR_DIR}: no src/cpc_snapshot.h.`)
  console.error("Pull the emulator, or set EMULATOR_DIR to a checkout that has it.")
  process.exit(1)
}

const basename = `colophon-emulator-${machineVersion()}-${hostDigest()}`,
  module = resolve(VENDOR_DIR, `${basename}.mjs`),
  version = execFileSync("emcc", ["--version"], { encoding: "utf8" })

console.log(`==> Building ${basename} from ${EMULATOR_DIR}`)
console.log(version.split("\n")[0])

execFileSync(
  "emcc",
  [
    ...machineSources(),
    HOST,
    "-I",
    MACHINE_DIR,
    "-std=c99",
    "-Wall",
    "-Wextra",
    "-Werror",
    "-O3",
    "-s",
    "MODULARIZE=1",
    "-s",
    "EXPORT_ES6=1",
    "-s",
    "EXPORT_NAME=ColophonEmulator",
    "-s",
    "FILESYSTEM=0",
    "-s",
    "SINGLE_FILE=1",
    "-s",
    `EXPORTED_FUNCTIONS=@${EXPORTS}`,
    "-s",
    "EXPORTED_RUNTIME_METHODS=HEAPU8",
    "-o",
    module
  ],
  { stdio: "inherit" }
)

console.log(`==> Wrote src/js/vendor/${basename}.mjs`)
console.log("==> Name it in src/js/emulator/module.js if it changed")
