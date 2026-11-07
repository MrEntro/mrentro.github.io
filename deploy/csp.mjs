// Writes the built site's Content-Security-Policy as an nginx include (container image).
// The policy itself comes from headers.mjs, shared with the other hosts (targets.mjs).
// Usage: node deploy/csp.mjs <public dir> <output file>
import { writeFile } from "node:fs/promises"
import { buildCsp } from "./headers.mjs"

const [publicDir, outFile] = process.argv.slice(2)
if (!publicDir || !outFile) {
  console.error("usage: node deploy/csp.mjs <public dir> <output file>")
  process.exit(1)
}

const { policy, scripts, styles } = await buildCsp(publicDir)
await writeFile(outFile, `add_header Content-Security-Policy "${policy}" always;\n`)
console.log(`CSP: ${scripts} inline script hash(es), ${styles} style attribute hash(es)`)
