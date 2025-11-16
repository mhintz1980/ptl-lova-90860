# Scheduling Timeline Realism Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Render a trustworthy multi-stage timeline on the Scheduling page that mirrors real manufacturing lead times and enforces valid drag-to-schedule interactions without mutating actual Kanban stages.

**Architecture:** Introduce pure scheduling utilities that turn pump + catalog lead times into stage blocks and calendar events, reuse them inside `MainCalendarGrid`, and update the drag context to validate drop dates and persist derived `scheduledStart`/`scheduledEnd` values. UI components consume these helpers so they stay declarative while Zustand continues to own pump truth.

**Tech Stack:** React 18, Zustand, dnd-kit, date-fns, Vitest (unit), Testing Library + JSDOM, Playwright (E2E sanity).

### Task 1: Scheduling utilities for stage timelines

**Files:**
- Create: `src/lib/schedule.ts`
- Modify: `src/types.ts` (export `Stage` for helpers if needed)
- Test: `tests/lib/schedule.test.ts`

**Step 1: Write the failing test**

```ts
// tests/lib/schedule.test.ts
import { buildStageTimeline, buildCalendarEvents, getScheduleWindow } from "../../src/lib/schedule";
import type { Pump } from "../../src/types";

const pump: Pump = {
  id: "1",
  serial: 1001,
  po: "PO2025-0001-01",
  customer: "United Rentals",
  model: "DD-6",
  stage: "NOT STARTED",
  priority: "Normal",
  last_update: new Date("2025-11-01").toISOString(),
  value: 28000,
  scheduledStart: new Date("2025-11-10").toISOString(),
};

const leadTimes = {
  fabrication: 2,
  powder_coat: 3,
  assembly: 1,
  testing: 1,
  total_days: 7,
};

describe("schedule utilities", () => {
  it("builds sequential stage blocks using lead times", () => {
    const blocks = buildStageTimeline(pump, leadTimes);
    expect(blocks.map((b) => b.stage)).toEqual([
      "FABRICATION",
      "POWDER COAT",
      "ASSEMBLY",
      "TESTING",
      "SHIPPING",
    ]);
    expect(blocks[0].start.toISOString()).toBe("2025-11-10T00:00:00.000Z");
    expect(blocks[1].start > blocks[0].end).toBe(false);
    expect(blocks.at(-1)?.end.toISOString()).toBe("2025-11-17T00:00:00.000Z");
  });

  it("maps timeline blocks to calendar events per week column", () => {
    const events = buildCalendarEvents([pump], leadTimes, new Date("2025-11-10"), 14);
    const fabrication = events.find((e) => e.stage === "FABRICATION");
    const powder = events.find((e) => e.stage === "POWDER COAT");
    expect(fabrication?.span).toBe(2);
    expect(powder?.startDay).toBe(fabrication!.startDay + fabrication!.span);
  });

  it("returns schedule window for persistence", () => {
    const window = getScheduleWindow(blocks => buildStageTimeline(pump, leadTimes));
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/lib/schedule.test.ts -r`  
Expected: FAIL (modules missing).

**Step 3: Write minimal implementation**

```ts
// src/lib/schedule.ts
import { addBusinessDays, startOfDay } from "date-fns";
import { Stage, Pump } from "../types";

const STAGE_SEQUENCE: Stage[] = [
  "FABRICATION",
  "POWDER COAT",
  "ASSEMBLY",
  "TESTING",
  "SHIPPING",
];

export function buildStageTimeline(pump: Pump, leadTimes: StageDurations): StageBlock[] {
  // compute StageBlock { stage, start: Date, end: Date, days }
}

export function buildCalendarEvents(pumps: Pump[], leadTimesByModel: LeadTimeLookup, viewStart: Date, days: number): CalendarEventData[] {
  // flatten pump timelines into week/day coordinates
}

export function getScheduleWindow(blocks: StageBlock[]): { startISO: string; endISO: string } {
  // min start, max end -> ISO strings
}
```

(Include helper types + exports, rely on `getModelLeadTimes` when caller doesn’t pass leadTimes.)

**Step 4: Run test to verify it passes**

Run: `pnpm vitest tests/lib/schedule.test.ts -r`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/schedule.ts src/types.ts tests/lib/schedule.test.ts
git commit -m "feat: add scheduling timeline utilities"
```

### Task 2: Render multi-stage events in MainCalendarGrid

**Files:**
- Modify: `src/components/scheduling/MainCalendarGrid.tsx`
- Modify: `src/components/scheduling/CalendarEvent.tsx` (add stage color props)
- Modify: `src/components/scheduling/EventDetailPanel.tsx`
- Test: `tests/components/MainCalendarGrid.test.tsx`

**Step 1: Write the failing test**

```tsx
// tests/components/MainCalendarGrid.test.tsx
import { render, screen } from "@testing-library/react";
import { MainCalendarGrid } from "../../src/components/scheduling/MainCalendarGrid";
import { useApp } from "../../src/store";

