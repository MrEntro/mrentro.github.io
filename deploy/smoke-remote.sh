#!/usr/bin/env bash
# Checks a deployed host: home page status, the build stamp, and (unless --no-headers, for
# GitHub Pages, which cannot set headers) the security headers and a strict CSP.
# Retries while the host still serves the previous build (CDN caches).
# Usage: deploy/smoke-remote.sh <base url> <commit sha> [--no-headers]
set -euo pipefail
base=${1:?base url}
sha=${2:?commit sha}
headers=${3:-}
fail() { echo "FAIL: $*" >&2; exit 1; }
ua="mrentro-deploy-smoke"

for i in $(seq 1 20); do
  stamp=$(curl -fsS -A "$ua" --max-time 10 "$base/build.txt?ts=$(date +%s)" 2>/dev/null || true)
  [[ $stamp == "$sha" ]] && break
  [[ $i == 20 ]] && fail "$base/build.txt is '${stamp:-unreachable}', expected $sha"
  sleep 15
done
echo "ok   $base/build.txt -> $sha"

# right after a deploy a CDN edge can briefly answer 403/404 for pages: retry before failing
for i in $(seq 1 12); do
  code=$(curl -s -A "$ua" -o /dev/null -w '%{http_code}' --max-time 10 "$base/?ts=$(date +%s)")
  [[ $code == 200 ]] && break
  [[ $i == 12 ]] && fail "$base/ returned $code"
  echo "wait $base/ -> $code"
  sleep 10
done
echo "ok   $base/ -> 200"

[[ $headers == --no-headers ]] && { echo "smoke test passed (headers not checked)"; exit 0; }
h=$(curl -sI -A "$ua" --max-time 10 "$base/")
for name in content-security-policy strict-transport-security x-content-type-options \
  x-frame-options referrer-policy permissions-policy cross-origin-opener-policy; do
  grep -qi "^$name:" <<<"$h" || fail "$base/ is missing $name"
done
grep -i '^content-security-policy:' <<<"$h" | grep -qiE "unsafe-inline|unsafe-eval" &&
  fail "$base/ CSP allows unsafe-inline/eval"
echo "ok   $base/ headers"
echo "smoke test passed"
