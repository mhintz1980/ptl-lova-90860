# Layered UI Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship the neon layered aesthetic with compact controls, flyouts, backlog/calendar hybrid, and reusable collapse toggle across Dashboard, Kanban, and Scheduling.

**Architecture:** Centralize theme + layout state inside the app shell, expose compact header/flyout components, and split the scheduling workspace into a glass calendar plus backlog dock backed by existing pump data/state. Heavy visual updates land in `index.css` (new tokens, ambient layers) while functional changes stay within React components/hooks.

**Tech Stack:** React 19, TypeScript, Zustand store, TailwindCSS, Vitest, Vite.

---

### Task 1: Neon theme tokens & ambient layers

**Files**
- Modify: `src/index.css`
- Modify: `tailwind.config.js`
- Modify: `src/main.tsx`
- Test: `pnpm lint`

**Step 1: Update CSS variables + utilities**

Replace the existing light/dark tokens with near-black neon + warm-light palettes, add ambient gradient/noise/grid classes, and keep three elevation helpers. Example snippet for `:root`:

```css
:root {
  --background: 220 17% 6%;
  --foreground: 205 18% 92%;
  --primary: 185 100% 59%;
  --accent: 28 100% 55%;
  --card: 220 20% 9%;
  --surface-grid: radial-gradient(circle at 20% 20%, rgba(56,189,248,0.15), transparent 65%);
  --noise-texture: url("/assets/noise.png");
  --radius: 0.85rem;
}
```

Add `.app-ambient`, `.layer-glass`, `.layer-depth` utilities plus fast hover animations (keyframes). Duplicate tokens for `.light` override.

**Step 2: Tailwind extensions**

Hook new CSS vars in `tailwind.config.js` (`backgroundImage`, `boxShadow.neon`, custom keyframes like `pulse-glow`). Ensure container padding matches new shell spacing.

**Step 3: Default to system preference**

Replace the hard-coded dark-class in `src/main.tsx` with:

```ts
const stored = localStorage.getItem("pt-theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const mode = (stored === "light" || stored === "dark") ? stored : (prefersDark ? "dark" : "light");
document.documentElement.classList.add(mode);
```

**Step 4: Run lint**

`pnpm lint` — expect PASS.

---

### Task 2: Theme controller hook + tests

**Files**
- Create: `src/hooks/useTheme.ts`
- Create: `src/hooks/useTheme.test.tsx`
- Modify: `src/components/layout/AppShell.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/layout/Toolbar.tsx`

**Step 1: Write failing hook test**

Add `useTheme.test.tsx`:

```tsx
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "./useTheme";

describe("useTheme", () => {
  beforeEach(() => {
    document.documentElement.className = "";
    localStorage.clear();
  });

  it("initializes from localStorage", () => {
    localStorage.setItem("pt-theme", "light");
    const { result } = renderHook(() => useTheme());
    expect(result.current.mode).toBe("light");
  });

  it("toggles mode and updates DOM", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggle());
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(localStorage.getItem("pt-theme")).toBe("light");
  });
});
```

**Step 2: Run test (expect fail)**

`pnpm test src/hooks/useTheme.test.tsx` → fails because hook doesn’t exist.

**Step 3: Implement hook + neon toggle button**

Create `useTheme.ts` returning `{ mode, toggle }`, add effect to sync DOM class & localStorage. In `Header`, import `ThemeToggle` icon button:

```tsx
const { mode, toggle } = useTheme();
<IconButton
  icon={mode === "dark" ? <Moon /> : <Sun />}
  label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
  onClick={toggle}
/>
```

Ensure `AppShell` wraps children in ambient divs (`app-ambient`, `grid-overlay`).

**Step 4: Run hook test (expect pass)**

`pnpm test src/hooks/useTheme.test.tsx`.

---

### Task 3: Compact header + flyout controls

**Files**
- Create: `src/components/layout/IconRail.tsx`
- Create: `src/components/layout/ControlFlyout.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/layout/AppShell.tsx`
- Modify: `src/components/toolbar/FilterBar.tsx`
- Modify: `src/components/toolbar/AddPoButton.tsx`
- Modify: `src/App.tsx`
- Tests: `pnpm test src/components/kanban/KanbanBoard.test.tsx`

**Step 1: Icon rail + flyout shell**

Implement `IconRail` that renders nav icons vertically (Dashboard/Kanban/Scheduling). Provide collapsed (72 px) and expanded width, with tooltip labels.

**Step 2: Header refactor**

Replace 14px bar with 48px glass top bar containing: hamburger (toggles flyout), search pill (width 160px), Add PO button, collapse toggle placeholder, theme toggle. Search input shrinks and updates placeholder. Use neon glow transitions:

```tsx
<input className="search-pill focus:ring-cyan-400" placeholder="Search" maxLength={24} />
```

**Step 3: Filter flyout**

