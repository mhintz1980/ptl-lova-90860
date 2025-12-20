# PumpTracker Scheduling & Tracking Constitution (v1.2)

**Status:** Mandatory ruleset  
**Audience:** AI agents planning, implementing, or refactoring PumpTracker scheduling + production tracking  
**Priority:** Rules > UI > Code. If any existing code conflicts with this document, the code is wrong.

---

## 0) Prime Directive

**Kanban is truth. Calendar is projection.**  
Only humans moving cards (or performing an explicit Kanban-equivalent action) can change production reality.

---

## 1) Core Truth vs Projection

### 1.1 Truth (Authoritative)

Truth is:

- A pump’s current `stage`
- Stage-entry/stage-exit times (from Kanban move events)
- Pause/Unpause status **inside a stage** (truth mechanism)
- Vendor assignment (if set)

Truth is NOT:

- Any calendar forecast dates
- Any computed progress %
- Any autoschedule output

### 1.2 Projection (Forecast)

Projection is a **pure** calculation derived from:

- Current truth snapshot (pumps + events + pause states)
- Capacity config + WIP limits
- Ordering rules + manual overrides
- Vendor rules (Powder Coat weekly)
- Forecast hints (allowed)

Projection must:

- Be recomputable at any time
- Never mutate truth
- Be clearly labeled as forecast-only

---

## 2) Canonical Stages (IDs + UI Labels)

All code uses canonical stage **IDs** (underscored). UI uses labels.

### 2.1 Stage sequence (canonical)

1. `QUEUE` — Queue (not started)
2. `FABRICATION` — Fabrication (work stage)
3. `STAGED_FOR_POWDER` — Staged for Powder (buffer/waiting)
4. `POWDER_COAT` — Powder Coat (vendor stage)
5. `ASSEMBLY` — Assembly (work stage)
6. `SHIP` — Ship (Testing + Shipping combined)
7. `CLOSED` — Closed (done)

### 2.2 Legacy stage aliasing (migration + compatibility)

If legacy stages exist in stored data, they map as follows:

- `TESTING` → `SHIP`
- `SHIPPING` → `SHIP`
- `"POWDER COAT"` (space) → `POWDER_COAT`

**Rule:** The app must not keep two naming systems alive. Convert once; enforce canonical everywhere.

---

## 3) Kanban Truth Rules

### 3.1 Stage transitions

- Moving a card between stages creates a `PumpStageMoved` event (immutable).
- The pump’s current stage must always match the most recent stage move.

### 3.2 Locks never block Kanban

Locks are **forecast-only** and must never prevent a user from moving a card on Kanban.

### 3.3 Pause / Unpause is truth (WIP enforcement)

Within **WORK** stages (`FABRICATION`, `ASSEMBLY`, `SHIP`):

- Pumps can be **Active** or **Paused**
- Active pumps receive hours (projection)
- Paused pumps receive **0 hours** (projection)

**Auto-pause rule:**  
If a pump is moved into a stage that is already at capacity (activeCount >= wipLimit), the pump that just entered is automatically set to **Paused** and visibly stamped “PAUSE”.

**Swap rule:**  
Users may pause a different pump in the same stage (dropping activeCount below limit) and then unpause the one they want to progress—until capacity is exceeded again.

**Unpause rule:**  
Unpause is blocked if it would exceed capacity.

---

## 4) Ordering Rules (Projection + Planning)

### 4.1 Default order (QUEUE planning order)

Default projection order is:

1. Customer Tier (higher first)
2. Priority (higher first)
3. Promise Date (earlier first)

### 4.2 Manual override

Users can manually drag to override order (planning order).

- This override influences projection.
- It does not change stage truth.

---

## 5) Stage Modeling (Capacity + Hours + Vendor)

### 5.1 Work stages (FABRICATION / ASSEMBLY / SHIP)

Each work stage has:

- `dailyManHours` (total available man-hours per workday)
- `wipLimit` (max ACTIVE pumps)

**Equal distribution rule:**  
Each workday, for each stage:

- If `N` active pumps are in the stage, each active pump receives `dailyManHours / N`.
- Paused pumps receive `0`.
- Hours accrue day-by-day; no weekly reset.

**Progress bar rule:**  
Calendar segment fill shows **estimated** progress only.  
Reaching “100% estimated” does not complete the stage; only Kanban moves do.

### 5.2 Buffer stage (STAGED_FOR_POWDER)

- No man-hours consumed
- Can accumulate multiple days (realistic waiting time)
- Projection uses it to represent the queue before vendor acceptance (Powder Coat weekly limits)

### 5.3 Vendor stage (POWDER_COAT)

Powder Coat is modeled as:

- Vendor weekly throughput (`maxPumpsPerWeek` per vendor)
- Vendor lead time = **5 working days** (one work week)

If a pump has a `powderCoatVendorId`, it uses that vendor’s throughput.
If no vendor is assigned, use pooled throughput (sum or a configured default).

**UI requirement:**  
While in `POWDER_COAT` (and optionally while `STAGED_FOR_POWDER`), the pump card shows a vendor indicator (icon/text).

---

## 6) Non-Working Time

- Weekends contribute 0 hours (internal work pauses)
- Powder coat lead time is counted in **working days** (Mon–Fri)
- No Friday dump / Monday reset behavior is allowed

---

## 7) Calendar Rules

### 7.1 Calendar view is job-centric timeline (Gantt-like)

- One row per job
- One continuous lifecycle bar segmented by:
  FABRICATION → STAGED_FOR_POWDER → POWDER_COAT → ASSEMBLY → SHIP

### 7.2 Calendar is projection-only

Calendar must not:

- Change stage truth
- Create truth “start/end” dates
- Auto-advance stages

Calendar may allow **forecast hints only**:

- Reorder queue (planning order)
- Set target start dates (hint)
- Lock a job’s projected position (forecast lock)

All forecast hints must be:

- Stored separately from truth fields
- Clearly labeled forecast-only

---

## 8) Agent Compliance Checklist (Hard Fail If Violated)

- I1: Kanban moves create domain events and are the only stage-truth transitions
- I2: Pause/Unpause is enforced against WIP limits
- I3: Calendar never mutates truth fields
- I4: Projection is pure and recomputable
- I5: Canonical stage IDs are enforced everywhere
- I6: STAGED_FOR_POWDER exists and can accumulate waiting time
- I7: SHIP replaces Testing+Shipping in canonical flow
