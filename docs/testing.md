---
title: "PumpTracker Lite – Testing Guide"
doc_type: "testing_guide"
app_name: "PumpTracker Lite"
version: "1.0"
status: "active"
test_layers:
  - "unit"
  - "integration"
  - "end_to_end"
tools:
  - "Vitest"
  - "Playwright"
related_docs:
  - "Development Guide"
  - "Architecture Overview"
  - "PumpTracker Lite – Deployment Guide"
summary: >
  How to run and interpret unit, integration, and E2E tests for PumpTracker Lite,
  including Playwright base URL overrides and checks for scheduling legend filters.
---

# Testing Guide

## Unit & Integration (Vitest)

```bash
pnpm test              # run all suites
pnpm test src/store.ts # run a specific file
```

Vitest covers hooks, the Zustand store, scheduling helpers, and core components. Add new specs under `src/` or `tests/components` as appropriate.

## End-to-End (Playwright)

Playwright tests live in `tests/e2e`. The config defaults to `http://localhost:3000`, but you can point it at any running dev server via `PLAYWRIGHT_TEST_BASE_URL`:

```bash
pnpm dev --port 5173 &           # start Vite
PLAYWRIGHT_TEST_BASE_URL=http://localhost:5173 pnpm playwright test
```

Useful scripts:

- `pnpm playwright test tests/e2e/scheduling-enhanced.spec.ts --project=chromium`
- `pnpm playwright test --headed --project=chromium` (interactive)
- `pnpm playwright test --ui` (Playwright Test UI)

### Verifying the Stage Legend Filters

1. Seed a few events by dragging jobs from the backlog to the calendar.
2. Click one of the legend buttons (`data-stage-filter="FABRICATION"`).
3. Ensure only events whose `data-stage` matches remain.
4. Click the same button again to clear the quick filter.

The `stage legend filters calendar events` test inside `tests/e2e/scheduling-enhanced.spec.ts` automates this workflow. If it fails, confirm:

- `schedulingStageFilters` is wired through `SchedulingView` to `MainCalendarGrid`.
- Legend buttons have the `data-stage-filter` attribute and call `toggleSchedulingStageFilter`.
- Playwright is pointed at the correct dev server port.

## Linting & Type Checking

- `pnpm lint`
- `pnpm tsc --noEmit`

Run these before publishing a PR.