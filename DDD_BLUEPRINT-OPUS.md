# PumpTracker vNext — DDD Blueprint

> **Version**: OPUS 1.0  
> **Date**: 2025-12-15  
> **Author**: Senior Software Architect (DDD Analysis)  
> **Reviewed**: Using DDD Methodology (planning-architect, documentation-retroner, code-planner, finalization-specialist)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Definition of Success](#definition-of-success)
3. [Assessment Findings](#assessment-findings)
4. [A) Ubiquitous Language Glossary](#a-ubiquitous-language-glossary)
5. [B) Bounded Contexts & Context Map](#b-bounded-contexts--context-map)
6. [C) Domain Models per Context](#c-domain-models-per-context)
7. [D) Use-Case Catalog](#d-use-case-catalog)
8. [E) Architecture Outline](#e-architecture-outline)
9. [F) Verification Plan](#f-verification-plan)
10. [G) Risks & Gotchas + Refactor Priorities](#g-risks--gotchas--refactor-priorities)
11. [Confirmed Decisions](#confirmed-decisions)
12. [Ledger Design for Historical Queries](#ledger-design-for-historical-queries)

---

## Executive Summary

This blueprint presents a Domain-Driven Design (DDD) architecture for PumpTracker vNext. After analyzing the existing codebase, the **PROJECT_REBUILD_PLAN.md** (Next.js + Drizzle direction), and domain artifacts, I recommend a **modular monolith** approach that:

1. **Preserves the core value** of the existing React-based SPA while introducing proper domain boundaries
2. **Enables the "Drill-Down" UX vision** through well-structured aggregates and read models
3. **Supports future database migration** (localStorage → Supabase/PostgreSQL) without disrupting domain logic
4. **Allows gradual extraction** of bounded contexts into companion services if needed

> [!IMPORTANT]
> The existing system has significant **tangled state in `store.ts`** (verified: 545 lines). The primary architectural risk is the lack of separation between domain logic, persistence, and UI state. This blueprint addresses that systematically.

**→ See [Definition of Success](#definition-of-success) for measurable completion criteria.**

---

## Definition of Success

To consider this architecture successfully implemented, the following criteria must be met:

1.  **Zero Regression**: All existing critical user flows (Move Pump, Schedule, Filter) work exactly as before as verified by E2E tests.
2.  **Domain Purity**: The `src/domain` directory contains **zero** imports from `src/store` or `src/components`.
3.  **Test Coverage**: 100% unit test coverage for all new Domain Entities and Value Objects.
4.  **Operational Drill-Down**: The "Drill-Down" UX is functional for at least one major metric (WIP by Model).
5.  **Clean Separation**: `store.ts` is reduced to UI state only (filters, toggles) or strictly acts as a read-through cache, with no business logic.

---

## Assessment Findings

> This section documents findings from the DDD methodology review conducted 2025-12-15.

### Codebase Verification Results

| Claim | Verified | Notes |
|-------|----------|-------|
| `store.ts` ~546 lines | ✅ 545 lines | Accurate |
| No domain folder exists | ✅ Confirmed | `src/domain/` needs to be created |
| Stage enum matches blueprint | ✅ Confirmed | `src/types.ts` L3-11 |
| `org_id` on Milestone | ⚠️ Still present | `src/types.ts` L115 - needs removal per confirmed decisions |

### Documentation Quality (DDD Core Concepts)

| Criterion | Status | Notes |
|-----------|--------|-------|
| Retcon Writing | ✅ Pass | No future tense violations found |
| Context Poisoning | ⚠️ Minor | Stage naming: "POWDER COAT" vs "Powder Coat" inconsistency |
| DRY Enforcement | ⚠️ Minor | Stage sequence repeated 4 times in document |
| Progressive Organization | ✅ Pass | Good structure; TOC added in OPUS version |

### Implementation Plan Assessment

| Criterion | Status | Notes |
|-----------|--------|-------|
| Chunk Sizing | ✅ Pass | 4 phases, appropriately scoped |
| Dependency Sequencing | ✅ Pass | Interfaces → Logic → Integration order correct |
| Risk Coverage | ✅ Pass | 8 risks identified with mitigations |
| Verification Plan | ✅ Pass | Unit + Integration + Manual testing defined |

### Recommendations Applied

1. ✅ Added Table of Contents for navigation
2. ✅ Cross-referenced Executive Summary to Definition of Success
3. ✅ Updated store.ts line count to verified value (545)
4. ✅ Added this Assessment Findings section
5. ✅ Stage naming standardization (canonical reference in glossary, Section A)
6. ✅ Integrated master-agents philosophy alignment (bricks & studs, test pyramid)

> [!NOTE]
> **Stage Canonical Reference**: The authoritative stage sequence is defined in Section A (Ubiquitous Language) under the "Stage" term. All other references defer to that definition.

---

## A) Ubiquitous Language Glossary

| Term                       | Definition                                                                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Pump**                   | The manufactured asset. Each pump has a unique serial number and progresses through production stages.                           |
| **Serial Number**          | A 4-digit unique identifier assigned to each pump at creation.                                                                   |
| **Purchase Order (PO)**    | A customer's order that may contain multiple line items, each specifying a pump model and quantity.                              |
| **Line Item**              | A single entry on a PO specifying model, quantity, color, and promise date. Expands into individual Pump records.                |
| **Customer**               | The external party placing orders (e.g., "United Rentals", "Sunbelt Rentals").                                                   |
| **Pump Model**             | A catalog entry defining the pump type (e.g., "DD-6 SAFE"), its price, BOM (Bill of Materials), lead times, and work hours.      |
| **Stage**                  | A discrete step in the production workflow. Ordered: QUEUE → FABRICATION → POWDER COAT → ASSEMBLY → TESTING → SHIPPING → CLOSED. |
| **Work-In-Progress (WIP)** | Pumps currently in production stages (not QUEUE or CLOSED).                                                                      |
| **Lead Time**              | The expected number of business days to complete a production stage for a given model.                                           |
| **Work Hours**             | The man-hours required per stage per model, used for capacity calculations.                                                      |
| **Capacity**               | The weekly or daily throughput limit for a stage, derived from employee count, work hours, and efficiency.                       |
| **Promise Date**           | The date by which the customer expects delivery; drives priority and late order detection.                                       |
| **Scheduled Start/End**    | The projected start and completion dates calculated from lead times and capacity.                                                |
| **Priority**               | Urgency level: Low, Normal, High, Rush, Urgent. Affects scheduling order.                                                        |
| **Stage Move**             | The action of transitioning a pump from one stage to the next (the core production event).                                       |
| **Auto-Schedule**          | System action that assigns scheduled dates to unscheduled QUEUE pumps based on priority and capacity.                            |
| **Sandbox Mode**           | A simulation mode where changes are not persisted, allowing "what-if" scenario planning.                                         |
| **Milestone**              | A department-level goal with a deadline (part of the Progress Engine).                                                           |
| **MicroTask**              | A small, completable task linked to a milestone.                                                                                 |
| **Powder Coat Vendor**     | An external vendor providing powder coating services, with a weekly pump capacity.                                               |
| **Drill-Down**             | UX pattern where clicking a chart segment reveals the next level of detail within the same dataset.                              |
| **Drill-Through**          | UX pattern where clicking navigates to a different view/report for contextual information.                                       |

> [!IMPORTANT]
> **Stage Sequence (Canonical)**: QUEUE → FABRICATION → POWDER COAT → ASSEMBLY → TESTING → SHIPPING → CLOSED
>
> This is the authoritative reference. Stage transitions must follow this exact order with no skipping.

---

## B) Bounded Contexts & Context Map

### B.1 Identified Bounded Contexts

```mermaid
graph TB
    subgraph "Core Domain"
        PC["Production Control"]
        SM["Sales & Orders"]
    end

    subgraph "Supporting Domain"
        CAP["Capacity Planning"]
        CAT["Product Catalog"]
    end

    subgraph "Generic Domain"
        PROG["Progress Engine"]
        SAND["Sandbox / Simulation"]
        PRES["Presentation / Analytics"]
    end

    SM -->|"Order Placed"| PC
    CAT -->|"Lead Times & Work Hours"| CAP
    CAP -->|"Capacity Constraints"| PC
    PC -->|"WIP Data"| PRES
    SM -->|"Order Value"| PRES
    PC -->|"Mirror State"| SAND
    SAND -->|"Commit"| PC
```

### B.2 Context Definitions

| Context                      | Responsibility                                                                                              | Data Ownership                                             |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Sales & Orders**           | Manages customers, purchase orders, and line items. Creates demand that flows into production.              | `Customer`, `PurchaseOrder`, `LineItem`                    |
| **Production Control**       | The **Core Domain**. Manages pump lifecycle through stages, handles stage transitions, enforces WIP limits. | `Pump`, `StageMove` (event log), `Stage`                   |
| **Product Catalog**          | Master data for pump models including specifications, BOM, lead times, and work hours. Read-mostly.         | `PumpModel`, `BOM`                                         |
| **Capacity Planning**        | Manages department staffing, work schedules, vendor capacity. Calculates available capacity.                | `CapacityConfig`, `DepartmentStaffing`, `PowderCoatVendor` |
| **Progress Engine**          | Gamified goal tracking for shop floor motivation. Milestones and micro-tasks.                               | `Milestone`, `MicroTask`                                   |
| **Sandbox / Simulation**     | Enables "what-if" scenarios by forking state. Generic infrastructure pattern.                               | Snapshot of Production + Orders state                      |
| **Presentation / Analytics** | Read models optimized for dashboards, charts, and drill-down exploration.                                   | Derived views (WIP by Model, Value by Customer, etc.)      |

### B.3 Context Map — Integration Styles

| Upstream           | Downstream         | Integration Style      | Notes                                                                                          |
| ------------------ | ------------------ | ---------------------- | ---------------------------------------------------------------------------------------------- |
| Sales & Orders     | Production Control | **Customer-Supplier**  | When a PO is placed, Production Control receives `OrderPlaced` event and creates Pump records. |
| Product Catalog    | Production Control | **Conformist**         | Production Control uses the catalog's lead times and work hours as-is.                         |
| Product Catalog    | Capacity Planning  | **Conformist**         | Capacity Planning reads work hour estimates from catalog.                                      |
| Capacity Planning  | Production Control | **Customer-Supplier**  | Production Control queries capacity before scheduling.                                         |
| Production Control | Presentation       | **Published Language** | Production Control publishes read-optimized projections for charts.                            |
| Production Control | Sandbox            | **Shared Kernel**      | Sandbox forks the full Production state for simulation.                                        |

### B.4 Monolith vs Microservices Recommendation

> [!TIP] > **Recommendation: Modular Monolith**

**Justification:**

1. **Team Size**: Appears to be a small team. Microservices add operational complexity.
2. **Deployment Simplicity**: Single deployable unit (SPA + optional backend).
3. **Data Locality**: All data currently in localStorage or single Supabase schema.
4. **Transaction Boundaries**: Stage moves, scheduling, and order creation benefit from in-process transactions.

**Future Extraction Candidates** (if scale demands):

- **Product Catalog** → Could become a separate admin tool or headless CMS.
- **Analytics/Reporting** → Could be extracted to a dedicated BI service.

---

## C) Domain Models per Context

### C.1 Production Control (Core Domain)

#### Entities

| Entity | Identity                               | Attributes                                                                                                                          |
| ------ | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `Pump` | `id` (UUID), `serial` (unique 4-digit) | `model`, `stage`, `priority`, `powder_color`, `value`, `scheduledStart`, `scheduledEnd`, `promiseDate`, `last_update`, `work_hours` |

#### Value Objects

| Value Object     | Properties                                                                 | Notes                                |
| ---------------- | -------------------------------------------------------------------------- | ------------------------------------ |
| `Stage`          | enum: QUEUE, FABRICATION, POWDER COAT, ASSEMBLY, TESTING, SHIPPING, CLOSED | Ordered; defines valid transitions.  |
| `Priority`       | enum: Low, Normal, High, Rush, Urgent                                      | Affects scheduling order.            |
| `ScheduleWindow` | `startISO`, `endISO`                                                       | Immutable once calculated.           |
| `StageBlock`     | `stage`, `start`, `end`, `days`, `pump`                                    | Represents a pump's time in a stage. |

#### Aggregates

```
┌─────────────────────────────────────────────────────────────┐
│                    PUMP AGGREGATE                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Pump (Aggregate Root)                                 │  │
│  │  - id, serial, model, stage, priority                  │  │
│  │  - scheduledStart, scheduledEnd, promiseDate           │  │
│  │  - value, powder_color, last_update, work_hours        │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  Invariants:                                                 │
│  1. Stage transitions must follow the ordered sequence.     │
│  2. Serial number is immutable after creation.              │
│  3. Moving a pump updates last_update timestamp.            │
│  4. CLOSED pumps cannot be moved to earlier stages.         │
└─────────────────────────────────────────────────────────────┘
```

#### Domain Events

| Event                 | Trigger                  | Payload                                                 |
| --------------------- | ------------------------ | ------------------------------------------------------- |
| `PumpCreated`         | New pump added (from PO) | `{ pumpId, serial, model, customer, po, stage: QUEUE }` |
| `PumpStageMoved`      | Stage transition         | `{ pumpId, fromStage, toStage, timestamp }`             |
| `PumpScheduled`       | Schedule assigned        | `{ pumpId, scheduledStart, scheduledEnd }`              |
| `PumpScheduleCleared` | Schedule removed         | `{ pumpId }`                                            |
| `PumpUpdated`         | Any attribute change     | `{ pumpId, changes }`                                   |

#### Invariants

1. **Stage Order**: Pumps must progress QUEUE → FABRICATION → POWDER COAT → ASSEMBLY → TESTING → SHIPPING → CLOSED. No skipping.
2. **Unique Serial**: No two pumps may share the same serial number.
3. **WIP Limits**: A stage may have a WIP limit (e.g., FABRICATION max 8). Enforced at UI/policy level, not strictly by aggregate.
4. **Immutable After Close**: Once CLOSED, a pump cannot be re-opened (business rule to confirm).

---

### C.2 Sales & Orders

#### Entities

| Entity          | Identity                           | Attributes                                                           |
| --------------- | ---------------------------------- | -------------------------------------------------------------------- |
| `PurchaseOrder` | `po` (string, e.g., "PO2025-0001") | `customer`, `dateReceived`, `promiseDate`, `lines[]`                 |
| `LineItem`      | composite: `po` + index            | `model`, `quantity`, `color`, `promiseDate`, `valueEach`, `priority` |

> [!NOTE]
> In the current system, PurchaseOrder is **implicit** — it exists as the `po` string on each Pump. For vNext, explicit PO modeling enables:
>
> - PO-level views and drill-down
> - Order status tracking (partially shipped, complete)
> - Customer analytics

#### Aggregates

```
┌─────────────────────────────────────────────────────────────┐
│                PURCHASE ORDER AGGREGATE                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  PurchaseOrder (Aggregate Root)                        │  │
│  │  - po, customer, dateReceived, promiseDate             │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │  LineItem[]                                            │  │
│  │  - model, quantity, color, promiseDate, valueEach      │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  Invariants:                                                 │
│  1. PO number is unique.                                     │
│  2. At least one line item required.                         │
│  3. Total value = sum(line.quantity * line.valueEach).       │
└─────────────────────────────────────────────────────────────┘
```

#### Domain Events

| Event            | Trigger                    | Payload                                  |
| ---------------- | -------------------------- | ---------------------------------------- |
| `OrderPlaced`    | New PO created             | `{ po, customer, lines[], promiseDate }` |
| `OrderFulfilled` | All pumps on PO are CLOSED | `{ po, completionDate }`                 |

---

### C.3 Product Catalog (Supporting)

#### Entities

| Entity      | Identity                            | Attributes                                                |
| ----------- | ----------------------------------- | --------------------------------------------------------- |
| `PumpModel` | `model` (string, e.g., "DD-6 SAFE") | `description`, `price`, `bom`, `lead_times`, `work_hours` |

#### Value Objects

| Value Object      | Properties                                                        |
| ----------------- | ----------------------------------------------------------------- |
| `BillOfMaterials` | `engine`, `gearbox`, `control_panel`                              |
| `LeadTimes`       | `fabrication`, `powder_coat`, `assembly`, `testing`, `total_days` |
| `WorkHours`       | `fabrication`, `assembly`, `testing`, `shipping`                  |

#### Invariants

1. Model code is unique.
2. Lead times must be positive numbers.
3. Price may be null (fallback logic applies).

---

### C.4 Capacity Planning (Supporting)

#### Entities

| Entity             | Identity                                           | Attributes                                                     |
| ------------------ | -------------------------------------------------- | -------------------------------------------------------------- |
| `DepartmentConfig` | `stage` (FABRICATION, ASSEMBLY, TESTING, SHIPPING) | `employeeCount`, `workDayHours`, `efficiency`, `dailyManHours` |
| `PowderCoatVendor` | `id`                                               | `name`, `maxPumpsPerWeek`                                      |

#### Aggregates

```
┌─────────────────────────────────────────────────────────────┐
│              CAPACITY CONFIG AGGREGATE                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  CapacityConfig (Aggregate Root)                       │  │
│  │  - fabrication: DepartmentConfig                       │  │
│  │  - assembly: DepartmentConfig                          │  │
│  │  - testing: DepartmentConfig                           │  │
│  │  - shipping: DepartmentConfig                          │  │
│  │  - powderCoat: { vendors: PowderCoatVendor[] }         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  Reactive Logic:                                             │
│  - employeeCount change → recalculate dailyManHours          │
│  - efficiency change → recalculate dailyManHours             │
│  - dailyManHours direct change → back-calculate efficiency   │
└─────────────────────────────────────────────────────────────┘
```

---

### C.5 Progress Engine (Generic)

#### Entities

| Entity      | Identity    | Attributes                                                          |
| ----------- | ----------- | ------------------------------------------------------------------- |
| `Milestone` | `id` (UUID) | `title`, `department`, `deadline`, `createdAt`                      |
| `MicroTask` | `id` (UUID) | `milestoneId`, `description`, `isComplete`, `completedAt`, `weight` |

> [!TIP]
> **Cleanup Required**: Remove `org_id` from `Milestone` type (`src/types.ts:115`) per confirmed decision on single-organization scope.

#### Invariants

1. MicroTask must belong to an existing Milestone.
2. Deleting a Milestone cascades to its MicroTasks.

---

## D) Use-Case Catalog

### D.1 User Goals → Commands → Events → Read Models

| User Goal                        | Actor             | Command                                   | Events                                        | Read Model Update                                |
| -------------------------------- | ----------------- | ----------------------------------------- | --------------------------------------------- | ------------------------------------------------ |
| **Place a new order**            | Sales User        | `PlaceOrder(po, customer, lines[])`       | `OrderPlaced`, `PumpCreated` (×N)             | Orders list, Backlog count, WIP totals           |
| **Move pump to next stage**      | Shop Floor Worker | `MovePumpStage(pumpId, toStage)`          | `PumpStageMoved`                              | Kanban columns, Stage WIP counts, Timeline       |
| **Schedule a pump**              | Scheduler         | `SchedulePump(pumpId, startDate)`         | `PumpScheduled`                               | Calendar grid, Backlog dock                      |
| **Auto-schedule backlog**        | Scheduler         | `AutoSchedule()`                          | `PumpScheduled` (×N)                          | Calendar grid, Backlog cleared                   |
| **Clear pump schedule**          | Scheduler         | `ClearSchedule(pumpId)`                   | `PumpScheduleCleared`                         | Pump returns to backlog                          |
| **Update pump details**          | Admin             | `UpdatePump(pumpId, patch)`               | `PumpUpdated`                                 | Pump detail modal, Kanban card                   |
| **Drill down on WIP by Model**   | Analyst           | (Read operation)                          | —                                             | Show pumps filtered by model, then by customer   |
| **Drill down on Value by Model** | Analyst           | (Read operation)                          | —                                             | Show orders/customers contributing to that value |
| **Enter sandbox mode**           | Planner           | `EnterSandbox()`                          | —                                             | UI displays sandbox indicator                    |
| **Commit sandbox changes**       | Planner           | `CommitSandbox()`                         | Writes to real store                          | Sandbox dismissed, changes persisted             |
| **Discard sandbox**              | Planner           | `ExitSandbox()`                           | —                                             | State reverts to pre-sandbox snapshot            |
| **Adjust department staffing**   | Admin             | `UpdateDepartmentStaffing(stage, config)` | —                                             | Capacity recalculated                            |
| **Create milestone**             | Manager           | `AddMilestone(milestone)`                 | `MilestoneCreated`                            | Kiosk progress widget                            |
| **Toggle micro-task**            | Worker            | `ToggleMicroTask(taskId)`                 | `MicroTaskCompleted` / `MicroTaskUncompleted` | Progress bar update                              |

### D.2 Read Models for Dashboard Drill-Down

| Read Model               | Source Aggregates                                   | Purpose                                |
| ------------------------ | --------------------------------------------------- | -------------------------------------- |
| `WipByStage`             | Pump (grouped by stage)                             | Bar/donut chart of WIP counts          |
| `WipByModel`             | Pump (grouped by model)                             | Donut chart; first level of drill-down |
| `WipByModelByCustomer`   | Pump (grouped by model, then customer)              | Second level of drill-down             |
| `WipByModelByPO`         | Pump (grouped by model, then PO)                    | Alternate second level                 |
| `ValueByModel`           | Pump (sum value grouped by model)                   | Treemap; first level                   |
| `ValueByModelByCustomer` | Pump (sum value by model, then customer)            | Second level of drill-down             |
| `LateOrders`             | Pump (where promiseDate < today && stage != CLOSED) | Late order tracking                    |
| `CapacityByDept`         | CapacityConfig + Pump (WIP counts)                  | Utilization chart                      |
| `ScheduledTimeline`      | Pump (with scheduledStart) + buildStageTimeline     | Calendar grid                          |

---

## E) Architecture Outline

### E.1 Module Structure (Modular Monolith)

```
src/
├── domain/
│   ├── production/           # Core: Pump aggregate, stage logic
│   │   ├── entities/
│   │   │   └── Pump.ts
│   │   ├── value-objects/
│   │   │   ├── Stage.ts
│   │   │   ├── Priority.ts
│   │   │   └── ScheduleWindow.ts
│   │   ├── events/
│   │   │   ├── PumpCreated.ts
│   │   │   ├── PumpStageMoved.ts
│   │   │   └── PumpScheduled.ts
│   │   ├── services/
│   │   │   ├── SchedulingService.ts
│   │   │   └── StageTransitionService.ts
│   │   └── repository.ts     # Interface
│   │
│   ├── sales/                # Sales & Orders context
│   │   ├── entities/
│   │   │   └── PurchaseOrder.ts
│   │   ├── events/
│   │   │   └── OrderPlaced.ts
│   │   └── repository.ts
│   │
│   ├── catalog/              # Product Catalog context
│   │   ├── entities/
│   │   │   └── PumpModel.ts
│   │   └── repository.ts     # Read-only
│   │
│   └── capacity/             # Capacity Planning context
│       ├── entities/
│       │   └── CapacityConfig.ts
│       └── services/
│           └── CapacityCalculator.ts
│
├── application/              # Use cases / application services
│   ├── commands/
│   │   ├── PlaceOrderCommand.ts
│   │   ├── MovePumpStageCommand.ts
│   │   ├── SchedulePumpCommand.ts
│   │   └── AutoScheduleCommand.ts
│   ├── queries/
│   │   ├── GetWipByModelQuery.ts
│   │   ├── GetValueByModelQuery.ts
│   │   └── GetScheduledPumpsQuery.ts
│   └── handlers/
│       └── CommandHandlers.ts
│
├── infrastructure/
│   ├── persistence/
│   │   ├── adapters/
│   │   │   ├── LocalStorageAdapter.ts
│   │   │   ├── SupabaseAdapter.ts
│   │   │   └── DrizzleAdapter.ts    # Future
│   │   ├── repositories/
│   │   │   ├── PumpRepository.ts
│   │   │   └── OrderRepository.ts
│   │   └── migrations/
│   ├── eventBus/                   # Simple in-process event bus
│   │   └── EventBus.ts
│   └── sandboxing/
│       └── SandboxManager.ts
│
├── presentation/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── charts/              # Chart components
│   │   │   ├── DrillDownContainer.tsx
│   │   │   └── TopicNavigator.tsx
│   │   ├── kanban/
│   │   ├── scheduling/
│   │   ├── kiosk/
│   │   └── ui/
│   ├── hooks/
│   │   ├── usePumps.ts
│   │   ├── useWipData.ts
│   │   └── useDrillDown.ts
│   └── pages/
│
├── config/
│   └── index.ts
│
└── store/                    # Thin Zustand layer (UI state only)
    └── uiStore.ts            # Filters, collapsed states, UI toggles
```

### E.2 Module Boundaries & Dependencies

```mermaid
graph TD
    subgraph Presentation
        UI[React Components]
        Hooks[Hooks]
    end

    subgraph Application
        Cmd[Commands]
        Qry[Queries]
        Hdlr[Handlers]
    end

    subgraph Domain
        Prod[Production]
        Sales[Sales]
        Cat[Catalog]
        Cap[Capacity]
    end

    subgraph Infrastructure
        Repo[Repositories]
        Adapt[Adapters]
        EvBus[Event Bus]
    end

    UI --> Hooks
    Hooks --> Cmd
    Hooks --> Qry
    Cmd --> Hdlr
    Qry --> Repo
    Hdlr --> Prod
    Hdlr --> Sales
    Prod --> Cap
    Prod --> Cat
    Repo --> Adapt
    Hdlr --> EvBus
```

**Dependency Rules:**

- `domain/*` has **no imports** from `infrastructure/*` or `presentation/*`
- `application/*` imports from `domain/*`
- `infrastructure/*` imports from `domain/*` (implements interfaces)
- `presentation/*` imports from `application/*` (via hooks)

### E.3 API Boundaries

For the **modular monolith**, APIs are in-process function calls via hooks and application services. If migrating to Next.js App Router with server components:

| Surface                     | API Style                              | Notes                                  |
| --------------------------- | -------------------------------------- | -------------------------------------- |
| Queries (Dashboard, Kanban) | React Server Components + `use server` | Fetch data on server, render HTML      |
| Commands (Move, Schedule)   | Server Actions                         | POST-like mutations with optimistic UI |
| Real-time (Kiosk)           | Supabase Realtime or polling           | For multi-user sync                    |

### E.4 Data Boundaries

| Context    | Local Ownership                 | Integration Data                               |
| ---------- | ------------------------------- | ---------------------------------------------- |
| Production | `pumps` table/collection        | Reads from `catalog.models`, `capacity.config` |
| Sales      | `purchase_orders`, `line_items` | Writes to Production via events                |
| Catalog    | `pump_models`                   | Read-only from Production/Capacity             |
| Capacity   | `capacity_config`               | Read by Production during scheduling           |
| Progress   | `milestones`, `micro_tasks`     | Independent; linked by `org_id`                |

### E.5 Integration Patterns

1. **Event-Driven (In-Process)**:

   - `OrderPlaced` → Production Control creates Pump records
   - `PumpStageMoved` → Analytics updates read models
   - Future: Event sourcing for audit trail (the "Ledger" concept from PROJECT_REBUILD_PLAN)

2. **Query-Based (Read Models)**:

   - Dashboard queries optimized views (WipByModel, ValueByCustomer)
   - Read models can be materialized views or computed on-demand

3. **Sandbox as State Fork**:
   - Snapshot current state → operate in memory → commit or discard
   - Persistence adapter checks `isSandbox` flag before writing

### E.6 Implementation Plan

This plan breaks down the migration into atomic, verifiable phases.

#### Phase 1: Domain Core Extraction
**Goal**: Establish the domain layer without breaking the app.

*   `[NEW] src/domain/production/value-objects/Stage.ts`
*   `[NEW] src/domain/production/value-objects/Priority.ts`
*   `[NEW] src/domain/production/entities/Pump.ts` (Pure logic, no store deps)
*   `[NEW] src/domain/sales/entities/PurchaseOrder.ts`
*   `[NEW] src/domain/shared/Entity.ts` (Base class)

#### Phase 2: Application Layer & Services
**Goal**: Connect Domain logic to Application flow.

*   `[NEW] src/domain/production/services/SchedulingService.ts`
*   `[NEW] src/application/commands/MovePumpCommand.ts`
*   `[NEW] src/application/commands/SchedulePumpCommand.ts`
*   `[NEW] src/infrastructure/eventBus/EventBus.ts`
*   `[NEW] src/domain/production/events/PumpStageMoved.ts`

#### Phase 3: Infrastructure & Persistence
**Goal**: Implement repositories that unify Supabase + LocalStorage.

*   `[NEW] src/domain/production/repository.ts` (Interface)
*   `[NEW] src/infrastructure/persistence/repositories/PumpRepository.ts`
*   `[NEW] src/infrastructure/persistence/adapters/SupabaseAdapter.ts`
*   `[MODIFY] src/store.ts` (Remove logic, delegate to Repositories/Commands)

#### Phase 4: Verification & UI Integration
**Goal**: Wire new Architecture to UI Components.

*   `[MODIFY] src/components/kanban/KanbanBoard.tsx` (Use new hooks)
*   `[MODIFY] src/components/scheduling/SchedulingView.tsx` (Use SchedulingService)
*   `[NEW] src/components/dashboard/DrillDownContainer.tsx`

---

## F) Verification Plan

### F.1 Unit Testing Strategy
*   **Framework**: Vitest
*   **Scope**: All Domain Entities, Value Objects, and Domain Services.
*   **Key Invariants to Test**:
    *   `Pump.ts`: Cannot move from CLOSED to FABRICATION.
    *   `Pump.ts`: Cannot skip stages (e.g. FABRICATION -> TESTING).
    *   `Naming`: Serial numbers match regex pattern.

### F.2 Integration Testing Strategy
*   **Framework**: Vitest (Service Layer)
*   **Scope**: Command Handlers and Repositories.
*   **Scenarios**:
    *   "Execute MovePumpCommand -> Persistence Updated -> Event Emitted -> Read Model Updated"
    *   "Execute AutoSchedule -> All Pumps have valid dates -> Capacity respected"

### F.3 Manual Verification Strategy
1.  **Smoke Test**: Load Dashboard, ensure no white screen.
2.  **Legacy Flow**: Drag card in Kanban. Reload page. Position persisted?
3.  **Drill Down**: Click "WIP by Model" chart slice. Does list filter?

---

## G) Risks & Gotchas + Refactor Priorities

### F.1 Identified Risks in Existing System

| Risk                          | Severity  | Evidence                                                                   | Mitigation                                                                   |
| ----------------------------- | --------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Monolithic Store**          | 🔴 High   | `store.ts` is 545 lines with mixed domain logic, persistence, and UI state | Extract domain logic into `domain/` modules; keep store thin                 |
| **Implicit PO Model**         | 🟡 Medium | PO exists only as a string on Pump; no aggregate                           | Explicit `PurchaseOrder` entity enables PO-level analytics and drill-through |
| **No Event History**          | 🟡 Medium | Stage moves update in place; no audit trail                                | Introduce `PumpStageMoved` events; optionally store in ledger table          |
| **Sandbox Persistence Risk**  | 🟡 Medium | Relies on `isSandbox` flag check in adapter                                | Formalize via `SandboxManager` with explicit lock                            |
| **Capacity Logic in Store**   | 🟡 Medium | `autoSchedule` embeds complex capacity logic                               | Extract to `SchedulingService` in domain                                     |
| **Data Migration**            | 🟡 Medium | Existing `localStorage` JSON shape differs from new Entity Models          | Create a `MigrationAdapter` to map legacy JSON to new Domain Entities on load|
| **Lead Time Lookup Coupling** | 🟠 Low    | `getModelLeadTimes` pulls from seed data directly                          | Inject Catalog repository; separate concerns                                 |
| **UI State Persistence**      | 🟠 Low    | Filters, collapsed states persisted in Zustand                             | Fine for now; could separate if becomes complex                              |

### F.2 Refactor Priorities (Ordered)

1. **Domain Layer Extraction**

   - Create `domain/production/entities/Pump.ts` with stage transition methods
   - Create `domain/production/services/SchedulingService.ts`
   - Define repository interface `IPumpRepository`

2. **Explicit PurchaseOrder Aggregate**

   - Model PO with line items
   - Enable PO-level queries for drill-down

3. **Event Infrastructure**

   - Add `EventBus` for domain events
   - Emit events on stage moves, scheduling actions
   - Foundation for future Ledger/audit log

4. **Read Model Services**

   - `WipQueryService` for WIP by stage/model/customer
   - `ValueQueryService` for value analytics
   - Decouples presentation from domain aggregates

5. **Drill-Down UX Components**
   - `DrillDownContainer` managing navigation state

````
   - Breadcrumb component
   - Topic Navigator with pin-to-favorites

---

## Confirmed Decisions

| Question | Decision | Impact |
|----------|----------|--------|
| **Stage Transitions** | No skipping. Pumps must follow the full sequence: QUEUE → FABRICATION → POWDER COAT → ASSEMBLY → TESTING → SHIPPING → CLOSED | Enforced as invariant in Pump aggregate |
| **Closed Pumps** | CLOSED is terminal. Cannot be re-opened. | Enforced as invariant |
| **Multi-Tenancy** | Single organization only. Remove `org_id` from Milestone (unnecessary clutter). | Simplifies all entity models |
| **Tech Stack** | Stay with **React SPA + Supabase**. Only migrate to Next.js if it solves problems that React cannot. | Modular monolith on current stack |
| **Historical Ledger** | **Required**. Need full audit trail for LLM-assisted queries. | Implement `stage_moves` table |

---

## Ledger Design for Historical Queries

At ~300 pumps/year with ~5-6 stage moves per pump, the ledger will grow by ~1,500-2,000 rows/year — trivially queryable for decades.

### `stage_moves` Table Schema

```sql
CREATE TABLE stage_moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pump_id UUID NOT NULL REFERENCES pumps(id),
  from_stage TEXT,                    -- NULL for initial creation
  to_stage TEXT NOT NULL,
  moved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  moved_by TEXT,                      -- Optional: user who made the move

  -- Denormalized for query efficiency (avoids JOINs)
  pump_serial INTEGER NOT NULL,
  pump_model TEXT NOT NULL,
  customer TEXT NOT NULL,
  po TEXT NOT NULL,
  powder_coat_vendor TEXT             -- Populated when to_stage = 'POWDER COAT'
);

CREATE INDEX idx_stage_moves_pump ON stage_moves(pump_id);
CREATE INDEX idx_stage_moves_stage ON stage_moves(to_stage);
CREATE INDEX idx_stage_moves_date ON stage_moves(moved_at);
CREATE INDEX idx_stage_moves_customer ON stage_moves(customer);
CREATE INDEX idx_stage_moves_model ON stage_moves(pump_model);
````

### Example Queries (LLM-Friendly)

| Question                                                      | SQL                                                                                                                                                                                                                        |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "How many DD6-SAFE did we ship to United Rentals in Q1 2025?" | `SELECT COUNT(DISTINCT pump_id) FROM stage_moves WHERE pump_model = 'DD6-SAFE' AND customer = 'United Rentals' AND to_stage = 'SHIPPING' AND moved_at BETWEEN '2025-01-01' AND '2025-03-31'`                               |
| "Which powder coat vendor did the least work this year?"      | `SELECT powder_coat_vendor, COUNT(*) FROM stage_moves WHERE to_stage = 'POWDER COAT' AND moved_at >= '2025-01-01' GROUP BY powder_coat_vendor ORDER BY count ASC LIMIT 1`                                                  |
| "When did serial #12345 pass through testing?"                | `SELECT moved_at FROM stage_moves WHERE pump_serial = 12345 AND to_stage = 'TESTING'`                                                                                                                                      |
| "Which model did Customer B purchase most last year?"         | `SELECT pump_model, COUNT(DISTINCT pump_id) as cnt FROM stage_moves WHERE customer = 'Customer B' AND from_stage IS NULL AND moved_at BETWEEN '2024-01-01' AND '2024-12-31' GROUP BY pump_model ORDER BY cnt DESC LIMIT 1` |

### Domain Event → Ledger Entry

Every `PumpStageMoved` event writes to the ledger:

```typescript
// When moveStage(pumpId, toStage) is called:
async function recordStageMove(
  pump: Pump,
  fromStage: Stage | null,
  toStage: Stage
) {
  await supabase.from("stage_moves").insert({
    pump_id: pump.id,
    from_stage: fromStage,
    to_stage: toStage,
    pump_serial: pump.serial,
    pump_model: pump.model,
    customer: pump.customer,
    po: pump.po,
    powder_coat_vendor:
      toStage === "POWDER COAT" ? getAssignedVendor(pump) : null,
  });
}
```

> [!TIP] > **Denormalization is intentional.** At this scale, storage is cheap and query simplicity is paramount. Denormalizing `pump_serial`, `pump_model`, `customer`, and `po` into each row means most queries can be answered from the ledger alone without JOINs.

---

## Appendix: Diagram of Drill-Down Data Flow

```mermaid
graph LR
    subgraph Level 1
        A[WIP Donut by Model]
    end

    subgraph Level 2
        B[Pumps for DD6-SAFE]
        C[By Customer]
        D[By PO]
    end

    subgraph Level 3
        E[Individual Pump Detail]
    end

    A -->|"Click DD6-SAFE slice"| B
    B --> C
    B --> D
    C -->|"Click customer"| E
    D -->|"Click PO"| E
```

---

## H) Detailed Implementation Plan

> This section provides a granular, agent-aligned implementation roadmap following the **master-agents** philosophy (bricks & studs, vertical slices, test pyramid).

### H.1 Philosophy Alignment

| Principle | Application |
|-----------|-------------|
| **Bricks & Studs** (modular-builder) | Each module is self-contained with clear public interface (`__all__`) |
| **Ruthless Simplicity** (zen-architect) | Start minimal, no future-proofing, question every abstraction |
| **Test Pyramid** (test-coverage) | 60% unit, 30% integration, 10% e2e |
| **Vertical Slices** | Complete flows before expanding; get data flowing early |
| **Regeneratable** | Modules can be rebuilt from spec without breaking connections |

### H.2 Implementation Chunks

Each chunk follows the `code-planner` methodology: <500 lines, independently testable, clear dependencies.

---

#### Chunk 1: Domain Value Objects (~80 lines)

**Purpose**: Foundation types that all other modules depend on.

**Files**:
- `[NEW] src/domain/shared/Entity.ts` - Base class with id and equality
- `[NEW] src/domain/production/value-objects/Stage.ts` - Stage enum with ordering
- `[NEW] src/domain/production/value-objects/Priority.ts` - Priority enum

**Contract**:
```typescript
// Stage.ts - Public Interface
export const STAGES = ['QUEUE', 'FABRICATION', 'POWDER_COAT', ...] as const;
export type Stage = typeof STAGES[number];
export function getNextStage(current: Stage): Stage | null;
export function canTransition(from: Stage, to: Stage): boolean;
```

**Dependencies**: None (leaf module)

**Test Requirements**:
- `canTransition('QUEUE', 'FABRICATION')` → true
- `canTransition('QUEUE', 'TESTING')` → false (no skip)
- `canTransition('CLOSED', 'QUEUE')` → false (terminal)

**Verification**: All unit tests pass

---

#### Chunk 2: Pump Entity (~150 lines)

**Purpose**: Core domain entity with business logic.

**Files**:
- `[NEW] src/domain/production/entities/Pump.ts`
- `[NEW] src/domain/production/entities/Pump.test.ts`

**Contract**:
```typescript
// Pump.ts - Public Interface
export class Pump {
  readonly id: string;
  readonly serial: number;
  moveToStage(stage: Stage): Result<PumpStageMoved | InvalidTransition>;
  schedule(start: Date, end: Date): void;
  clearSchedule(): void;
}
```

**Dependencies**: Chunk 1 (Stage, Priority)

**Invariants Enforced**:
1. Stage transitions follow sequence
2. CLOSED pumps cannot transition
3. Serial is immutable

**Test Requirements**:
- Create pump → stage is QUEUE
- Move QUEUE → FABRICATION → success
- Move QUEUE → TESTING → InvalidTransition error
- Move CLOSED → any → InvalidTransition error

**Verification**: 100% unit test coverage on Pump entity

---

#### Chunk 3: Domain Events (~60 lines)

**Purpose**: Event definitions for domain operations.

**Files**:
- `[NEW] src/domain/production/events/PumpCreated.ts`
- `[NEW] src/domain/production/events/PumpStageMoved.ts`
- `[NEW] src/domain/production/events/PumpScheduled.ts`
- `[NEW] src/domain/production/events/index.ts`

**Contract**:
```typescript
export interface DomainEvent {
  readonly eventType: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
}

export interface PumpStageMoved extends DomainEvent {
  readonly eventType: 'PumpStageMoved';
  readonly fromStage: Stage | null;
  readonly toStage: Stage;
}
```

**Dependencies**: Chunk 1 (Stage)

**Test Requirements**: Types compile, events serialize to JSON

**Verification**: TypeScript compiles, basic serialization test

---

#### Chunk 4: PurchaseOrder Aggregate (~120 lines)

**Purpose**: Explicit PO modeling for drill-down analytics.

**Files**:
- `[NEW] src/domain/sales/entities/PurchaseOrder.ts`
- `[NEW] src/domain/sales/entities/LineItem.ts`
- `[NEW] src/domain/sales/events/OrderPlaced.ts`
- `[NEW] src/domain/sales/entities/PurchaseOrder.test.ts`

**Contract**:
```typescript
export class PurchaseOrder {
  readonly po: string;
  readonly customer: string;
  readonly lines: LineItem[];
  totalValue(): number;
  expandToPumps(): Pump[];
}
```

**Dependencies**: Chunks 1-3 (Pump, Events)

**Invariants Enforced**:
1. PO number unique
2. At least one line item
3. Total value = sum(quantity × valueEach)

**Test Requirements**:
- Create PO with 3 lines → `expandToPumps()` returns 3 pumps
- Empty lines → throws error

**Verification**: Unit tests pass

---

#### Chunk 5: Repository Interfaces & Event Bus (~100 lines)

**Purpose**: Infrastructure contracts (interfaces only, no implementation).

**Files**:
- `[NEW] src/domain/production/repository.ts` - IPumpRepository interface
- `[NEW] src/domain/sales/repository.ts` - IOrderRepository interface
- `[NEW] src/infrastructure/eventBus/EventBus.ts` - Simple pub/sub

**Contract**:
```typescript
// repository.ts
export interface IPumpRepository {
  findById(id: string): Promise<Pump | null>;
  findByStage(stage: Stage): Promise<Pump[]>;
  save(pump: Pump): Promise<void>;
}

// EventBus.ts
export class EventBus {
  publish(event: DomainEvent): void;
  subscribe<T extends DomainEvent>(type: string, handler: (e: T) => void): void;
}
```

**Dependencies**: Chunks 1-3

**Test Requirements**:
- EventBus publishes → subscribers receive
- Multiple subscribers receive same event

**Verification**: Integration test for EventBus

---

#### Chunk 6: Application Command Handlers (~200 lines)

**Purpose**: Use case orchestration layer.

**Files**:
- `[NEW] src/application/commands/MovePumpStageCommand.ts`
- `[NEW] src/application/commands/SchedulePumpCommand.ts`
- `[NEW] src/application/commands/PlaceOrderCommand.ts`
- `[NEW] src/application/handlers/CommandHandlers.ts`
- `[NEW] src/application/handlers/CommandHandlers.test.ts`

**Contract**:
```typescript
export interface MovePumpStageCommand {
  pumpId: string;
  toStage: Stage;
}

export class MovePumpStageHandler {
  constructor(repo: IPumpRepository, eventBus: EventBus);
  execute(cmd: MovePumpStageCommand): Promise<Result<void>>;
}
```

**Dependencies**: Chunks 1-5

**Test Requirements** (with mock repo):
- Execute MovePump → Pump.moveToStage called → Event published → Repo saved
- Invalid transition → returns error, no save

**Verification**: Integration tests with mocked dependencies

---

#### Chunk 7: Repository Implementations (~250 lines)

**Purpose**: Concrete persistence adapters.

**Files**:
- `[NEW] src/infrastructure/persistence/repositories/PumpRepository.ts`
- `[NEW] src/infrastructure/persistence/adapters/LocalStorageAdapter.ts`
- `[MODIFY] src/infrastructure/persistence/adapters/SupabaseAdapter.ts` (if exists)
- `[NEW] src/infrastructure/persistence/MigrationAdapter.ts` - Legacy data mapping

**Contract**:
```typescript
export class PumpRepository implements IPumpRepository {
  constructor(adapter: DataAdapter);
  // Implements all interface methods
}
```

**Dependencies**: Chunks 5-6, existing adapters

**Migration Logic**:
- Map legacy `store.ts` JSON shape to new Pump entity
- Handle "POWDER COAT" → "POWDER_COAT" normalization

**Test Requirements**:
- Save and retrieve pump → data intact
- Migration adapter converts legacy format

**Verification**: Integration tests with localStorage

---

#### Chunk 8: Store Refactor & UI Integration (~300 lines)

**Purpose**: Wire new architecture to existing UI.

**Files**:
- `[MODIFY] src/store.ts` - Remove business logic, delegate to services
- `[NEW] src/store/uiStore.ts` - UI-only state (filters, collapsed)
- `[MODIFY] src/components/kanban/PumpCard.tsx` - Use new hooks
- `[NEW] src/presentation/hooks/usePumpCommands.ts`

**Contract**:
```typescript
// usePumpCommands.ts
export function usePumpCommands() {
  return {
    movePump: (id: string, stage: Stage) => Promise<void>,
    schedulePump: (id: string, date: string) => Promise<void>,
  };
}
```

**Dependencies**: Chunks 6-7

**Migration Strategy**:
1. Create new hooks that delegate to command handlers
2. Update components one at a time (Kanban first)
3. Keep old store functions as fallbacks during transition
4. Remove fallbacks once all components migrated

**Test Requirements** (E2E):
- Drag pump on Kanban → stage updates → page reload → persisted
- Schedule pump → calendar shows event

**Verification**: E2E tests pass, manual smoke test

---

### H.3 Implementation Sequence

```mermaid
gantt
    title Implementation Phases
    dateFormat  X
    axisFormat %s

    section Phase 1: Domain Core
    Chunk 1: Value Objects    :c1, 0, 1
    Chunk 2: Pump Entity      :c2, after c1, 1
    Chunk 3: Domain Events    :c3, after c1, 1

    section Phase 2: Aggregates
    Chunk 4: PurchaseOrder    :c4, after c2, 1

    section Phase 3: Infrastructure
    Chunk 5: Interfaces/Bus   :c5, after c3, 1
    Chunk 6: Command Handlers :c6, after c5, 1
    Chunk 7: Repositories     :c7, after c6, 1

    section Phase 4: Integration
    Chunk 8: Store & UI       :c8, after c7, 2
```

### H.4 Dependency Graph

```
Chunk 1 (Value Objects)
    ↓
Chunk 2 (Pump) ← Chunk 3 (Events)
    ↓
Chunk 4 (PurchaseOrder)
    ↓
Chunk 5 (Interfaces)
    ↓
Chunk 6 (Handlers)
    ↓
Chunk 7 (Repositories)
    ↓
Chunk 8 (UI Integration)
```

### H.5 Verification Gates

| After Chunk | Gate | Pass Criteria |
|-------------|------|---------------|
| 2 | Unit Tests | 100% coverage on Pump entity |
| 5 | Interface Compile | TypeScript builds with no errors |
| 6 | Command Tests | All handler tests pass with mocks |
| 7 | Integration Tests | Repository round-trips work |
| 8 | E2E Tests | Existing Playwright tests pass |

### H.6 Rollback Strategy

Each chunk is independently reversible:

1. **Git branches**: Each chunk on separate feature branch
2. **Feature flags**: New code paths gated by `USE_NEW_DOMAIN=true`
3. **Fallback**: Old `store.ts` functions remain until migration complete
4. **Data compatibility**: New entities serialize to same localStorage format

### H.7 Estimated Effort

| Chunk | Lines | Complexity | Est. Hours |
|-------|-------|------------|------------|
| 1 | ~80 | Low | 1 |
| 2 | ~150 | Medium | 2 |
| 3 | ~60 | Low | 1 |
| 4 | ~120 | Medium | 2 |
| 5 | ~100 | Medium | 2 |
| 6 | ~200 | High | 3 |
| 7 | ~250 | High | 4 |
| 8 | ~300 | High | 5 |
| **Total** | **~1260** | | **~20 hours** |

> [!NOTE]
> Estimates assume familiarity with codebase. First-time contributors add 50%.

### H.8 Agent Delegation Map

Following `zen-architect` delegation patterns:

| Task | Primary Agent | Support Agents |
|------|---------------|----------------|
| Chunk specs finalization | zen-architect | - |
| Domain entity implementation | modular-builder | - |
| Test coverage analysis | test-coverage | - |
| Bug investigation | bug-hunter | explorer |
| Security review | security-guardian | - |
| Integration testing | integration-specialist | test-coverage |
| Final cleanup | post-task-cleanup | - |

### H.9 Pre-Implementation Checklist

Before starting Chunk 1:

- [ ] Create `src/domain/` directory structure
- [ ] Remove `org_id` from Milestone type (`src/types.ts:115`)
- [ ] Ensure Vitest configured with coverage reporting
- [ ] Create feature branch `feat/ddd-domain-layer`
- [ ] Review existing tests in `tests/` for patterns to follow

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-14 | Architect | Initial blueprint |
| OPUS 1.0 | 2025-12-15 | Antigravity | Added TOC, Assessment Findings, verified codebase claims, integrated master-agents philosophy, added Detailed Implementation Plan (Section H) |
