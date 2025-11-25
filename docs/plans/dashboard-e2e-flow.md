# dashboard-e2e-flow

## Prompt: Dashboard E2E flow using Antigravity browser

You are a primary Agent running inside **Google Antigravity**, powered by **Gemini 3 Pro**.

Antigravity gives you:
- Full access to the **Editor** (codebase).
- Controlled access to the **Terminal** (to run dev commands).
- A **Browser Agent / Computer Use sub-agent** that can:
  - Launch the Antigravity browser (Chrome-based).
  - Click, scroll, type, select, and interact with the DOM.
  - Read pages via DOM capture / screenshots.
  - Record **videos** and generate **Artifacts** documenting what happened in the browser.

Your task:
Create and run an **end-to-end test** that validates the real user workflow on the **Dashboard page** of my PumpTracker app, using the built-in browser tools. You must:
- Plan → implement → run tests.
- Verify both **program logic** and **actual user-visible behavior**.
- Produce **Artifacts** including at least:
  - A clear task/implementation plan.
  - Test result summary.
  - A **browser recording** of a successful run of the flow.

---

## App behavior to validate on the Dashboard

Assumptions about the Dashboard page:

- It displays one or more **charts** related to pump production/scheduling.
- Charts can be **scrolled / cycled** by **category** (e.g., via buttons, tabs, or a category selector).
- Each chart:
  - **Animates** when it appears or when the category changes.
  - Has a way to **“Add to favorites”** (e.g., a star, toggle, or button).
  - Supports a **“drill-down”** interaction:
    - When a user clicks a portion of the chart (bar/slice/segment),
      a **new chart** appears showing a deeper breakdown of that portion.

If any of these assumptions are wrong, treat that as a discovery step:
- Inspect the code and UI to determine the real controls and behavior.
- Adapt the tests to the actual implementation, but keep the spirit:
  - category cycling,
  - favorites,
  - drill-down into a portion of a parent chart.

---

## What you must do

### 1. Understand the project + dev command

1. Inspect the repository to determine:
   - The **framework** (e.g., React/Next/Vite).
   - The existing **test infrastructure** (Playwright / Cypress / Vitest / Jest, etc.).
   - The correct command to run the dev server (e.g., `npm run dev`, `pnpm dev`, `yarn dev`).

2. Choose the appropriate dev command and:
   - Use the **Terminal tool** to start the dev server.
   - Wait until the localhost app is ready (e.g., port 3000 or whatever is configured).

### 2. Launch the app in the Antigravity browser

1. Use the **Browser Agent / Computer Use** tools to:
   - Open the local URL (e.g., `http://localhost:3000`).
   - Navigate to the **Dashboard** page the same way a user would:
     - Click sidebar/nav links, menu items, or dashboard icons.
2. Confirm that:
   - The initial Dashboard view has at least one chart rendered.
   - The page is fully loaded (no spinners / loaders blocking the view).

Record this as an **Artifact**:
- A short description of how you navigated to the Dashboard.
- A screenshot or short video of the initial Dashboard state.

### 3. Test category scrolling / cycling behavior

Using **browser control**, perform a user-like series of actions:

1. Identify the UI that changes chart categories (buttons, tabs, dropdown, etc.).
2. Verify initial state:
   - Capture the **current category label** and a snapshot of the chart (e.g., legend labels, series names).
3. Change category:
   - Click the control to move to the “next” category.
4. Assert visually and programmatically:
   - The category label changes.
   - The chart content changes:
     - Different data labels / series / values, not just a re-render of identical data.
   - The chart shows **animation behavior**:
     - Detect via DOM class changes, CSS transitions, or SVG updates over time.
5. Switch back to the original category:
   - Confirm that the chart returns to the original series/labels.

In your test code:
- Add assertions that the DOM changes in a way consistent with category changes.
- Optionally validate specific series names or data points if available from the DOM.

### 4. Test “Add to favorites”

1. On a visible chart:
   - Locate the **“Add to favorites”** control (star, button, etc.).
2. Click to add the chart to favorites.
3. Validate:
   - The favorite icon/state visually toggles (e.g., highlighted star).
   - The chart appears somewhere in a **“favorites”** area / list / tab.
4. Reload or navigate away and back to the Dashboard (if favorites are meant to persist):
   - Confirm that the favorite state persists (or validate the intended behavior if persistence is not implemented).

Add E2E assertions:
- Existence of the favorite in the favorites list.
- Correct state of the favorite toggle after the action.

### 5. Test “drill-down” interaction

1. On a “parent” chart:
   - Identify a clickable region representing a specific segment (bar/slice/segment).
   - Use the Browser Agent to click that region.
2. Confirm that a **drill-down chart** appears:
   - A new chart, expanded view, or modal that shows a breakdown of the parent segment.
   - The title or labels clearly reference the segment clicked (e.g., “Details for [Category X]”).
3. Validate data relationships:
   - The drill-down data is consistent with the parent segment (e.g., sums or subsets).
4. If there is a **Back / Up one level** action:
   - Click it.
   - Confirm that the original parent chart and state are restored.

Add matching Playwright-style assertions to ensure:
- Drill-down is triggered on click.
- New chart container is rendered and visible.
- Back/up action correctly restores the original chart.

### 6. Implement the tests in code

1. Use the existing or most natural **E2E framework**:
   - Prefer **Playwright** if it is already in use or easy to adopt.
2. Add a new E2E test file such as:
   - `tests/e2e/dashboard.e2e.spec.ts`
3. Implement tests for:
   - Category cycling.
   - Add to favorites.
   - Drill-down and back.

Include clear comments above each test:
- What user story it represents.
- What is being asserted in both UI and logic.

### 7. Run tests and produce Artifacts

1. From the Terminal, run the E2E tests (e.g., `npx playwright test tests/e2e/dashboard.e2e.spec.ts` or project’s test command).
2. Ensure the Browser Agent interaction is captured:
   - Generate a **video Artifact** of a successful end-to-end run.
   - Include logs and screenshots where appropriate.

In your final response, provide:

- The **exact test file contents** you created.
- The **command** to run the Dashboard E2E tests.
- A concise summary:
  - Which checks passed.
  - Any flaky elements or missing features discovered.
- Links or references to the generated **Artifacts** (task plan, test log, and browser recording) so I can review them in Antigravity.

If any of the expected behaviors are missing or incorrect:
- Explain what’s wrong.
- Propose minimal code changes to the app to implement the intended behavior.
- Offer (but do not auto-apply) these changes for my confirmation.