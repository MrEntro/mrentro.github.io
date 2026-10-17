#!/usr/bin/env bash
# Checks a running container: routes, status codes and security headers.
# Usage: deploy/smoke-test.sh [base url]
set -euo pipefail
base=${1:-http://127.0.0.1:8080}
fail() { echo "FAIL: $*" >&2; exit 1; }

status() {
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' "$base$1")
  [[ $code == "$2" ]] || fail "$1 returned $code, expected $2"
  echo "ok   $1 -> $code"
}

status / 200
status /index 200
status /does-not-exist 404
status /static/contentIndex.json 200
status /index.css 200

for path in / /does-not-exist /index.css; do
  headers=$(curl -sI "$base$path")
  for h in content-security-policy strict-transport-security x-content-type-options \
    x-frame-options referrer-policy permissions-policy cross-origin-opener-policy; do
    grep -qi "^$h:" <<<"$headers" || fail "$path is missing $h"
  done
  csp=$(grep -i '^content-security-policy:' <<<"$headers")
  grep -qiE "unsafe-inline|unsafe-eval" <<<"$csp" && fail "$path CSP allows unsafe-inline/eval"
  grep -qi '^server: nginx/' <<<"$headers" && fail "$path leaks the nginx version"
  echo "ok   $path headers"
done
echo "smoke test passed"
