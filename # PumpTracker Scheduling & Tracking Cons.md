# PumpTracker Scheduling & Tracking Constitution (AI Agent Reference Sheet)

**Status:** Mandatory ruleset  
**Audience:** AI agents planning, implementing, or refactoring PumpTracker scheduling + production tracking  
**Priority:** Rules > UI > Code. If any existing code conflicts with this document, the code is wrong.

---

## 0) Prime Directive

**Kanban is truth. Calendar is projection.**  
The system must never “invent reality” by auto-advancing job state. Only humans moving cards on the Kanban board change the actual state of work.

---

## 1) Source of Truth

### 1.1 Kanban is the sole source of truth for production state

- A job’s **actual start**, **actual finish**, **stage entry**, **stage exit**, and **overall completion** are determined **only** by Kanban card movement events.
- **No other interface** (calendar, list view, admin panel) may change a job’s stage unless it is explicitly a Kanban-equivalent action (i.e., it produces the same event as moving the card).

### 1.2 Calendar must never mutate reality

- The calendar **must not** auto-complete stages or jobs.
- The calendar **must not** move jobs between stages.
- The calendar may **only**:
  - Visualize current state
  - Forecast future dates based on rules
  - Recalculate projections after truth changes (Kanban moves, capacity changes, locks)

**Invariant:**

> If the job did not move on Kanban, the job did not change stages.

---

## 2) Calendar Purpose & Guarantees

### 2.1 Calendar is a read-only projection

- The calendar answers:
  - “Given what’s happening right now, what are the projected stage completion dates and projected overall completion date?”
- The calendar is continuously recalculated based on current reality.

### 2.2 Calendar guarantees

- Calendar forecasts must update immediately after:
  - Kanban stage transitions
  - Capacity/hour changes
  - Lock toggles
  - Workday calendar changes (e.g., weekends/holidays)
- Calendar forecasts must remain **consistent** with the rules in this document.

---

## 3) Default Calendar View: Job-Centric Timeline (Collapsed)

### 3.1 One row per job

- Each calendar row represents **one job** (pump build).
- The job appears as **one continuous horizontal lifecycle bar**.

### 3.2 Internally segmented bar (stages inside the job bar)

- The lifecycle bar is internally segmented into contiguous stages, in order:
  1. Fabrication
  2. Powder Coating
  3. Assembly
  4. Shipping
- Segments are contiguous (no gaps) **unless** explicitly created by:
  - Non-working days (weekend/holiday pause)
  - Lock constraints (see Section 7)

### 3.3 Stage segments are informational only

- The segmentation shows “what happens in between” start and ship.
- The segmentation is not a dependency graph and not an editable schedule.

---

## 4) Visual Semantics (Non-Negotiable Meaning)

### 4.1 Segment width

- Segment width represents the **projected time** a job is expected to spend in that stage.
- Projection is derived from:
  - Remaining estimated hours for that stage (or stage estimate basis)
  - Stage daily hour pool (capacity)
  - Stage WIP constraints
  - Non-working time

### 4.2 Segment fill (progress bar)

- Segment fill represents **estimated progress only**.
- Estimated progress accrues based on equal distribution of stage hours across active jobs (Section 5).
- **Progress reaching 100% does not complete the stage.** Stage completion requires a Kanban move.

### 4.3 Segment boundaries

- Segment boundaries shift dynamically after forecast recalculation.
- Segment boundaries must snap immediately after Kanban moves (truth changed).

---

## 5) Stage Model: Capacity Bucket + Hour Pool

Each stage is modeled as a **capacity-limited bucket** with a **daily man-hour pool**.

### 5.1 Stage configuration

Each stage must define:

- `daily_hours` (total available man-hours per working day)
- `wip_limit` (maximum number of active jobs allowed simultaneously in that stage)

### 5.2 Active vs Queued jobs

- **Active job:** counts toward WIP limit and receives daily hour allocation.
- **Queued job:** exceeds WIP limit, receives **zero hours**, and must be visually distinct in the calendar.

### 5.3 Equal distribution rule

