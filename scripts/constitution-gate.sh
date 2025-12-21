#!/usr/bin/env bash
set -euo pipefail

pnpm test

# -----------------------------------------------------------------------------
# 1) Forbidden scheduling truth mutations (must not exist anywhere)
# -----------------------------------------------------------------------------
echo "Checking forbidden calendar scheduling mutations..."
if rg -n "schedulePump|clearSchedule|autoSchedule|scheduledStart|scheduledEnd" src; then
  echo
  echo "❌ Forbidden scheduling mutation references found."
  echo "   Action: Rename to forecast-hint APIs (setForecastHint/clearForecastHint/etc.)"
  echo "   and remove scheduledStart/scheduledEnd truth-like fields."
  exit 1
else
  echo "✅ No forbidden scheduling mutation references."
fi

# -----------------------------------------------------------------------------
# 2) Legacy stage strings are allowed ONLY in migration/mapping files
# -----------------------------------------------------------------------------
echo "Checking legacy stage strings (allowed only in migration/mapping files)..."

# Tokens we consider legacy
LEGACY_PATTERN="\"POWDER COAT\"|TESTING|SHIPPING"

# Where legacy tokens are permitted to exist
# Add/remove allowlist entries as needed, but keep it tight.
ALLOWLIST=(
  "src/lib/stage-constants.ts"
  "src/infrastructure/persistence/MigrationAdapter.ts"
  # Optional: allow legacy fixtures only if you intentionally keep them
  "src/test-fixtures"
)

# Find all matches
matches="$(rg -n "$LEGACY_PATTERN" src || true)"

if [[ -z "$matches" ]]; then
  echo "✅ No legacy stage strings."
  echo "✅ Constitution gate passed."
  exit 0
fi

# Filter out allowlisted matches
violations="$matches"
for allowed in "${ALLOWLIST[@]}"; do
  # Remove lines that start with allowed file paths
  violations="$(echo "$violations" | rg -v "^${allowed}:" || true)"
done

if [[ -n "$violations" ]]; then
  echo
  echo "❌ Legacy stage strings found OUTSIDE allowlisted migration/mapping files:"
  echo "$violations"
  echo
  echo "   Allowed locations:"
  for allowed in "${ALLOWLIST[@]}"; do
    echo "   - $allowed"
  done
  echo
  echo "   Action: Replace legacy labels with canonical stages:"
  echo "   - \"POWDER COAT\" -> POWDER_COAT (UI label: Powder Coat)"
  echo "   - TESTING/SHIPPING -> SHIP (UI label: Ship)"
  exit 1
else
  echo "✅ Legacy stage strings exist only in allowlisted migration/mapping files."
fi

echo "✅ Constitution gate passed."
