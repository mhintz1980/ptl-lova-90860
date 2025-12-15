# Project Rebuild: PumpTracker Lite (Next.js + Drizzle)

## 1. Project Overview

This plan outlines the complete rebuild of PumpTracker Lite using a **Next.js (App Router)**, **Supabase (PostgreSQL)**, and **Drizzle ORM** stack.

The core philosophy is twofold:

1.  **Data Integrity (The Ledger)**: Every manufacturing action is recorded in an immutable double-entry ledger, guaranteed by atomic database transactions.
2.  **Deep Exploration (Drill-Down)**: The UI is designed for "Interactive Intelligence," allowing users to start with high-level summaries and drill down into granular details without losing context.

## 2. The "Interactive Intelligence" UX

### 2.1 Topic Cycling & Favorites

Instead of a static dashboard, the main view is a **"Topic Navigator"** (Carousel or Tab-based) that lets users cycle through different analytical contexts (e.g., "Production Health", "Sales Performance", "Bottlenecks").

- **Cycling**: Users can swipe/click through pre-defined topics.
- **Pinning**: Users can "Pin" their favorite charts or topics to a "Favorites" section for quick access.
- **State**: Favorites are persisted per user (in local storage or DB).

### 2.2 Drill-Down Architecture

We strictly follow the "Drill-Down" vs "Drill-Through" distinction:

- **Drill-Down (Zoom In)**:

  - **Interaction**: Click a chart segment (e.g., a slice of a donut).
  - **Action**: The chart transitions (or opens a modal/overlay) to show the _next level of detail_ for that specific segment.
  - **Breadcrumbs**: Always show the path (e.g., `All Models > DD6-SAFE > Purchase Orders`).
  - **Example 1 (WIP Donut)**:
    - **Level 1**: Donut Chart of **WIP by Model** (e.g., "DD6-SAFE: 7 units").
    - **Click**: User clicks the "DD6-SAFE" slice.
    - **Level 2**: Chart transforms to a Pie Chart showing **Customer Distribution** for those 7 units (or POs).
  - **Example 2 (Value Treechart)**:
    - **Level 1**: Treechart of **Dollar Value by Model**.
    - **Click**: User clicks a Model rectangle.
    - **Level 2**: Chart transforms to a Donut Chart showing **Value by Customer** or **Value by PO** for that model.

- **Drill-Through (Context Switch)**:
  - **Interaction**: Click a specific entity (e.g., a PO number in a list).
  - **Action**: Navigates to a _different_ full-page view (e.g., The "Order Details" page or "Customer Profile" page).
  - **Use Case**: When the user needs to leave the analytical flow to perform an action (e.g., Edit PO, Move Pump).

## 3. Technical Architecture

### 3.1 Tech Stack

- **Framework**: Next.js 15 (App Router) - _Server Components for data fetching._
- **Language**: TypeScript - _Strict typing from DB to UI._
- **Database**: Supabase (PostgreSQL) - _Relational data & Auth._
- **ORM**: Drizzle ORM - _Type-safe SQL & Schema definition._
- **Styling**: Tailwind CSS + Shadcn/UI - _Premium aesthetics._
- **Charts**: Recharts (wrapped for Drill-Down state).

### 3.2 Database Schema (Drizzle)

Defined in `src/db/schema.ts`:

1.  **`pumps`**: The Asset. Tracks `stage`, `status`, `model_id`, `po_id`.
2.  **`ledger`**: The History. Immutable log of all moves/changes.
3.  **`purchase_orders`**: The Demand. Tracks `customer_id`, `due_date`.
4.  **`line_items`**: Link between PO and Pumps.
5.  **`pump_models`**: Master Data (Standard BOMs, Specs).
6.  **`customers`**: Customer details.

### 3.3 Application Structure

```
src/
├── app/
│   ├── dashboard/        # Topic Navigator & Drill-Down Charts
│   ├── kanban/           # Drag-and-Drop Board
│   ├── scheduling/       # Calendar View
│   └── layout.tsx        # Main Shell
├── components/
│   ├── charts/           # Smart Charts with Drill-Down Logic
│   │   ├── DrillDownDonut.tsx
│   │   ├── DrillDownTree.tsx
│   │   └── ChartWrapper.tsx (Handles Breadcrumbs/Back)
│   ├── dashboard/        # Topic Carousel & Favorites
│   └── ...
├── db/                   # Drizzle Schema & Client
├── actions/              # Server Actions (Transactions)
└── lib/                  # Utilities
```

## 4. Implementation Plan

### Phase 1: Foundation & Schema

1.  **Init**: Setup Next.js + Drizzle + Supabase.
2.  **Schema**: Define tables with relationships to support drill-down (e.g., ensuring `pumps` link easily to `models` and `customers` via `POs`).
3.  **Seed**: Generate rich sample data to test deep drill-down scenarios.

### Phase 2: The "Golden Thread" (Backend)

1.  **Server Actions**: `movePump`, `createOrder` (Atomic Transactions).
2.  **Aggregations**: Create efficient Drizzle queries for the charts (e.g., `count pumps by model`, `sum value by model`).

### Phase 3: Interactive Dashboard (The Core Request)

1.  **Chart Components**:
    - Build `DrillDownContainer`: Manages `level`, `breadcrumbs`, and `activeFilter`.
    - Build `WipDonut`: Implements the Model -> Customer/PO flow.
    - Build `ValueTree`: Implements the Model Value -> Customer/PO flow.
2.  **Topic Navigator**:
    - Implement Carousel/Tab UI.
    - Implement "Pin to Favorites" (persist to localStorage first, then DB).

### Phase 4: Operational Views

1.  **Kanban**: Drag-and-drop moving pumps (writes to Ledger).
2.  **Modals**: Pump Detail & PO Detail modals (Drill-Through targets).

## 5. Verification Plan

- **Drill-Down UX Test**:
  - Open Dashboard -> Swipe to "WIP" Topic.
  - Click "DD6-SAFE" slice -> Verify chart changes to "Customer Distribution".
  - Verify Breadcrumb says "WIP > DD6-SAFE".
  - Click Breadcrumb "WIP" -> Verify chart returns to top level.
- **Data Integrity Test**:
  - Move a pump in Kanban.
  - Verify `ledger` table has a new entry.
  - Verify Dashboard charts update to reflect the new stage/status.
- **Favorites Test**:
  - Pin "Value Treechart".
  - Reload page.
  - Verify "Value Treechart" appears in the Favorites section.

## 6. Residual TODOs

- [ ] User to provide Supabase credentials.
- [ ] Define the exact list of "Topics" for the navigator.