Turn `FilterBar` into `FilterFlyoutContent` that renders single-word selects and chips. Use icons for sections (e.g., Users, Models, Priority). Mount inside `ControlFlyout` using Radix dialog or custom portal; default hidden, anchored to header icon. Move Add PO and nav actions into this flyout for mobile fallback.

**Step 4: Wire collapse toggle slot**

Expose `onToggleCollapse` prop from pages to header so the universal toggle button appears only when provided.

**Step 5: Update AppShell layout**

Structure as:

```tsx
<div className="app-ambient">
  <IconRail ... />
  <div className="flex-1">
    <Header ... />
    <main className="content-stage">{children}</main>
  </div>
</div>
```

Remove old Toolbar usage (filters now in flyout).

**Step 6: Run Kanban board tests**

`pnpm test src/components/kanban/KanbanBoard.test.tsx` — update expectations if class names changed.

---

### Task 4: Collapse toggle unification

**Files**
- Modify: `src/store.ts`
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/Kanban.tsx`
- Modify: `src/components/scheduling/SchedulingSidebar.tsx` (renamed backlog dock)
- Modify: `src/components/scheduling/DragAndDropContext.tsx`
- Create: `src/components/layout/CollapseToggle.tsx`
- Tests: `pnpm test src/components/scheduling/DragAndDropContext.test.tsx`

**Step 1: Store surface**

Expose `collapsedCards` and `toggleCollapsedCards` via a selector/hook to share with header.

**Step 2: Dashboard wiring**

Use collapsed state to render KPI cards in compact mode:

```tsx
const { collapsedCards } = useApp();
return (
  <section className={collapsedCards ? "grid-cols-6" : "grid-cols-3"}>
    {/* show summary only when collapsed */}
  </section>
);
```

**Step 3: Header button**

`CollapseToggle` uses stored state and renders Minimize/Maximize icons with neon pulses; place inside header when `currentView !== "dashboard"`? (Still render but action is shared.)

**Step 4: Scheduling backlog**

Ensure `SchedulingSidebar` (soon backlog dock) reads the same state so collapsed cards show short rows (model, customer, serial only).

**Step 5: Tests**

Extend `DragAndDropContext.test.tsx` to assert collapsed prop propagates into `UnscheduledJobCard`. Run `pnpm test src/components/scheduling/DragAndDropContext.test.tsx`.

---

### Task 5: Scheduling hybrid calendar/backlog

**Files**
- Modify: `src/components/scheduling/SchedulingView.tsx`
- Rename: `src/components/scheduling/SchedulingSidebar.tsx` → `BacklogDock.tsx`
- Modify: `src/components/scheduling/MainCalendarGrid.tsx`
- Modify: `src/components/scheduling/CalendarHeader.tsx`
- Modify: `src/components/scheduling/UnscheduledJobCard.tsx`
- Modify: `src/components/scheduling/EventDetailPanel.tsx`
- Modify: `src/components/scheduling/CalendarEvent.tsx`
- Tests: `pnpm test src/components/scheduling/DragAndDropContext.test.tsx`

**Step 1: Backlog dock component**

Convert sidebar into slide-out dock with collapsed tab:

```tsx
const [open, setOpen] = useState(true);
return (
  <aside className={cn("backlog-dock", open ? "w-[30%]" : "w-[52px]")}>
    <button className="dock-tab" onClick={() => setOpen(!open)}>Backlog · {count}</button>
    <div className="card-stack">
      {jobs.map((pump) => <UnscheduledJobCard compact={collapsedCards} ... />)}
    </div>
  </aside>
);
```

Chips for filters (Overdue/Ready/Needs Info) live atop the dock.

**Step 2: Calendar grid depth**

Wrap grid in glass container, add day hover animations (translateZ, glow). Within `CalendarEvent`, include PO/client metadata and SLA glow classes.

**Step 3: Hybrid layout**

`SchedulingView` splits `flex` with `basis-[65%]` for calendar, `BacklogDock` as `basis-[35%]`. Provide `onAssign` drop handlers linking backlog to calendar (reuse existing DnD). Stage legend + automation buttons collapse into a top action bar occupying minimal height.

**Step 4: Tests**

Update scheduling tests to reference renamed component and ensure backlog toggle button exists. Run `pnpm test src/components/scheduling/DragAndDropContext.test.tsx`.

---

### Task 6: Visual + regression verification

**Files/Commands**
- `pnpm test`
- `pnpm lint`
- `pnpm run build`

**Step 1: Full unit suite**

`pnpm test` — expect PASS.

**Step 2: Lint + type safety**

`pnpm lint && pnpm run build` — ensures Tailwind + TS compile with new components.

**Step 3: Manual smoke**

Run `pnpm dev`, verify:
- Theme toggle switches neon/light and persists reload.
- Flyout exposes filters + Add PO; header occupies <15% vertical space.
- Collapse toggle shrinks cards on Dashboard/Kanban/Scheduling.
- Calendar/backlog interactions feel layered, drag/hover animations respond instantly.