vi.mock("../../src/store");

it("draws stacked stage events with labels", () => {
  (useApp as unknown as () => any).mockReturnValue({
    pumps: [pumpWithSchedule],
  });
  render(<MainCalendarGrid onEventClick={vi.fn()} />);
  expect(screen.getByText(/DD-6 · Fabrication/i)).toBeInTheDocument();
  expect(screen.getByText(/Powder Coat/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest tests/components/MainCalendarGrid.test.tsx -r`  
Expected: FAIL (text not rendered).

**Step 3: Write minimal implementation**

- Use `buildCalendarEvents` to derive `events`.
- Replace hand-rolled `scheduledEvents` with helper call.
- Render each event with label `${pump.model} · ${stageLabel}` and stage-specific gradient classes (map stage → colors, e.g. `STAGE_COLORS` constant).
- Update `CalendarEvent` component to accept `label`, `accent`, `span`, `onClick` props.
- Feed `EventDetailPanel` with actual stage info (type = stage, description from block).

**Step 4: Run test to verify it passes**

Run: `pnpm vitest tests/components/MainCalendarGrid.test.tsx -r`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/scheduling/*.tsx tests/components/MainCalendarGrid.test.tsx
git commit -m "feat: visualize multi-stage schedule events"
```

### Task 3: Enforce valid drag scheduling + persistence window

**Files:**
- Modify: `src/components/scheduling/DragAndDropContext.tsx`
- Modify: `src/components/scheduling/SchedulingSidebar.tsx` (show schedule badges)
- Modify: `src/components/kanban/PumpCard.tsx` (optional schedule chip reuse)
- Test: extend `tests/lib/schedule.test.ts` for `calculateScheduleWindow`, new helper `validateDropDate`
- E2E: `tests/e2e/scheduling.spec.ts` (Playwright) – add scenario verifying drag behavior

**Step 1: Write the failing unit & e2e tests**

```ts
// tests/lib/schedule.test.ts (append)
import { getScheduleWindow, isValidScheduleDate } from "../../src/lib/schedule";

it("rejects drops before today", () => {
  expect(isValidScheduleDate(new Date("2025-01-01"), new Date("2025-01-02"))).toBe(false);
  expect(isValidScheduleDate(new Date("2025-01-03"), new Date("2025-01-02"))).toBe(true);
});
```

```ts
// tests/e2e/scheduling.spec.ts
import { test, expect } from "@playwright/test";

test("dragging unscheduled job onto calendar assigns start/end", async ({ page }) => {
  await page.goto("http://localhost:5173");
  await page.getByRole("button", { name: /Scheduling/i }).click();
  const card = page.getByText(/DD-6/).first();
  await card.dragTo(page.getByTestId("calendar-cell-0"));
  await expect(card).toContainText(/Scheduled/);
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm vitest tests/lib/schedule.test.ts -r` (expect failure)  
Run: `pnpm test:e2e --grep scheduling` (expect failure until feature implemented).

**Step 3: Write minimal implementation**

- In `src/lib/schedule.ts`, export `isValidScheduleDate` + `deriveScheduleWindow(dropDate, pump)` that clamps to future dates and returns `{ scheduledStart, scheduledEnd }`.
- Update `DragAndDropContext` `handleDragEnd`:
  - Ignore drops when `!over` or invalid date, show `toast.error`.
  - When valid, call `deriveScheduleWindow` and `updatePump` with `scheduledStart`/`scheduledEnd` only (leave `stage` untouched).
- Update `SchedulingSidebar` cards to surface scheduled badges (e.g., show start date if already scheduled).
- Adjust `UnscheduledJobCard` to display “Scheduled” chip when `scheduledStart` exists to satisfy e2e expectation.

**Step 4: Run tests to verify they pass**

Run: `pnpm vitest tests/lib/schedule.test.ts -r`  
Run dev server + Playwright: `pnpm dev` (in another terminal) then `pnpm test:e2e --grep scheduling` (or `pnpm test:e2e scheduling`). Expect new scenario to PASS.

**Step 5: Commit**

```bash
git add src/components/scheduling src/components/kanban/PumpCard.tsx src/lib/schedule.ts tests
git commit -m "feat: validate drag scheduling and persist windows"
```

### Final Verification

1. `pnpm lint`
2. `pnpm test`
3. `pnpm test:e2e --grep scheduling`
4. `pnpm dev` → manually open Scheduling view, drag a job into a future cell, confirm stacked stage bars update and Kanban stage stays unchanged via Dashboard/Kanban views.