For each working day, within each stage:

- If there are `N` active jobs in the stage, each active job receives:
  - `daily_hours / N` hours (equal split)
- Hours accrue day-by-day, not “weekly resets.”

### 5.4 No implicit stage advancement

- Jobs remain in a stage until explicitly moved on Kanban.

---

## 6) Non-Working Time

### 6.1 Weekends/holidays are hourless

- Non-working days contribute **0 hours**.
- Segment fill pauses during non-working time.
- Forecasted end dates slide accordingly.

### 6.2 No time-boundary automation

- Jobs do not exit/enter stages due to day/week boundaries.
- **No Friday dump / Monday reset** behavior is permitted.

---

## 7) Locks & Allowed Gaps

### 7.1 Job-level locks

- Users may lock individual jobs.
- A locked job’s projected start/end must not move (unless an expert override is performed with audit trail).

### 7.2 Reflow around locks

- When schedule projections change, unlocked jobs reflow around locked jobs automatically.

### 7.3 Allowed gaps rule (exception handling)

A gap is permitted **only if all are true**:

1. The gap is created by a locked job constraint
2. No queued or unscheduled job can fully fit within the gap window
3. The gap is visibly marked and explained to the user

### 7.4 Gap communication requirement

- Any allowed gap must show:
  - Visual indicator (striped area / warning)
  - A tooltip or label explaining:
    - “Gap exists due to locked job. No job can fit.”

---

## 8) Interaction Rules (Hard Rules)

### 8.1 Calendar is non-authoritative and non-editing

- Users must not be able to drag, resize, or edit stage segments in the calendar in a way that changes truth.
- Calendar interactions may allow:
  - Selection
  - Filtering
  - Zoom (time scale)
  - Opening job details
  - Toggling view modes (collapsed/expanded)
  - Adjusting locks and capacity via explicit controls (not drag/resize of bars)

### 8.2 All truth-changing actions are Kanban actions

- Stage transitions must occur via Kanban move events (or an explicit action that produces the same event).

---

## 9) Filters, Focus, and Expansion

### 9.1 Departments are filters (not always-visible lanes)

- Default view is job-centric.
- Department-specific focus is achieved through filters:
  - Highlight segments for chosen stages
  - Optionally expand job rows into stage detail

### 9.2 Expanded views do not change semantics

- Expanded views may show:
  - Stage-specific detail
  - Stage-specific projections and queued states
- Expanded views still must obey:
  - Kanban truth
  - No calendar editing of truth

---

## 10) Audit and Safety Requirements

### 10.1 Expert overrides (if implemented)

If a rule can be overridden, it must require:

- Who performed the override
- Timestamp
- Reason
- What changed (before/after)
- Rollback strategy (where feasible)

**Default:** prefer no overrides unless necessary.

---

## 11) Implementation Invariants (Checklist)

Agents must enforce the following invariants across code, data model, and UI:

- [ ] Kanban movement events are the only mechanism that changes job stage history.
- [ ] Calendar never writes stage transitions.
- [ ] Calendar projections recompute after truth changes.
- [ ] Stage progress is estimate-only and never auto-completes.
- [ ] Stage is a capacity bucket with WIP limit + daily hour pool.
- [ ] Hours distribute equally across active jobs in a stage per working day.
- [ ] Queued jobs receive zero hours and are visually distinct.
- [ ] Non-working days accrue zero progress and pause visuals.
- [ ] Locks pin jobs; reflow happens around locks.
- [ ] Gaps exist only due to locks and are always explained.
- [ ] Calendar bars cannot be dragged/resized to change truth.

---

## 12) Terminology (Must Use Consistently)

- **Truth / Actuals:** derived from Kanban card movement history
- **Projection / Forecast:** calendar-generated estimate based on capacity and truth snapshot
- **Stage Transition:** a Kanban move event
- **Active Job:** within stage WIP limit, receiving hours
- **Queued Job:** exceeds WIP limit, receiving zero hours
- **Lock:** pins projected time range for a job, causes reflow and potential allowed gaps

---
