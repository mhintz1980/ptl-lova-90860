# Initial Goals (Minimum for success)

## dashboard page

** style all components like their pumptracker-lova counterparts.

** Change our bottom section, the 'order details' section, to work exactly like pumptracker-lova's -(Expandable PO lines).

** group all 4 of our circle charts together.

** ensure our universal filters are scroll locked so they are always visible like the ones on 'pumptracker-lova'. Do this on each page.

## Kanban page

** style all components like their pumptracker-lova counterparts.

** change the collapse button, located in the header of each swim lane, to function like pumptracker-lova's "expand/collapse cards" button.  the button should reduce the size of the pump card, leaving only the most important info visible (model, customer, serial, priority indicator) thereby allowing more pumps to be visible at a glance without scrollling.

** remove the words "kanban board" from the area above the swim lanes. extend the usable area of the kanban board up to utilize that area.

## scheduling

** the jobs should drag and drop with as good or better smoothness and animation as pumptracker lova's.  The dropped pump cards should be styled like pumptracker lova's.

** the 'unscheduled jobs' section should have the 'collpase/expand cards' toggle that we used at the top of the swim lanes on the kanban page.

** delete the buttons we arent using and have no plans for like the the 'left arrow', 'right arrow','refresh' and 'Today' buttons as well as the 'Admistrator', 'A' and '+' buttons on the upper right side.

## Theme Foundations

** src/index.css (line 4) defines the entire Lovable visual system—HSL palette (primary blue 207/98/33, accent yellow 48/100/50), Inter typography, layered shadows (--shadow-*), and utility classes (layer-l1/l2/l3) you’ll want to port so Manus gets the same glassy depth.

** ## tailwind.config.ts (line 3) mirrors those tokens (container sizing, radius variables, chart color slots). Copying both files into Manus (even under _reference/lova/) gives you the exact spacing, radius, and chart colors for later diffing.

## Shared Layout + Filters

** Sticky app chrome comes from src/components/layout/Header.tsx (line 14) (primary bar pinned at top-0) stacked above Toolbar.tsx (line 42), which is also sticky at top-16. Recreate this two-layer stacking so the universal filters stay locked while content scrolls underneath.

** The filter tray (Toolbar.tsx (lines 52-213)) uses rounded pill inputs, subtle hover lift (motion.div hover), and a dynamic “Clear” badge. Porting those Tailwind classes and the collapsedCards toggle from the global Zustand store will make Manus feel identical.

** Main content wrappers (AppShell.tsx (line 9) and page roots such as Dashboard.tsx (line 23), Kanban.tsx (line 13), Scheduling.tsx (line 38)) all rely on container mx-auto px-4/6 plus h-[calc(100vh-80px)] for full-height pages—match that scaffolding before tweaking inner components.

## Dashboard Page

** Widget grid lives in src/pages/Dashboard.tsx (lines 35-113): 3-column responsive layout with Framer Motion entry animations on each card. Reuse the grid breakpoints (grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4) to keep the same stacking.

** Circle charts: WorkloadChart.tsx (lines 20-61) (two pies) and CapacityChart.tsx (lines 13-47) (radial bar) all render inside Card containers set to layer-l1 with 240px height. Grouping them visually just means wrapping in a shared grid or flex block while preserving these dimensions and legends.

** PO “order details” already expand/collapse (PumpTable.tsx (lines 34-116) using expandedPOs). Note the chevron toggles, shaded child rows, and stage badge styling—carry those class names and the per-priority color dots so Manus replicates the expandable lines verbatim.

** KPI strip / total value card styling (KpiStrip.tsx, Dashboard.tsx (lines 43-47)) use bold typography (text-4xl font-bold) with muted captions—helpful reference when restyling Manus metrics.

## Kanban Page

** Page chrome (Kanban.tsx (lines 13-41)) sets the scroll area height and includes the existing collapse toggle tied to the global collapsedCards flag. The card shrinking logic already exists in KanbanCard.tsx (lines 61-83); reuse that pattern so the Manus toggle hides everything below the serial line but keeps priority dot + model/customer visible.

** Columns (KanbanColumn.tsx (lines 17-40)) use layer-l2 glass panels and inner overflow-y-auto lists. Keep that min-width (280px) and gap spacing to match lane widths.

** DnD behavior comes from KanbanBoard.tsx (lines 26-78) using @dnd-kit/core pointer sensors with an 8px activation distance for smooth pickup and an animated drag overlay. Matching those sensor settings and overlay styling will recreate the drag feel.

## Scheduling Page

** Layout (Scheduling.tsx (lines 38-55)) is split into sidebar, grid, and optional detail drawer. The sidebar’s collapse toggle reuses the same collapsedCards flag (ScheduleSidebar.tsx (lines 56-74)), which satisfies your “add expand/collapse to unscheduled jobs” requirement—just expose the button in Manus.

** Header (ScheduleHeader.tsx (lines 12-37)) shows the buttons you want to prune (chevrons, refresh, etc.); note which classes to keep for the surviving view-mode select and calendar pill.

** Drag & drop smoothness parallels Kanban: ScheduleGrid.tsx (lines 11-199) uses @dnd-kit/core with custom hover states, plus events rendered via ScheduleEvent.tsx (lines 12-39) (priority-based ring styles). Copying that implementation—and the Tailwind transitions on UnscheduledPumpCard.tsx (lines 36-82)—will give Manus the same animations and translucent cards.

## Additional Notes

** Icons & motion: lucide-react icons everywhere and Framer Motion hover/tap animations on buttons/cards. Note the default transition timings (duration 0.15-0.32, easing [0.2,0.8,0.2,1]) so Manus interactions feel identical.

** Card hierarchy: layer-l1/l2/l3 utilities govern shadow depth. Write down where each layer shows up (e.g., dashboard widgets = layer-l1, Kanban columns = layer-l2, main content wrapper = layer-l3) so you can reproduce the vertical rhythm.

** Priority indicators: the color mapping (LOW → bg-blue-500, MEDIUM → bg-yellow-500, etc.) appears in Kanban, scheduling, and pump tables—call it out once so you don’t have to hunt later.

** Global spacing & typography: container padding (px-4 pages, px-6 header/toolbar) and type sizes (text-sm headings, text-xs meta) stay consistent across pages. Capture the pattern so Manus pages line up.

** Filter behavior: the sticky toolbar plus collapsedCards state is shared between Kanban and Scheduling unscheduled cards. Jot down that the same store flag drives both collapse toggles.
