# Development Guide

## Environment Setup

```bash
pnpm install          # install dependencies
pnpm dev              # start Vite on http://localhost:5173
PNPM_TEST_BASE_URL=http://localhost:5173 pnpm playwright test  # see testing.md for details
```

Use **pnpm** for scripts. The dev server will warn if the port is taken; adjust with `pnpm dev --port <port> --host 0.0.0.0` and pass the same URL to Playwright.

## Coding Conventions

- **Components**: colocate feature-specific components under `src/components/<feature>`. Shared primitives belong in `src/components/ui`.
- **State**: extend `src/store.ts` with new selectors/actions rather than adding ad-hoc React state. Persisted settings belong in the Zustand partializer.
- **Styling**: Tailwind for layout + utilities. If a style is reused, promote it to `src/index.css` (see `.header-button`, `.stage-color-*`, `.scrollbar-themed`).
- **Data**: `PumpCard` is the canonical representation of a pump, now reused on both Kanban and Scheduling. If you need different drag behavior, adjust the `draggableConfig` prop instead of duplicating markup.

## Feature Tips

- **Legend Filters**: `schedulingStageFilters` should only influence the scheduling view. If you need a new quick filter, keep it scoped and let the global `filters` state continue to affect every page.
- **Sorting**: Respect `sortField` + `sortDirection` when listing pumps. Import `sortPumps` rather than rolling custom sorts.
- **Calendar Layout**: `MainCalendarGrid` assumes six weeks of data and uses the stage filter set to drop non-selected events. When modifying the timeline, ensure `projectSegmentsToWeek` remains pure.

## How to Add a Feature

1. **Plan**: capture goals in `docs/README.md` (link to any new design doc).
2. **Update Store**: add actions/selectors and persist state when needed.
3. **Implement UI**: reuse `PumpCard`, `Button`, etc. to keep styling consistent.
4. **Document**: update README and/or `docs/` with any new workflows, configs, or env vars.
5. **Test**: run `pnpm test` and the relevant Playwright spec before opening a PR.
