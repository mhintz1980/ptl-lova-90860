# PumpTracker Layered UI Refresh — 2025‑11‑12

## Goals
- Restore depth via a consistent 3-layer system on every page (ambient background, structural chrome, content glass cards).
- Increase “actionable” real estate to ~85% by shrinking persistent chrome, consolidating controls, and supporting collapsible panels.
- Introduce a modern near-black theme with neon highlights plus a balanced light mode and an explicit toggle.
- Make hover and drag affordances feel fast and reactive (<150 ms, high-contrast glow/scale cues).
- Reimagine the Scheduling workspace as a hybrid calendar/backlog grid that surfaces stuck work immediately.

## Global Shell & Theme
- Background: near-black gradient (`#050505`→`#0f0f18`) with animated neon grid + noise texture (Layer 1). Light mode uses a soft charcoal-to-smoke gradient.
- Structural chrome (Layer 2): floating sidebar rail + 48 px top bar; both are translucent glass (`rgba(10,10,20,0.78)`) with cyan edges and magenta inner glow.
- Content panels (Layer 3): surface cards with dual drop shadows (outer cyan, inner magenta) and snap hover interactions (scale 1.02, glow sweep, 120 ms cubic-bezier(0.25,0.9,0.3,1.2)).
- Header condenses to icon buttons (nav, filters, global search, Add PO, collapse toggle, theme switch). Labels appear on hover, keeping chrome light.
- Navigation, filters, and Add PO move into a flyout that slides from the sidebar; icons show by default, flyout reveals pills/states vertically.

## Controls & Interaction
- Search input shrinks to 160 px; filters rename to single words (“Customers”, “Status”, etc.). Filter flyout hosts compact selects + chips; pill badges show counts.
- Collapse toggle becomes a shared control in the header cluster, affecting Dashboard (summary tiles), Kanban (pump cards), and Scheduling (cards/backlog).
- Theme toggle switches `light`/`dark` class and persists to localStorage.

## Scheduling Hybrid Workspace
- Main canvas splits 65/35. Left: floating glass calendar grid with stacked job chips per day (PO, client, pump, SLA glow). Hover lifts day panel + cross-highlights backlog cards.
- Right: backlog dock collapses to a neon tab; expanded view shows priority cards with depth and quick action chips (Assign, Push, Close).
- Dragging between backlog and calendar highlights drop targets with amber pulses; backlog filter strip (Overdue/Ready/Needs Info) uses tactile pill toggles.
- Calendar legend + automation buttons collapse into a slim action bar above the grid.

## Implementation Notes
- Update Tailwind tokens + CSS utilities for neon palette, animated grid, and layered shadows.
- Refactor `AppShell`, `Header`, `Toolbar`, and filter components into the compact shell/flyout model.
- Extend store/UI state for theme preference + flyout visibility.
- Rework Scheduling layout to support the hybrid split, backlog dock, and hover/drag cues.
