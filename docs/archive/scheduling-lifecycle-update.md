# PumpTracker Scheduling Lifecycle Update

---

## Section 1 – Lifecycle & Store Updates

Here’s how I’m thinking about the core state changes. We add **"UNSCHEDULED"** to the `Stage` union and make it the default whenever a PO expands into pumps in `addPO`. `moveStage` continues to accept any stage, but we’ll introduce two helper utilities:  
- `schedulePump(pumpId, dropDate)` — sets `scheduledStart/End` based on lead times and performs  
  `updatePump(pumpId, { stage: "NOT STARTED", scheduledStart, scheduledEnd })`.  
- `clearSchedule(pumpId)` — nulls the dates and moves the stage back to **"UNSCHEDULED"** (while emitting a toast so users know it reverted).

`SchedulingSidebar` will simply query `pumps.filter(p => p.stage === "UNSCHEDULED")`, so the moment a schedule is assigned the card disappears from the draggable queue. To preserve queue context, Kanban/Dashboard views automatically reflect the **"NOT STARTED"** stage, meaning analytics already get the “upcoming jobs” view without duplicating cards.

We’ll also persist the new stage everywhere the `Stage` type is imported (kanban cards, charts, filters) and ensure the stage order array includes **"UNSCHEDULED"** at the top so WIP limits and column renders remain deterministic. Finally, seeding/local adapters should version their storage key (e.g., bump to `pumptracker-lite-v3`) so users don’t keep stale pumps that lack the new stage.

---

## Section 2 – Drag/Drop & Sidebar UX

Drag handling lives in `src/components/scheduling/DragAndDropContext.tsx`. Today it only patches `scheduledStart/End`; we’ll swap that to call a new store action (or reuse `updatePump`) that also assigns `stage: "NOT STARTED"` when scheduling succeeds.  

We’ll guard for double-scheduling: if a pump is already staged beyond **NOT STARTED** we can show a warning (“Already in FABRICATION—move it in Kanban instead?”) and bail, so users don’t accidentally overwrite live work.

The unscheduled sidebar becomes a pure queue. Since the list may shrink drastically once jobs move through the pipeline, we can add empty-state messaging (“All pumps scheduled—nice!”) plus a button that jumps the user to the calendar/week containing the most recently scheduled job, helping them locate what they just dropped.

For the “preview next few jobs” idea, I propose a secondary panel beneath the main calendar—call it **“Upcoming Queue”**—that lists the first 4–5 pumps whose stage is **"NOT STARTED"** ordered by due date. Cards here would be compact (maybe chips showing PO, model, promise date) and not draggable; they just remind the user of what’s next.  

If that feels too busy, we can instead render a badge at the top of the calendar showing “Next 4 jobs: …” pulling from the same data. Either way, the main draggable list remains only **"UNSCHEDULED"**.

---

## Section 3 – Playwright & Docs Alignment

Once the lifecycle changes land, the current Playwright suite will need adjustments so it mirrors the new behavior instead of assuming cards hang around.  

The drag-and-drop tests in `tests/e2e/scheduling.spec.ts` should now assert that the sidebar no longer contains that pump  
(`page.locator('[data-testid="backlog-dock"]').locator([data-pump-id="${pumpId}"]) → expect hidden`)  
while verifying the calendar event exists and stage advanced to **"NOT STARTED"** (we can expose the stage via `data-stage` on calendar events).

Helper utilities in `tests/e2e/helpers/test-utils.ts` will pivot to the `[data-testid]` hooks we discussed, and `Assertions.expectJobToBeMoved` will assert `stage !== "UNSCHEDULED"` rather than relying on `data-scheduled-state`.

For docs: we’ll refresh `README.md`, `CURRENT_STATUS.md`, and `PROJECT_CONTEXT.md` with the new stage diagram (explicit **“UNSCHEDULED → NOT STARTED → …”**) plus a short narrative describing the queue/sidebar behavior.  

Playbook-style files such as `TEST_REPORT.md`, `VERIFICATION_CHECKLIST.md`, and any scheduling plan docs (`docs/plans/2025-11-08-scheduling-timeline-realism.md`) should gain a section summarizing the lifecycle update and pointing agents to the new store helpers.  

Finally, we’ll add a short note to `notes.md` or `pumptracker-roadmap.md` about the “Upcoming Queue” idea so future contributors don’t reintroduce redundant sidebar cards.

