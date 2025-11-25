# Animated Pie Chart Interactions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Introduce immersive hover/animation effects for every donut/pie chart (Workload/Value breakdown tiles) including slice scaling/glow, callout labels originating from segments, tile-level 3D hover, and living legends.

**Architecture:** Centralize Recharts hover logic via a reusable `HoverAnimatedPieChart` component plus shared CSS utilities. Wrap existing dashboard chart tiles with new component and tile wrapper, augmenting data to drive callout text. Rely on CSS transforms/filters for tilt + drop shadows; use React state to track hovered slice.

**Tech Stack:** React 19 + TypeScript, Recharts 3.x, Tailwind CSS/custom CSS modules, CSS keyframe animations (no new deps unless needed).

### Task 1: Create shared animated pie wrapper

**Files:**
- Create: `src/components/charts/HoverAnimatedPieChart.tsx`
- Modify: `src/components/dashboard/Donuts.tsx`
- Modify: `src/index.css` (new utility classes)

**Steps:**
1. Define props interface (`data`, `dataKey`, `nameKey`, `colors`, `valueFormatter`, `title`). Set internal state for `activeSlice` and tile hover transforms.
2. Add tile wrapper JSX with `onMouseMove` capturing cursor `clientX/Y`, compute relative offsets, update CSS custom properties (`--tiltX`, `--tiltY`, `--tiltScale`). Add `onMouseLeave` to reset transforms.
3. Implement `<PieChart>` with gradients/filters in `<defs>`. Use `Pie` component with `activeIndex={activeSlice}` and custom `activeShape` renderer scaling radius and adding glow/stroke.
4. Render floating callout when `activeSlice` defined. Convert slice mid-angle to x/y offsets (`polarToCartesian`). Position callout with inline styles, animate via CSS keyframes (`scale-up`, `fade-outwards`). Include segment color, label, count.
5. Build legend row of items referencing `data`; animate legend chip expansion on tile hover.
6. Update `src/index.css` with `.chart-tile`, `.chart-legend`, `.chart-callout`, `.chart-glow` classes plus keyframes for tilt, glow, callout motion.
7. Export component.

**Verification:** `pnpm test src/components/kanban/StageColumn.test.tsx` (smoke), manual `pnpm dev` to inspect chart behavior.

### Task 2: Integrate wrapper into Donuts

**Files:**
- Modify: `src/components/dashboard/Donuts.tsx`

**Steps:**
1. Import `HoverAnimatedPieChart` and replace existing Recharts markup for Workload by Customer/Model, Value Breakdown if present.
2. Ensure data arrays include `value` and `label` fields so callout displays correctly. Provide color palettes.
3. Wrap each chart tile with `HoverAnimatedPieChart` component, pass `title`, `subtitle`, `valueFormatter` functions.
4. Adjust layout to accommodate new legend/callout spacing.
5. Manual QA via `pnpm dev` moving cursor across segments verifying glow, label animation, tile tilt.

### Task 3: Documentation updates

**Files:**
- Modify: `docs/development-guide.md`
- Modify: `README.md`

**Steps:**
1. Add subsection describing `HoverAnimatedPieChart` usage, props, and styling hooks.
2. Document hover/tilt design rationale and how to add new donut charts using the wrapper.
3. Mention interactive chart effects in README Feature list.

**Verification:** `pnpm lint`, `pnpm test`, `pnpm run build:dev`. Manual: ensure charts animate properly on hover.
