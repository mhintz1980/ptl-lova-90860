# Project Documentation

This directory gathers every document a new contributor needs. Start here, then drill into the topic-specific guides as you ramp up.

| Document | Purpose |
| --- | --- |
| [architecture.md](architecture.md) | Explains the UI surfaces (Dashboard, Kanban, Scheduling), data model, and Zustand store responsibilities. Useful when deciding where a feature belongs. |
| [development-guide.md](development-guide.md) | Day-to-day workflow: environment setup, coding conventions, feature toggles, and tips for navigating the repo. |
| [testing.md](testing.md) | How to run Vitest and Playwright (including the base URL override) plus guidance on verifying the scheduling legend filters. |
| [deployment.md](deployment.md) | Updated deployment notes for Vercel/Netlify/S3. |
| [archive/](archive/) | Historical context, migration logs, and older plans that are no longer part of the active process. Browse only if you need background information. |

If you add a new guide, link it in this table so the next developer can find it quickly.

## Current Work (Dashboard & Scheduling)

We are actively making the Dashboard customizable via topic/category pills near the header. Clicking a category will populate the page with charts for that topic:

- **Financials**: Value of open orders; value of scheduled shipments by week/month/quarter; value of completed orders by week/month/quarter.
- **Production Management**: Build-time stats; ahead/behind-schedule jobs; bottleneck and capacity visuals; goal tracking (hit/miss).
- Additional categories will be added as the chart library expands; the goal is a config-driven dashboard that swaps chart sets per topic.

Scheduling is also being revamped to improve interaction and respect constraints:

- Drag jobs after they’re placed on the calendar, with capacity/manhour limits enforced per stage.
- Resize jobs directly on the calendar by dragging the end of a bar to change build time.
- Toggle to auto-level after each edit and an option to lock specific jobs to specific dates.
- Rule-based scheduling (e.g., “must start by this date”) that influences leveling and auto-scheduling.

If you are contributing during this phase, keep new charts/config in the dashboard engine patterns (config-first chart registry + topic definitions) and note any scheduling changes that affect leveling rules.