---

## Implementation Plan

### Introduce `UNSCHEDULED` Stage

- Update `src/types.ts` to include `"UNSCHEDULED"` (place before `"NOT STARTED"`).  
- Adjust any stage-order constants (e.g., `STAGE_ROWS`, Kanban column arrays, WIP limits in `src/store.ts`) so the new stage appears first.  
- Bump the persistence key in `useApp` (e.g., `pumptracker-lite-v3`) to avoid stale data lacking the new stage.

### Store & Helpers

- In `src/store.ts`’s `addPO`, set `stage: "UNSCHEDULED"` for all newly expanded pumps.  
- Add two store actions:  
  - `schedulePump(id, dropDate)` → reads lead times, derives start/end, updates pump with `scheduledStart`, `scheduledEnd`, `stage: "NOT STARTED"`, `last_update`.  
  - `clearSchedule(id)` → nulls `scheduledStart/End` and sets `stage: "UNSCHEDULED"`.  
- Export these actions via `useApp`. Ensure adapters persist the new stage data.

### Drag/Drop Flow

- In `src/components/scheduling/DragAndDropContext.tsx`, replace direct `updatePump` call with `schedulePump`.  
- Before scheduling, guard against pumps already beyond `"NOT STARTED"` (show toast and cancel).  
- Wire the forthcoming “Clear” button (likely in `EventDetailPanel` or a context menu) to call `clearSchedule`.

### Sidebar & Queue UX

- `SchedulingSidebar`: filter pumps strictly by `pump.stage === "UNSCHEDULED"`.  
- Revise empty-state copy (“All jobs are scheduled”).  
- Optional: add a secondary **“Upcoming Queue”** near the calendar showing first 4–5 `"NOT STARTED"` pumps (non-draggable) using compact tiles.

### Calendar Event Metadata

- Ensure `CalendarEvent` receives `pump.stage` and emits `data-stage`.  
- When a job is scheduled, Kanban/Dashboard already reflect `"NOT STARTED"`; verify any stage-based colors include the unscheduled color if needed.

### Playwright Updates

- Update `tests/e2e/helpers/test-utils.ts` to rely on `[data-testid]` hooks and expose helpers like `isPumpInSidebar`, `getCalendarEventByPump`.  
- In `tests/e2e/scheduling.spec.ts`: after drag, assert the sidebar no longer contains the pump and that a calendar event exists with `data-stage="NOT STARTED"`.  
- `Assertions.expectJobToBeMoved` should confirm the pump’s stage is not `"UNSCHEDULED"`.  
- Rerun targeted suites:  
  ```bash
  pnpm test:e2e --project=chromium --grep Scheduling
  ```

### State Migration

- Optionally add a lightweight migration in `load()` to coerce legacy pumps lacking stage into `"UNSCHEDULED"` so older datasets don’t break.

---

## Documentation Updating Checklist

### README.md

- Update the feature overview to describe the scheduling lifecycle (**UNSCHEDULED → NOT STARTED → …**).  
- Mention that the sidebar now lists only unscheduled pumps and that scheduled jobs appear exclusively on the calendar.

### CURRENT_STATUS.md

- Add a subsection under “Changes Implemented” describing the new stage, drag behavior, and upcoming queue concept.  
- Include verification instructions: *“Drag a card, confirm it leaves the sidebar and shows on the calendar.”*

### PROJECT_CONTEXT.md / notes.md

- Record the rationale for introducing `"UNSCHEDULED"` (keeps all pumps inside the stage pipeline, simplifies filtering).  
- Document intended UX (queue limited to unscheduled, optional preview list) to guide future development.

### TEST_REPORT.md / VERIFICATION_CHECKLIST.md

- Note updated Playwright coverage: drag-and-drop now asserts stage advancement and sidebar removal.  
- Ensure checklist includes steps for clearing schedules and confirming jobs reappear in the unscheduled queue.

### docs/plans/

- Create or edit plan file (e.g., `docs/plans/2025-01-13-scheduling-lifecycle.md`) summarizing today’s implementation details.  
- Reference the upcoming **“Clear schedule”** button so agents know it’s expected.

### pumptracker-roadmap.md

- Append an entry about the new lifecycle milestone and the **“Upcoming Queue”** enhancement.

---

Once these documentation updates are in place, other contributors will have a single source of truth for the scheduling model.
