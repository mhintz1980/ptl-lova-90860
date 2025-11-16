# Lova Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restyle PumpTracker Manus so dashboard, kanban, and scheduling views mirror the PumpTracker Lova experience, including theme tokens, layout bars, charts, tables, and collapse behavior.

**Architecture:** Replace Manus theme variables with the Lova design system, add sticky header/toolbar layout wrappers, and rewrite the dashboard/kanban/scheduling components to reuse shared store state for collapsible cards while preserving existing data adapters.

**Tech Stack:** React + TypeScript, Zustand, Tailwind CSS, Recharts, Vite, dnd-kit, Framer Motion.

### Task 1 (Codex): Port Lova design tokens and Tailwind config

**Status:** ✅ Completed 2025-11-03 (Codex). Styles now align with Lova palette and layer utilities.

**Files:**
- Modify: `src/index.css`
- Modify: `tailwind.config.js`

**Step 1: Back up current styling (optional but recommended)**

```bash
cp src/index.css src/index.css.bak && cp tailwind.config.js tailwind.config.js.bak
```

**Step 2: Replace theme variables with Lova palette and layer utilities**

```diff
/* src/index.css */
-@layer base {
-  :root {
-    --background: 210 20% 98%;
-    ...
-  }
-  .dark {
-    ...
-  }
-}
+@layer base {
+  :root {
+    --background: 220 18% 97%;
+    --foreground: 215 25% 15%;
+    --card: 0 0% 100%;
+    ... (rest of lova tokens)
+  }
+
+  .dark {
+    --background: 215 25% 12%;
+    ...
+  }
+}
+
+@layer utilities {
+  .layer-l1 { ... }
+  .layer-l2 { ... }
+  .layer-l3 { ... }
+  .glass-effect { ... }
+}
```

**Step 3: Update Tailwind config to expose chart colors and sidebar tokens**

```diff
-      colors: {
-        border: "hsl(var(--border))",
-        ...
-      },
+      colors: {
+        border: "hsl(var(--border))",
+        ...,
+        sidebar: {
+          DEFAULT: "hsl(var(--sidebar-background))",
+          foreground: "hsl(var(--sidebar-foreground))",
+          primary: "hsl(var(--sidebar-primary))",
+          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
+          accent: "hsl(var(--sidebar-accent))",
+          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
+          border: "hsl(var(--sidebar-border))",
+          ring: "hsl(var(--sidebar-ring))",
+        },
+      },
+      boxShadow: undefined (use layer utilities instead)
```

**Step 4: Verify Tailwind rebuilds**

```bash
npm run build
```

Expected: Build succeeds without styling errors.

### Task 2 (Codex): Introduce shared AppShell with sticky header and toolbar

**Status:** ✅ Completed 2025-11-03 (Codex). Header/toolbar are sticky; shared store exposes `collapsedCards`.

**Files:**
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/Header.tsx`
- Create: `src/components/layout/Toolbar.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/toolbar/FilterBar.tsx`
- Modify: `src/store.ts`

**Step 1: Add `collapsedCards` boolean to Zustand store (default `false`, toggled action reused by kanban/scheduling)**

```ts
// src/store.ts
interface AppState {
  ...
+ collapsedCards: boolean;
+ toggleCollapsedCards: () => void;
}

