# PumpTracker Lite - Production Intelligence Suite Architecture

## Introduction

This document outlines the architectural design for the **Production Intelligence Suite** enhancement. This suite transforms PumpTracker Lite from a passive tracking tool into an active production driver through three key modules: **Reporting Engine**, **Production Sandbox**, and **Shop Floor HUD**.

**Relationship to Existing Architecture:**
This enhancement builds directly upon the existing **Client-Centric SPA** architecture. It introduces a sophisticated "State Forking" pattern to the `Zustand` store to handle simulation without risking data integrity, and extends the `LocalAdapter` schema to support micro-tasking. It respects the "Local-First" constraint, requiring no new backend services.

### Change Log

| Date | Version | Description | Author |
| :--- | :--- | :--- | :--- |
| Current | 2.0 | Architecture for Production Intelligence Suite | Winston (Arch) |

---

## Existing Project Analysis

**Validated Current State:**
* **Core:** React 19 + Vite + TypeScript.
* **State:** `Zustand` global store with `pumps`, `purchaseOrders` arrays.
* **Persistence:** `LocalAdapter` writing to `localStorage` (key: `pt:v2:data`).
* **UI:** ShadCN/ui + Tailwind.
* **Routing:** React Router (`/dashboard`, `/kanban`).

**Constraints Identified:**
* **Single Thread:** Heavy calculations for the Sandbox (recalculating capacity for 500+ items on drag) must be optimized to avoid blocking the main thread, though `Zustand` selectors usually handle this well.
* **Persistence Risk:** The Sandbox must *never* auto-save to `localStorage`. The write-loop must be explicitly paused during simulation.

---

## Enhancement Scope and Integration Strategy

### Enhancement Overview
* **Reporting Engine:** New independent routes (`/print/*`) using CSS `@media print` optimizations.
* **Production Sandbox:** A "Multiverse" state pattern allowing temporary branching of the dataset.
* **Shop Floor HUD:** A Kiosk-mode route (`/kiosk/*`) with auto-rotating slides and a new "Progress Engine" data model.

### Integration Approach
* **Code Integration:** New `pages/print` and `pages/kiosk` directories. Shared components (charts, tables) will be reused but wrapped in print-specific containers.
* **Database Integration:** Extension of the `localStorage` schema to include `milestones` and `microTasks`.
* **Routing:** New layouts (`PrintShell`, `KioskShell`) that strip away the standard `AppShell` navigation.

---

## Data Models and Schema Changes

We need to extend the schema to support the **Progress Engine** (FR3).

### New Data Models

**1. Milestone (Long-term Goal)**
* **Purpose:** Represents a high-level department goal (e.g., "Quarterly Inventory").
* **Attributes:**
    * `id`: UUID
    * `title`: string
    * `department`: Stage (Enum)
    * `deadline`: ISO Date
    * `createdAt`: ISO Date
    * `org_id`: UUID

**2. MicroTask (Atomic Action)**
* **Purpose:** Small, tickable tasks linked to a milestone.
* **Attributes:**
    * `id`: UUID
    * `milestoneId`: UUID (FK)
    * `description`: string
    * `isComplete`: boolean
    * `completedAt`: ISO Date (nullable)
    * `weight`: number (default 1, for progress calc)

### Schema Integration Strategy
* **LocalStorage:** Add `milestones: []` and `microTasks: []` arrays to the `pt:v2:data` object.
* **Migration:** The `LocalAdapter.load()` function will check for these keys and initialize them as empty arrays if missing (non-breaking change).

---

## Component Architecture

### 1. The Sandbox State Pattern (The "Multiverse")

To satisfy **FR2 (Sandbox)** and **NFR3 (State Integrity)**, we will implement a **State Forking** pattern in `Zustand`.

**Store Extension:**
~~~typescript
interface SimulationSlice {
  isSandbox: boolean;
  originalSnapshot: AppState | null; // The "Real World"
  enterSandbox: () => void;
  commitSandbox: () => void;
  exitSandbox: () => void;
}
~~~

