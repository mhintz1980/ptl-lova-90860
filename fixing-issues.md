title: "PumpTracker Lite – Fix Dashboard & Scheduling Issues from Spec Files"
doc_type: "coding_task_prompt"
app_name: "PumpTracker Lite"
task_kind: "bugfix_and_feature_alignment"
priority: "high"

context_docs:
  # Behavior / test specs
  - "docs/dashboard-e2e-flow.md"
  - "docs/settings-and-scheduling-man-hours.md"
  - "docs/dashboard-departments-and-powdercoat-swimlane.md"
  - "docs/click-to-drill-down-table-chart.yml"
  - "docs/fix-and-extend-drill-down-charts.yml"
  # Supporting context
  - "README.md"
  - "docs/architecture.md"
  - "docs/testing.md"
  - "docs/pumptracker-lite-feature-review.yml"

instructions: |-
  You are my Claude Code agent focused on **bringing the current PumpTracker Lite implementation into alignment with its documented behavior**.

  Your mission in this prompt:
  Use your **tools, skills, hooks, agents, and workflows** to **create and execute a concrete plan to fix the issues and gaps** described in these documents:

  - `docs/dashboard-departments-and-powdercoat-swimlane.md`
  - `docs/settings-and-scheduling-man-hours.md`
  - `docs/dashboard-e2e-flow.md`
  - `docs/click-to-drill-down-table-chart.yml`
  - `docs/fix-and-extend-drill-down-charts.yml`

  The focus is correctness and behavior, not a full re-architecture.

  ## 1. Build an issues checklist from the spec docs

  1. Carefully read each of the five context docs listed above.
  2. For each document, extract and normalize:
     - Explicit bugs (things that currently do not work).
     - Mismatches between spec and implementation (things that should exist but don’t).
     - Missing or flaky test coverage for critical flows.

  3. Consolidate these into a **single, flat checklist** of issues, labeled by source doc, for example:
     - `[dashboard-e2e-flow] Late orders donut should filter the table when clicked.`
     - `[settings-and-scheduling-man-hours] Capacity calculations ignore updated employee-hours settings.`
     - `[fix-and-extend-drill-down-charts] Value by Customer donut not rendering; bar charts/treemap lack drill-down.`
  
  Keep the checklist:
  - Concrete,
  - Testable,
  - Implementation-agnostic (describe behavior, not specific components).

  ## 2. Turn the checklist into a repair plan

  Group the issues into a small number of workstreams, for example:

  - Workstream A: **Dashboard drill-down & chart behavior**
    - `click-to-drill-down-table-chart.yml`
    - `fix-and-extend-drill-down-charts.yml`
  - Workstream B: **Department swimlanes & Powder Coat behavior**
    - `dashboard-departments-and-powdercoat-swimlane.md`
  - Workstream C: **Settings & capacity / man-hours**
    - `settings-and-scheduling-man-hours.md`
  - Workstream D: **E2E flow alignment and tests**
    - `dashboard-e2e-flow.md`

  For each workstream, define:
  - Scope: which parts of the UI and store are involved.
  - Risks: potential regressions (e.g., capacity calculations, legend filters, existing charts).
  - Dependencies on other workstreams (if any).

  Then propose an order of execution that minimizes risk and keeps tests useful.

  ## 3. Design or update tests before making large changes

  For every issue you plan to fix, ensure there is at least one way to verify it:

  - Prefer **Playwright E2E tests** for end-to-end behaviors described in:
    - `dashboard-e2e-flow.md`
    - drill-down behavior docs.

  - Use **unit or integration tests** for:
    - capacity calculations,
    - scheduling/man-hours logic,
    - data transformation helpers.

  Steps:

  1. Inspect existing tests in `docs/testing.md` and `tests/`.
  2. Where a behavior is described but not tested, add or update:
     - A Playwright spec (for user-facing flows).
     - A unit/integration test for pure logic.

  The goal is: **every fix you make is backed by a test that would fail before the fix and pass afterward.**

  ## 4. Implement the fixes with minimal, targeted changes

  Now use your coding tools to actually implement the fixes.

  Focus on the specific issue areas, using the patterns already present in the codebase:

  - **Dashboard & Drill-Down**
    - Fix non-rendering charts and mismatched props/data:
      - Ensure charts such as “Value By Customer”, late-orders charts, and any treemap/bar charts mentioned in the YAML specs actually render.
    - Implement or correct click-to-drill behavior:
      - Use the specification in `click-to-drill-down-table-chart.yml` and `fix-and-extend-drill-down-charts.yml` as the source of truth.
      - Make sure that clicking chart segments (donuts, bars, treemap nodes, etc.) applies the appropriate filters and/or shows the next level of detail.
      - Ensure drill-down is consistent across chart types and integrates with global filters/table views.

  - **Departments & Powder Coat Swimlane**
    - Use `dashboard-departments-and-powdercoat-swimlane.md` to:
      - Verify that swimlane grouping and visual representation of Powder Coat vs other departments matches the spec.
      - Fix any display, grouping, or filtering issues that deviate from the expected swimlane behavior.

  - **Settings, Capacity & Man-Hours**
    - Use `settings-and-scheduling-man-hours.md` to:
      - Confirm that changes to staffing (employee count, hours) are correctly reflected in capacity calculations.
      - Fix any bugs where updated settings are ignored or not persisted.
      - Ensure derived values (available hours, department capacity, etc.) are recalculated and used by the scheduler.

  - **E2E Dashboard Flow**
    - Use `dashboard-e2e-flow.md` to:
      - Confirm that the described “happy path” dashboard interactions work end-to-end.
      - Fix any blockers (filters not applying, drill-down not updating tables, navigation issues).
      - Align labels, metrics, and KPIs with the documented expectations.

  While implementing:
  - Prefer small, focused changes over sweeping refactors.
  - Reuse existing utilities and patterns (e.g., store actions, selectors, chart wrappers).
  - Don’t change the overall architecture here; that belongs in the “Rebuild” prompt.

  ## 5. Keep changes isolated and traceable

  - For each issue or small group of issues:
    - Note which files you modify and why.
    - Keep commits logically grouped (if you were committing).
  - Avoid mixing large refactors with bugfixes in the same changeset.
  - Do not introduce new dependencies unless absolutely necessary.

  ## 6. Final output format

  In your final response for this task, produce:

  1. **Issue checklist** – the normalized list of issues you derived from the docs, each marked as:
     - `open`, `in-progress`, or `fixed` (for this run).
  2. **Summary of code changes** – grouped by workstream:
     - Files touched,
     - Very short description (1–2 sentences per file).
  3. **Test updates**:
     - Which tests you added or modified,
     - What behavior they cover.
  4. **Residual TODOs** (if any):
     - Items you recommend for a follow-up prompt (e.g., “add further drill-down levels”, “optimize this query”, etc.).

  Be concise and implementation-focused. Assume future prompts may refer back to specific checklist items (e.g., “Now address remaining open issues from Workstream C”), so keep IDs or clear labels on each issue.






