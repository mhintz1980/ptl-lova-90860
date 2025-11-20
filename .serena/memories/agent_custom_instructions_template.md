# Agent Custom Instructions (PumpTracker Lite)

## What to build
- Agent is working on PumpTracker Lite (React+TS, Tailwind, Zustand, Recharts, dnd-kit). Data comes from seed (`src/lib/seed.ts` + `src/data/pumptracker-data.json`) with optional Supabase adapter.
- Core flows: add Purchase Orders (expands to pumps) → Kanban stages/backlog → schedule on calendar → adjust based on dashboard insights → close orders.

## Surfaces & state (must respect)
- Dashboard: KPIs, workload/value pies, capacity, trend, PO table. Uses filtered/sorted pumps from store.
- Kanban: stage columns with WIP limits; drag/drop `PumpCard` to move stages.
- Scheduling: backlog dock, calendar built from lead times; drag/drop to schedule, leveling helpers.
- Zustand store (`src/store.ts`) holds pumps, filters, WIP limits, sortField/sortDirection, schedulingStageFilters; adapters persist data.

## In-flight goals (keep within these bounds)
- Dashboard engine: topic/category pills near header swap in chart sets from a config-driven registry.
  - Financials: value of open orders; value of scheduled shipments (week/month/quarter); value of completed orders (week/month/quarter).
  - Production Mgmt: build-time stats; ahead/behind jobs; bottleneck/capacity visuals; goal tracking.
  - New charts must use shared `ChartProps` and be registered.
- Scheduling revamp: drag existing scheduled jobs with capacity/man-hour limits; resize duration by dragging ends; auto-level toggle; lock specific jobs to dates; rule-based scheduling (“must start by” etc.).

## User flow (don’t diverge)
1. Add PO/customer/lines → pumps created with stage=UNSCHEDULED, serial, value, promise dates.
2. Kanban/backlog: UNSCHEDULED pumps visible; drag in Kanban or schedule on calendar.
3. Scheduling: drop to set scheduledStart/End via lead times; revamp allows drag/resize, lock, rules, auto-level.
4. Dashboard drilldown: charts filter by stage/customer/model; insights drive schedule/kanban adjustments.
5. Close-out: stages progress to CLOSED; dashboard reflects completed value and build-time stats.

## Commands & tooling
- Use pnpm/npm for dev/test; keep build green (`npm run build`).
- Reuse UI primitives and styles (`src/components/ui`, `src/index.css`).
- Extend store instead of ad-hoc state; respect existing sorts/filters.

## Delivery expectations
- Charts pluggable via registry; drilldown + breadcrumb/reset.
- Scheduling changes enforce capacity/man-hour rules and new locks/rules.
- Update docs/tests when adding behaviors.
