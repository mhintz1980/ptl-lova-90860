You are running inside Google Antigravity with Gemini 3 and have access to:
- The codebase for my PumpTracker app
- A dev server / preview environment you can launch
- A real browser you can control for end-to-end testing

Goal:
Create and run an automated end-to-end test that validates the real user workflow on the **Dashboard** page, not just unit tests.

High-level test requirements:
- Start the app in a way that works inside this Antigravity project.
- Open the app in a real (accessible) browser.
- Navigate to the **Dashboard** page exactly like a user would.
- Interact with the UI elements (buttons, dropdowns, chart segments, etc.).
- Verify both:
  - Programmatic correctness (state / DOM / data)
  - Actual user-visible behavior (what a human would see and click)

Assumptions / UI behavior on the Dashboard:
- The Dashboard shows one or more charts that can be scrolled/cycled by **category**.
- There are controls to scroll through charts by category (for example: next/previous buttons, category tabs, or a dropdown).
- Each chart:
  - Animates when it first appears or when the category changes.
  - Has a way to “Add to favorites”.
  - Supports a “drill-down” interaction: when the user clicks a portion of the chart (e.g. a bar, slice, or segment), a new chart appears that shows a more detailed breakdown of that portion (a child / detail chart).

What I want you to do in this workspace:

1. **Figure out how to run the app**
   - Detect or infer the correct command to start the dev server (e.g. `npm run dev`, `pnpm dev`, `yarn dev`, etc.).
   - Start the dev server in the background and wait until it is actually ready.
   - Use a reasonable default URL (e.g. `http://localhost:3000`) or whatever the project configuration indicates.

2. **Open the Dashboard page in a browser**
   - Launch a browser instance supported by Antigravity.
   - Navigate to the root route, and then use the same clicks a user would use to reach `/dashboard` (for example: click a “Dashboard” link in the navbar or sidebar).
   - Wait for the charts to finish their initial load / animation.

3. **Test chart category scrolling / cycling**
   - Locate the UI controls that change the chart category (e.g. “Next Category” / “Previous Category” buttons, category tabs, or dropdown).
   - Perform these steps as a user:
     a) Confirm the initial category label and chart are visible.
     b) Click to switch to the next category.
     c) Verify that:
        - The displayed category label changes.
        - The chart data or labels change (DOM differences, series labels, or data values).
        - The chart animation occurred (e.g. an animation class appears, or the chart’s SVG elements change position/opacity over time).
     d) Switch back to the original category and confirm the chart returns to its original state.

4. **Test “Add to favorites” behavior**
   - For a visible chart:
     a) Find and click the control that marks the current chart as a favorite (e.g. a star icon or “Add to favorites” button).
     b) Verify that the favorites UI updates, for example:
        - The chart appears in a “Favorites” list, panel, or tab.
        - The favorite icon visually toggles to an “active” state.
     c) Reload the Dashboard or navigate away and come back (depending on how the app is built), and confirm that the favorite state persists if it is supposed to.

5. **Test the “drill-down” interaction**
   - On a parent chart:
     a) Identify a clickable region representing a subset of the data (e.g. a bar, a pie slice, or a segment).
     b) Click this region like a user would.
   - Verify that:
     - A new chart or expanded view appears (the “drill-down” chart).
     - The drill-down chart’s title, labels, or legend clearly correspond to the selected portion of the parent chart.
     - The data points in the drill-down chart make sense relative to the parent segment (for example, sum to the parent value or show a breakdown of that portion).
   - If there is a “Back” or “Up one level” control:
     - Click it and confirm that the parent chart and state are restored.

6. **Implementation details**
   - Use a modern browser-automation / E2E library that works well in this environment (Playwright is preferred if available).
   - Put the test file in a reasonable location (for example, `tests/e2e/dashboard.spec.ts` or `e2e/dashboard.test.ts` depending on the existing project setup).
   - If this project already uses a specific test runner (Vitest, Jest, Playwright test runner, etc.), integrate with that instead of inventing a new structure.
   - Show me the test code you create, with clear comments for each step of the user flow.
   - Then run the tests inside this environment and stream or print the output so I can watch as it executes.

7. **Reporting and debugging**
   - After running the tests:
     - Show me a concise summary of which steps passed and which failed.
     - If something fails (for example, an element can’t be found or the animation hook is missing), propose specific code changes to the app to fix the issue, and optionally apply them if I confirm.
   - Where useful, include screenshots or logs from the browser interaction so I can visually confirm what happened.

Finally, after the first successful run:
- Keep the test file in place.
- Tell me: 
  - the exact command I should run to execute this Dashboard E2E test myself, and 
  - how to add more user-flow steps following the same pattern.