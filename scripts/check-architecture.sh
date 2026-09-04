#!/usr/bin/env bash
#
# The architectural rules that types cannot express, checked as text.
#
# Each one protects a property claimed in docs/ARCHITECTURE.md. They run in CI
# and locally via `pnpm check:arch`, because a rule nobody enforces is a rule
# that quietly stops being true.

set -uo pipefail
cd "$(dirname "$0")/.."

failed=0

fail() {
  echo "FAIL  $1"
  shift
  printf '      %s\n' "$@"
  failed=1
}

pass() { echo "ok    $1"; }

# Matches a pattern in real code only. Comments in this project explain the
# rules themselves ("this component never calls getCollection"), so a naive
# grep flags the documentation as a violation.
code_matches() {
  grep -rnE "$1" "${@:2}" 2>/dev/null | awk '
    {
      line = $0
      sub(/^[^:]*:[0-9]+:/, "", line)      # drop the file:line prefix
      sub(/^[ \t]+/, "", line)             # drop leading indentation
      if (line !~ /^(\/\/|\*|\/\*|#|<!--)/) print
    }'
}

files_with_code() { code_matches "$@" | cut -d: -f1 | sort -u; }

# 1. Zero JS by default: React may only appear inside islands.
offenders=$(find src -name '*.tsx' -not -path 'src/components/islands/*' || true)
if [ -n "$offenders" ]; then
  fail ".tsx outside src/components/islands/" $offenders
else
  pass ".tsx only inside src/components/islands/"
fi

# 2. Sections and layouts take props; only pages and the query layer fetch.
offenders=$(files_with_code 'getCollection\(' src --include='*.astro' --include='*.ts' \
  | grep -v '^src/pages/' | grep -v '^src/content/queries.ts$' || true)
if [ -n "$offenders" ]; then
  fail "getCollection outside src/pages/ and src/content/queries.ts" $offenders
else
  pass "getCollection confined to pages and the query layer"
fi

# 3. Astro 7 renders Markdown with Sätteri. Reintroducing the unified pipeline
#    silently forfeits the faster one, so it must be a deliberate act.
offenders=$(files_with_code '@astrojs/markdown-remark' src astro.config.ts || true)
if [ -n "$offenders" ]; then
  fail "the remark pipeline was reintroduced" $offenders
else
  pass "Markdown stays on the Sätteri pipeline"
fi

# 4. The kernels stay pure, so they remain testable without Astro.
offenders=$(files_with_code 'from "(astro:|@/components)' src/i18n src/content/schemas.ts || true)
if [ -n "$offenders" ]; then
  fail "a kernel imported Astro or a component" $offenders
else
  pass "src/i18n and src/content/schemas.ts stay dependency-free"
fi

# 5. User-facing copy comes from the dictionary via t(), never read directly.
offenders=$(files_with_code 'ui\[' src/components src/layouts || true)
if [ -n "$offenders" ]; then
  fail "a component read the dictionary directly instead of using t()" $offenders
else
  pass "components translate through useTranslations"
fi

# 6. The site origin lives in config, so `pnpm setup` can rewrite it. A URL
#    hardcoded in a component would survive setup silently and ship someone
#    else's domain to production.
#
#    Allowed: the two XML namespaces that are identifiers rather than
#    addresses — w3.org for SVG, schema.org for JSON-LD. Tests are excluded
#    because their fixtures are not shipped markup.
offenders=$(code_matches 'https?://' src/components src/layouts src/pages \
  --include='*.astro' --include='*.ts' --include='*.tsx' \
  | grep -vE '(www\.w3\.org|schema\.org)' \
  | grep -vE '\.test\.(ts|tsx):' \
  | cut -d: -f1 | sort -u || true)
if [ -n "$offenders" ]; then
  fail "a URL was hardcoded outside src/config/site.ts" $offenders \
    "pnpm setup rewrites the origin in config; it cannot find it here."
else
  pass "the site origin stays in config"
fi

echo
if [ "$failed" -ne 0 ]; then
  echo "Architecture check failed. See docs/ARCHITECTURE.md for the rationale."
  exit 1
fi
echo "Architecture check passed."
