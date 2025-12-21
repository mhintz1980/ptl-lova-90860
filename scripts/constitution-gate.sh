#!/usr/bin/env bash
set -euo pipefail

pnpm test

echo "Checking forbidden calendar scheduling mutations..."
rg -n "schedulePump|clearSchedule|autoSchedule|scheduledStart|scheduledEnd" src && {
  echo "❌ Forbidden scheduling mutation references found."
  exit 1
} || echo "✅ No forbidden scheduling mutation references."

echo "Checking legacy stage strings..."
rg -n "\"POWDER COAT\"|TESTING|SHIPPING" src && {
  echo "❌ Legacy stage strings found."
  exit 1
} || echo "✅ No legacy stage strings."

echo "✅ Constitution gate passed."
