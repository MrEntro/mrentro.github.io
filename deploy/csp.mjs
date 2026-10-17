// Builds the Content-Security-Policy for the built site and writes it as an nginx include.
// Quartz emits a few inline scripts per page, and syntax highlighting writes style attributes,
// so both are allowed by hash, never 'unsafe-inline'.
// Usage: node deploy/csp.mjs <public dir> <output file>
import { createHash } from "node:crypto"
import { readdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const [publicDir, outFile] = process.argv.slice(2)
if (!publicDir || !outFile) {
  console.error("usage: node deploy/csp.mjs <public dir> <output file>")
  process.exit(1)
}

const ANALYTICS = "https://cloud.umami.is"
const inlineScript = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g
const styleAttr = /\sstyle="([^"]*)"/g
const sha256 = (s) => `'sha256-${createHash("sha256").update(s).digest("base64")}'`

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* htmlFiles(p)
    else if (entry.name.endsWith(".html")) yield p
  }
}

const decode = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")

const hashes = new Set()
const styleHashes = new Set()
for await (const file of htmlFiles(publicDir)) {
  const html = await readFile(file, "utf8")
  for (const [, body] of html.matchAll(inlineScript)) {
    if (body.trim()) hashes.add(sha256(body))
  }
  for (const [, style] of html.matchAll(styleAttr)) styleHashes.add(sha256(decode(style)))
}
const styleSrc = styleHashes.size
  ? `style-src 'self' 'unsafe-hashes' ${[...styleHashes].sort().join(" ")}`
  : "style-src 'self'"

const policy = [
  "default-src 'none'",
  `script-src 'self' ${[...hashes].sort().join(" ")} ${ANALYTICS}`,
  styleSrc,
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self' ${ANALYTICS}`,
  "manifest-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ")

await writeFile(outFile, `add_header Content-Security-Policy "${policy}" always;\n`)
console.log(
  `CSP: ${hashes.size} inline script hash(es), ${styleHashes.size} style attribute hash(es)`,
)
