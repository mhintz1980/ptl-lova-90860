You are Opus-4.5 working in the PumpTracker repo. Your mission is to refactor scheduling + calendar to achieve 100% compliance with “PumpTracker Scheduling & Tracking Constitution (v1.2)”.

Hard decisions already made (do not debate them):

1. Insert a buffer stage between Fabrication and Powder Coat:
   - Canonical stage ID: STAGED_FOR_POWDER
   - UI label: “Staged for Powder”
   - This stage can accumulate multiple days waiting for pickup/vendor acceptance.
2. Locks must NOT block Kanban truth actions.
3. Capacity selection is FIFO at the stage level, BUT:
   - If a pump enters a work stage at capacity, it is auto-paused (“PAUSE” stamp).
   - Users can pause a different pump to free capacity, then unpause the one they want to progress.
4. Queue ordering default:
   - Customer Tier desc, Priority desc, Promise Date asc
   - User can drag-reorder to override (planning order hint).
5. Powder Coat remains vendor weekly:
   - Vendor maxPumpsPerWeek throughput
   - Vendor lead time = 5 working days (1 work week)
   - Later: per-pump vendor assignment; for now show vendor indicator on card when in powder stages.
6. Calendar drag/drop is allowed ONLY for forecast hints (never truth scheduling).
7. Testing + Shipping are merged as a single stage:
   - Canonical stage ID: SHIP
   - UI label: “Ship”
   - Legacy stage values TESTING/SHIPPING must migrate to SHIP.

Repo starting conditions you must validate:

- moveStage() already event-sources PumpStageMoved into localStorage via EventStore.
- Calendar scheduling still mutates pump.scheduledStart/scheduledEnd via schedulePump/clearSchedule and DragAndDropContext.
- Stage naming currently includes “POWDER COAT” (space) and legacy TESTING/SHIPPING.

Non-negotiable architecture:

- Truth = Kanban stage moves + pause/unpause truth actions
- Projection = pure engine that outputs timeline segments
- Calendar = read-only rendering of projection + forecast hints editor

PHASE PLAN (implement in order)

A) Canonical Stage IDs + Migration

- Update src/types.ts Stage union and STAGES arrays to canonical:
  QUEUE, FABRICATION, STAGED_FOR_POWDER, POWDER_COAT, ASSEMBLY, SHIP, CLOSED
- Add label mapping in src/lib/stage-constants.ts (or a single stage meta module).
- Migrate stored data on load:
  - “POWDER COAT” -> POWDER_COAT
  - TESTING/SHIPPING -> SHIP
  - Add STAGED_FOR_POWDER support
- Remove all “as any” casts related to stage mismatch.

B) Truth Layer: Pause/Unpause + Capacity enforcement

- Ensure moveStage() NEVER checks forecast locks.
- After moving into a WORK stage (FABRICATION, ASSEMBLY, SHIP):
  - Compute activeCount in that stage (not paused)
  - If activeCount >= wipLimit, auto-PAUSE the incoming pump (truth):
    isPaused=true, pausedAt=now, pausedStage=stage
- Implement resumePump() enforcement:
  - If resuming would exceed wipLimit for that stage, refuse and surface a clear UI message.
- Consider event-sourcing pause/unpause with PumpPaused/PumpResumed events (recommended for audit symmetry).

C) Data model: Merge Testing+Shipping -> SHIP

- Update Pump.work_hours:
  - Replace testing/shipping with ship (ship = testing + shipping during migration).
- Update CapacityConfig:
  - Replace testing/shipping with ship (ship.dailyManHours = testing.dailyManHours + shipping.dailyManHours in migration).
- Update any UI “department cards” and config editing to SHIP only.

D) Powder Coat weekly model + STAGED_FOR_POWDER buffer

- Add Pump field: powderCoatVendorId?: string (optional).
- Projection rules:
  - STAGED_FOR_POWDER holds pumps until POWDER_COAT can accept them under weekly throughput.
  - POWDER_COAT duration per pump = 5 working days.
- Add vendor indicator (icon/text) on pump cards when in STAGED_FOR_POWDER or POWDER_COAT.

E) Projection Engine (pure)
Create: src/lib/projection-engine.ts

Inputs:

- truth pumps snapshot
- stage movement events (PumpStageMoved) to get stage-entry timestamps
- pause states
- wipLimits
- capacityConfig
- work calendar (Mon–Fri workdays; weekends 0 hours)
- vendor config (maxPumpsPerWeek, lead time 5 workdays)
- forecast hints (queue order override, forecast locks, target start hints)

Outputs:

- per-pump timeline segments:
  FABRICATION -> STAGED_FOR_POWDER -> POWDER_COAT -> ASSEMBLY -> SHIP
- metadata:
  paused markers, queued markers, vendor label, allowed gap markers (if you implement locks)

Core mechanics:

- For each workday:
  - For each WORK stage:
    - Pick active pumps up to wipLimit; paused pumps get 0
    - Split dailyManHours equally across active pumps
    - Decrement remaining hours for that stage per pump
    - When remaining hours reaches 0, pump moves to next stage in PROJECTION (not truth)
- Vendor mechanics:
  - Weekly capacity gates how many pumps can ENTER POWDER_COAT each week per vendor
  - Lead time in POWDER_COAT = 5 workdays
- Respect manual queue ordering overrides and/or default ordering.

F) Calendar UI: projection rendering + forecast hints only

- Remove schedulePump/clearSchedule usage from DragAndDropContext.
- Calendar must render from projection output only.
- Allowed interactions:
  - reorder QUEUE as a forecast hint
  - set target start as hint
  - lock projected position as hint
- No calendar action may modify pump.stage, stage events, or paused truth.

G) Remove/Archive non-compliant code

- schedulePump / clearSchedule / autoSchedule as currently implemented must be removed or quarantined behind a clearly named feature flag (default off).
- scheduledStart/scheduledEnd must not exist as truth. Either delete or rename to forecast-only fields.

H) Tests (must pass)

- Add unit tests for projection-engine:
  - equal distribution across active pumps
  - paused pumps receive 0 hours
  - auto-pause when entering full stage
  - powder coat weekly throughput + 5 workday lead time
  - STAGED_FOR_POWDER accumulating wait time
  - stage migration mapping (“POWDER COAT”, TESTING/SHIPPING)
- Use the provided pump snapshot fixture as deterministic test data:
  - Place it at src/test-fixtures/pump-snapshot.ts (currently uploaded separately)

Deliverables required:

1. Code changes with clear separation: truth vs projection vs UI
2. pnpm test passes
3. Short “Constitution Compliance Report” summarizing what was removed/archived and what is now guaranteed
4. No remaining stage naming inconsistencies
