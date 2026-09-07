import colophons from "./generator/index.js"
import { defineConfig } from "vite"

const ROOT = import.meta.dirname

export default defineConfig({
  appType: "custom",
  plugins: [colophons(ROOT)],
  root: ROOT,
  server: { port: Number(process.env.PORT ?? 3000) }
})
