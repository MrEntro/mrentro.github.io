// One source of truth for the security headers and the Content-Security-Policy of every host
// (nginx include via csp.mjs, Cloudflare Pages `_headers`, Apache `.htaccess` via targets.mjs).
// Quartz emits a few inline scripts per page, and syntax highlighting writes style attributes,
// so both are allowed by hash, never 'unsafe-inline'.
import { createHash } from "node:crypto"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

export const ANALYTICS = "https://cloud.umami.is"

/** Response headers sent with every file, besides the CSP. Mirrored in security-headers.conf. */
export const SECURITY_HEADERS = [
  ["Strict-Transport-Security", "max-age=63072000; includeSubDomains"],
  ["X-Content-Type-Options", "nosniff"],
  ["X-Frame-Options", "DENY"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()"],
  ["Cross-Origin-Opener-Policy", "same-origin"],
]

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

/** The CSP for a built site: hashes of every inline script and style attribute it contains. */
export async function buildCsp(publicDir) {
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
    `script-src 'self' ${[...hashes].sort().join(" ")} ${ANALYTICS}`.replace(/  +/g, " "),
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
  return { policy, scripts: hashes.size, styles: styleHashes.size }
}
