// Every host must send the same headers: checks the generated files against headers.mjs.
import assert from "node:assert"
import { execFileSync } from "node:child_process"
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, test } from "node:test"
import { fileURLToPath } from "node:url"
import { SECURITY_HEADERS, buildCsp } from "./headers.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const tmp = mkdtempSync(path.join(tmpdir(), "targets-"))
const pub = path.join(tmp, "public")
const out = path.join(tmp, "out")
mkdirSync(path.join(pub, "notes"), { recursive: true })
writeFileSync(path.join(pub, "index.html"), '<p style="color: red">x</p><script>let a = 1</script>')
writeFileSync(path.join(pub, "notes", "a.html"), "<script>let b = 2</script>")
writeFileSync(path.join(pub, "404.html"), "<p>404</p>")
execFileSync(process.execPath, [path.join(here, "targets.mjs"), pub, out, "abc123"])
const { policy } = await buildCsp(pub)

describe("deploy targets", () => {
  test("CSP hashes inline scripts and style attributes, never unsafe-inline", () => {
    assert.match(
      policy,
      /script-src 'self' 'sha256-[^']+' 'sha256-[^']+' https:\/\/cloud\.umami\.is/,
    )
    assert.match(policy, /style-src 'self' 'unsafe-hashes' 'sha256-/)
    assert.doesNotMatch(policy, /unsafe-inline|unsafe-eval/)
  })

  test("build stamp is written for every host", () => {
    for (const dir of [pub, path.join(out, "cloudflare"), path.join(out, "apache")])
      assert.equal(readFileSync(path.join(dir, "build.txt"), "utf8"), "abc123\n")
  })

  test("Cloudflare _headers carries every header and the CSP", () => {
    const text = readFileSync(path.join(out, "cloudflare", "_headers"), "utf8")
    assert.ok(text.includes(`  Content-Security-Policy: ${policy}\n`))
    for (const [k, v] of SECURITY_HEADERS) assert.ok(text.includes(`  ${k}: ${v}\n`), k)
    assert.ok(!existsSync(path.join(out, "cloudflare", ".htaccess")))
  })

  test(".htaccess carries every header and the CSP, clean URLs and the 404 page", () => {
    const text = readFileSync(path.join(out, "apache", ".htaccess"), "utf8")
    assert.ok(text.includes(`Header always set Content-Security-Policy "${policy}"`))
    for (const [k, v] of SECURITY_HEADERS)
      assert.ok(text.includes(`Header always set ${k} "${v}"`), k)
    assert.ok(text.includes("ErrorDocument 404 /404.html"))
    assert.ok(text.includes("RewriteRule ^(.+?)/?$ $1.html [L]"))
    assert.ok(!existsSync(path.join(out, "apache", "_headers")))
    assert.ok(existsSync(path.join(out, "apache", "notes", "a.html")))
  })

  test("nginx security-headers.conf matches headers.mjs", () => {
    const conf = readFileSync(path.join(here, "security-headers.conf"), "utf8")
    const lines = [...conf.matchAll(/^add_header (\S+) "([^"]*)" always;$/gm)].map((m) => [
      m[1],
      m[2],
    ])
    assert.deepEqual(lines, SECURITY_HEADERS)
    assert.ok(conf.includes("include /etc/nginx/snippets/csp.conf;"))
  })

  test("GitHub Pages output stays plain (no host config files)", () => {
    assert.ok(!existsSync(path.join(pub, "_headers")))
    assert.ok(!existsSync(path.join(pub, ".htaccess")))
  })
})