persist({
  ...
-      collapsedStages: {...},
+      collapsedStages: {...},
+      collapsedCards: false,
      ...
-      toggleStageCollapse: (stage) => {...},
+      toggleStageCollapse: (stage) => {...},
+      toggleCollapsedCards: () => set((state) => ({ collapsedCards: !state.collapsedCards })),

  partialize: (state) => ({ filters: state.filters, collapsedStages: state.collapsedStages, collapsedCards: state.collapsedCards }),
```

**Step 2: Build Header component using Lova reference**

```tsx
// src/components/layout/Header.tsx
export function Header({ currentView, onChangeView }: HeaderProps) {
  return (
    <header className="bg-primary text-primary-foreground border-b border-primary/20 sticky top-0 z-50 shadow-layer-md">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        ...
      </div>
    </header>
  );
}
```

**Step 3: Build Toolbar component to wrap existing FilterBar with sticky positioning**

```tsx
// src/components/layout/Toolbar.tsx
export function Toolbar({ onOpenAddPo }: ToolbarProps) {
  return (
    <div className="bg-card border-b border-border sticky top-16 z-40 shadow-layer-md">
      <div className="container mx-auto px-6 py-3 flex flex-wrap items-center gap-3">
        <FilterBar className="flex-1 min-w-[260px]" />
        <AddPoButton onClick={onOpenAddPo} />
      </div>
    </div>
  );
}
```

**Step 4: Refactor `FilterBar` to expose inputs without wrapper**

```diff
-export function FilterBar() {
-  return (
-    <div className="border-b ...">
-      <div className="container ...">
-        <div className="surface-panel ...">
-          ...inputs...
-        </div>
-      </div>
-    </div>
-  );
-}
+export function FilterBar({ className }: FilterBarProps) {
+  return (
+    <div className={cn("flex w-full flex-wrap items-center gap-3", className)}>
+      ...inputs with Lova classes...
+    </div>
+  );
+}
```

**Step 5: Rewrite `App.tsx` to use `AppShell` layout**

```tsx
return (
  <AppShell
    currentView={currentView}
    onChangeView={setCurrentView}
    onOpenAddPo={() => setIsAddPoModalOpen(true)}
  >
    {view === 'dashboard' && <DashboardPage pumps={filteredPumps} onSelectPump={setSelectedPump} />}
    ...
  </AppShell>
);
```

**Step 6: Verify layout renders without runtime errors**

```bash
npm run lint
npm run build
```

### Task 3 (You): Rebuild dashboard to match Lova widgets

**Files:**
- Create: `src/pages/Dashboard.tsx`
- Create: `src/components/dashboard/WorkloadChart.tsx`
- Create: `src/components/dashboard/ValueChart.tsx`
- Create: `src/components/dashboard/CapacityChart.tsx`
- Create: `src/components/dashboard/TrendChart.tsx`
- Create: `src/components/dashboard/PumpTable.tsx`
- Modify: `src/components/dashboard/KpiStrip.tsx`
- Remove: `src/components/dashboard/Donuts.tsx`, `BuildTimeTrend.tsx`, `ValueBreakdown.tsx`, `OrderTable.tsx` (after migration)
- Modify: `src/App.tsx` imports to new Dashboard

**Step 1: Build helper selectors for total PO value and grouped data**

```ts
// src/pages/Dashboard.tsx
const totalValue = purchaseOrders.reduce(...);
const groupedPumps = React.useMemo(() => groupByPo(pumps), [pumps]);
```

**Step 2: Implement `WorkloadChart` using Lova pie chart but adapt to Manus pump shape**

```tsx
export const WorkloadChart = ({ pumps, type }: { pumps: Pump[]; type: 'customer' | 'model' }) => {
  const data = React.useMemo(() => buildCounts(pumps, type), [pumps, type]);
  return (
    <Card className="layer-l1">
      ...
    </Card>
  );
};
```

**Step 3: Implement `ValueChart` bar chart with Recharts**

```tsx
const data = useMemo(() => aggregatePoValue(pumps, type), [pumps, type]);
<BarChart data={data}>
  <Cell fill={`hsl(var(--chart-${index % 5 + 1}))`} />
</BarChart>
```

**Step 4: Port `TrendChart`, `CapacityChart`, `KpiStrip` to the new layout**

```tsx
<motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  ...
</motion.div>
```

**Step 5: Implement `PumpTable` accordion grouped by `po`**

```tsx
const groupedByPo = useMemo(() => groupBy(pumps, 'po'), [pumps]);
<TableRow onClick={() => toggle(poId)}>
  {isExpanded && groupedByPo[poId].map(...) }
</TableRow>
```

**Step 6: Remove legacy dashboard components and update references**

```bash
rm src/components/dashboard/Donuts.tsx src/components/dashboard/BuildTimeTrend.tsx src/components/dashboard/ValueBreakdown.tsx src/components/dashboard/OrderTable.tsx
sed -i '' 's/<Donuts.*>//' src/App.tsx # adjust manually if needed
```

**Step 7: Run type-check and lint**

```bash
npm run lint
npm run build
```

### Task 4 (Hold): Align Kanban collapse behavior and styling

**Files:**
- Modify: `src/components/kanban/KanbanBoard.tsx`
- Modify: `src/components/kanban/StageColumn.tsx`
- Modify: `src/components/kanban/PumpCard.tsx`
- Modify: `src/store.ts` (already touched for `collapsedCards`)
- Create: `src/components/kanban/CollapseToggle.tsx` (optional helper)

**Step 1: Replace section title with toolbar-style header and collapse toggle**

```tsx
// KanbanBoard.tsx
<div className="flex items-center justify-between mb-4">
  <p className="text-sm text-muted-foreground">Drag pumps between stages...</p>
  <Button variant="outline" size="sm" onClick={toggleCollapsedCards}>
    {collapsedCards ? <Maximize2 ... /> : <Minimize2 ... />}
  </Button>
</div>
```

**Step 2: Update `PumpCard` to render compact view when `collapsedCards` true**

```tsx
const collapsed = useApp((state) => state.collapsedCards);
...
{collapsed ? (
  <div className="flex items-center justify-between">
    <div>
      <h4 className="font-semibold text-sm">{pump.model}</h4>
      <p className="text-xs text-muted-foreground">{pump.customer}</p>
    </div>
    <span className={`h-3 w-3 rounded-full ${priorityClass}`}></span>
  </div>
) : (
  ...full card body...
)}
```

**Step 3: Tighten column styling to Lova layer utilities**

```diff
-<div className="surface-elevated border ...">
+<div className="layer-l2">
```

**Step 4: Ensure drag overlay respects collapsed view**

```tsx
<DragOverlay>
  {activePump ? <PumpCard pump={activePump} collapsed /> : null}
</DragOverlay>
```

**Step 5: Manual QA**

- Collapse toggle shrinks cards
- Drag still works when collapsed

### Task 5 (Hold): Update scheduling header, sidebar toggle, and card styling

**Files:**
- Modify: `src/components/scheduling/CalendarHeader.tsx`
- Modify: `src/components/scheduling/SchedulingSidebar.tsx`
- Modify: `src/components/scheduling/UnscheduledJobCard.tsx`
- Modify: `src/components/scheduling/MainCalendarGrid.tsx` (ensure smooth drag styling)
- Modify: `src/components/scheduling/SchedulingView.tsx`

**Step 1: Remove unused buttons from header and restyle**

```diff
- <Button variant="ghost" size="icon">ChevronLeft</Button>
- ... refresh, Today, admin avatar ...
+ <Button variant="outline" size="sm" className="min-w-[200px] ...">
+   Jan 1 - Jan 28, 2025
+   <ChevronRight className="rotate-90" />
+ </Button>
+ <Select ...>4 Weeks / 6 Weeks</Select>
```

**Step 2: Add collapse toggle to `SchedulingSidebar` using store `collapsedCards`**

```tsx
const collapsed = useApp((state) => state.collapsedCards);
<Button variant="ghost" size="icon" onClick={toggleCollapsedCards}>
  {collapsed ? <Maximize2 /> : <Minimize2 />}
</Button>
```

**Step 3: Update `UnscheduledJobCard` to hide details when collapsed**

```tsx
if (collapsed) {
  return (
    <Card ...>
      <h4>{pump.model}</h4>
      <p>{pump.customer}</p>
      <Badge ...>{pump.priority}</Badge>
    </Card>
  );
}
// else render full details
```

**Step 4: Align drag animations with Lova (PointerSensor distance, overlay)**

```tsx
// MainCalendarGrid.tsx
const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
```

**Step 5: Smoke test drag-and-drop in scheduling view**

### Task 6 (Shared): Regression checks and cleanup

**Files:**
- Modify: `src/main.tsx` if needed to wrap theme provider
- Update: `package.json` scripts (no change expected)

**Step 1: Run lint and build**

```bash
npm run lint
npm run build
```

**Step 2: Launch dev server for manual regression**

```bash
npm run dev
```

Verify: sticky filters on all views, dashboard cards animate, Kanban collapse works, Scheduling sidebar toggle works, no console errors.

**Step 3: Remove backups if generated**

```bash
rm src/index.css.bak tailwind.config.js.bak
```

---

### Notes for upcoming tasks

- Theme tokens and Tailwind sidebar/chart colors are now available; use `layer-l1/2/3` utilities instead of custom shadows.
- Zustand store exposes `collapsedCards` with persistence—reuse for Kanban (Task 4) and Scheduling sidebar (Task 5).
- New `AppShell` expects view components to render inside the main container. Dashboard content currently uses the legacy widgets until Task 3 replaces them.
- `npm run lint` currently fails because `_reference/*` snapshots and several existing test utilities have outstanding lint issues. Focus local linting on updated files or run `npm run lint src` while Task 3 is in progress.
- `npm run build` will fail until the new dashboard components are fully wired (Task 3); current errors stem from partially migrated files referencing Framer Motion/placeholder components.
