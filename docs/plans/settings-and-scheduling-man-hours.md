# settings-and-scheduling-man-hours

## Prompt: Settings modal man-hours + scheduling capacity tests

You are an Agent running inside **Google Antigravity** with:
- Access to the PumpTracker codebase (Editor).
- Terminal control to run dev server and tests.
- A Browser/Computer Use sub-agent to drive the UI in the Antigravity browser.
- The ability to produce **Artifacts** (plans, logs, browser recordings).

Your goal:
1. Ensure the **Settings** modal correctly shows **employee count and derived man-hours per department**.
2. Ensure **Scheduling/Calendar** logic properly respects **daily man-hour capacity** for the **Fabrication** department (no impossible “everything finishes in a single day” situations).

You must:
- Create **automated tests** for both UI and scheduling logic.
- Use the browser to reproduce the real user behavior.
- Run the tests and summarize results, along with Artifacts.

---

## Business rules to enforce

### Settings modal

- For each department (e.g., **Fabrication**), the Settings UI must show:
  - A field for **number of employees**.
  - A field **directly beside it** showing the department’s **daily man-hours**.
- Man-hours should be derived from:
  - `number_of_employees × hours_per_shift_per_day`
  - If there is a configurable workday length (e.g., 8 hours/day), use that from the code/config.
  - If not clearly defined, treat that as a bug and propose adding an explicit setting.

### Scheduling / Calendar

- The **man-hours value** is the true **daily capacity** per department.
- For the **Fabrication** department:
  - A pump’s Fabrication stage requires a certain number of hours to complete.
  - If **4 jobs** are scheduled to **start Fabrication on Monday the 24th**, but their combined Fabrication hours **exceed the daily Fabrication capacity**, they must not all start **and finish** Fabrication on that same day.
  - At least some jobs’ Fabrication stages must spill over into subsequent days.

Currently observed bug:
- When 4 jobs are dropped on Monday the 24th in Fabrication, they all appear to **complete** Fabrication on that same day, even though this should be impossible given realistic build times.

---

## What you must do

### 1. Inspect and understand configuration

1. Find the code/config where:
   - Departments are defined.
   - Employee counts and capacities are stored.
   - Any existing notion of **hours per day** or **man-hours** is defined.

2. Determine:
   - How man-hours are currently computed (if at all).
   - How department capacity is being used in scheduling logic.

If man-hours field does not exist in the Settings UI:
- Treat this as a missing feature that needs to be implemented.
- Your tests should **fail** initially, then you propose the minimal changes to add it.

### 2. Start dev server and open Settings

1. Use the Terminal to run the dev command (e.g., `npm run dev`).
2. Use the Browser Agent to:
   - Open the local app URL.
   - Navigate through the real UI to the **Settings** modal/page where departments are configured.

### 3. Test: Settings modal shows employees and man-hours

Create an automated test (e.g., Playwright) that:

1. Navigates to the Settings view as a user (clicking the appropriate buttons/links).
2. Locates the row/section for **Fabrication**.
3. Asserts:
   - There is a visible field (or text) for **number of employees**.
   - Directly to its side, there is a visible field for **man-hours**.
4. Calculates the **expected** man-hours based on the codebase rules:
   - Use real config where available.
   - If needed, infer `hours_per_day` from constants or settings.
5. Asserts that the displayed **man-hours** matches the expected value.

If these fields or relationships do not exist:
- Fail the test.
- Propose the minimal code changes to:
  - Introduce the man-hours field in the UI.
  - Wire it to the real scheduling capacity logic.

### 4. Test: Scheduling respects Fabrication man-hours capacity

Create another test for the **Scheduling/Calendar** view:

1. Use the Browser Agent to:
   - Navigate to the **Scheduling/Calendar** page via user interactions.
2. Set up or load a scenario where:
   - **4 jobs** are scheduled to start their **Fabrication** stage on **Monday the 24th**.
   - Each job has a known Fabrication hour requirement from configuration or code.

3. In the test:
   - Compute the **total required Fabrication hours** for the 4 jobs.
   - Read the **daily Fabrication man-hours capacity** from the Settings or underlying config.
4. Assertions:
   - If `total_required_hours_for_4_jobs > daily_fab_man_hours`:
     - Then in the Calendar UI, the Fabrication stage bars **must not all fit in a single day**.
     - At least one job’s Fabrication bar must extend beyond Monday the 24th.
   - Check the DOM for each job’s Fabrication bar:
     - Read its start date and end date (or number of day cells it covers).
     - Verify that durations reflect capacity, not just naive “one-day per stage” behavior.

If the Calendar shows all 4 jobs starting and finishing Fabrication on Monday the 24th:
- Fail the test.
- Locate the scheduling logic and identify where:
  - The wrong capacity value is used (e.g., employee count, or a flat constant).
  - Man-hours are not being applied.
- Propose precise code changes:
  - Use man-hours per day as the limiting factor.
  - Recompute stage durations based on required hours vs. daily capacity.

### 5. Implement and organize tests

1. Add a test file such as:
   - `tests/e2e/settings-and-scheduling.e2e.spec.ts`
2. Within that file:
   - Group tests logically:
     - `describe("Settings modal - man-hours")`
     - `describe("Scheduling - Fabrication capacity")`
   - Use clear, stable selectors:
     - Prefer `data-testid` attributes where possible.

### 6. Run tests and produce Artifacts

1. Run the E2E tests from the Terminal in Antigravity.
2. Use Antigravity’s Artifact system to:
   - Capture a **Task Plan** describing how you verified these rules.
   - Capture test logs and, ideally, a **browser recording** demonstrating:
     - Navigating to Settings.
     - Seeing the employees + man-hours fields.
     - Scheduling jobs and observing Fabrication timeline behavior.

In your final response:

- Provide the full content of the new test file.
- Provide the exact CLI command(s) to re-run only these tests.
- Summarize:
  - Whether the UI and logic currently meet the business rules.
  - Any fixes you recommend (with minimal-change diffs if possible).
- Reference the Artifacts (test run, browser recording) so I can inspect them in Antigravity.