**Logic Flow:**
1.  **Enter:** `enterSandbox()` copies current `pumps`/`orders` to `originalSnapshot`. Sets `isSandbox = true`.
2.  **Modify:** All existing actions (`moveStage`, `updatePump`) operate on the *current* state (which is now the simulation).
3.  **Persistence Block:** The `LocalAdapter` subscription/listener checks `isSandbox`. If `true`, it **aborts** the save to `localStorage`.
4.  **Commit:** `commitSandbox()` clears `originalSnapshot` and triggers a forced save.
5.  **Discard:** `exitSandbox()` restores `state` from `originalSnapshot` and sets `isSandbox = false`.

### 2. The "Shadow" Routing Architecture

To satisfy **FR1** and **FR3**, we need layouts that escape the main app chrome.

**Router Config:**
~~~tsx
<Routes>
  {/* Standard App */}
  <Route element={<AppShell />}>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/kanban" element={<Kanban />} />
  </Route>

  {/* Reporting Engine (No Nav, Print CSS) */}
  <Route element={<PrintShell />}>
    <Route path="/print/brief" element={<MondayBrief />} />
    <Route path="/print/forecast" element={<CapacityForecast />} />
  </Route>

  {/* Kiosk Engine (No Nav, Auto-Rotate) */}
  <Route element={<KioskShell />}>
    <Route path="/kiosk/:department" element={<ShopFloorHUD />} />
  </Route>
</Routes>
~~~

### 3. New Components

* **`SandboxToolbar`**: Overlay component (Yellow/Black stripes) visible only when `isSandbox === true`. Contains "Commit" and "Discard" buttons.
* **`GhostCard`**: A visual variant of `PumpCard` with opacity/dashed borders, used for temporary items created in Sandbox.
* **`KioskSlide`**: Generic container for TV slides with standard typography scaling (NFR2).
* **`ProgressWidget`**: Gamified progress bar component for the Kiosk.

---

## Source Tree Integration

Additions to the existing structure:

~~~text
src/
├── components/
│   ├── kiosk/                  # NEW: Kiosk specific components
│   │   ├── SlideSchedule.tsx
│   │   ├── SlideInventory.tsx
│   │   └── SlideProgress.tsx
│   ├── print/                  # NEW: Print views
│   │   ├── PrintLayout.tsx     # Shell (CSS print rules)
│   │   ├── BriefView.tsx
│   │   └── ForecastView.tsx
│   └── sandbox/                # NEW: Sandbox controls
│       └── SimulationBar.tsx   # The "Yellow/Black" header
├── pages/
│   ├── KioskPage.tsx           # Handles rotation logic
│   └── PrintPage.tsx           # Router for print views
└── store/
    └── slices/                 # Refactor store into slices if needed
        └── createSimulationSlice.ts
~~~

---

## Coding Standards & Integration Rules

1.  **Print Styles**: Use Tailwind's `print:` modifier extensively.
    * *Rule:* `print:text-black` is mandatory for all text (save ink).
    * *Rule:* `print:hidden` for all buttons, toasts, and nav elements.
2.  **Sandbox Safety**:
    * *Rule:* The `LocalAdapter.save()` method MUST start with `if (store.isSandbox) return;`.
3.  **Kiosk Readability**:
    * *Rule:* Minimum font size for Kiosk components is `text-2xl` (24px). High contrast colors only.

---

## Next Steps / Handoff

1.  **Developer Handoff**:
    * Implement `Milestone` types in `src/types/index.ts`.
    * Implement the `createSimulationSlice` in Zustand.
    * Update `LocalAdapter` to respect the sandbox lock.
2.  **Story Manager**: Create stories for "Reporting Engine", "Sandbox Logic", and "Kiosk UI".

**Validation Confirmation:**
Based on my analysis, this architecture fully supports the "Frank" persona (Agency via Milestone management) and the "Executive" persona (Risk-free simulation) without introducing server-side complexity.
