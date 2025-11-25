# dashboard-departments-and-powdercoat-swimlane

## Prompt: Dashboard departments + Powder Coat swimlane tests

You are an Agent in **Google Antigravity** with:
- Editor access to the PumpTracker repo.
- Terminal access to run dev server and tests.
- A Browser/Computer Use sub-agent for full DOM-level control and page recordings.
- Ability to produce **Artifacts** (plans, logs, screenshots, browser recordings).

Your goals on the Dashboard and Kanban views:

1. Ensure the **Dashboard Tree Map** only shows valid, human-readable department names.
2. Ensure the **Powder Coat** swimlane is correctly split into **three vendor sections**, each with a capacity of **3 pumps per week**, and that the old single-lane capacity of 7 is no longer the active constraint.

You must:
- Reproduce the current behavior via the browser.
- Implement **automated E2E tests** validating both the display and capacity rules.
- Run tests and generate Artifacts summarizing what you did.

---

## Business rules to enforce

### Tree Map – department labels

- Departments should appear with **real names**, e.g.:
  - Fabrication
  - Powder Coat
  - Assembly
  - Testing & Shipping
  - Other legitimate domains as configured.

- The Dashboard **Tree Map** must **not** show raw internal IDs such as:
  - `ioyX0SJKlnG86IKFYQSRU4`
  - `jHfdlieALTpOHzYF3zz0k`
- These ID-like strings are either:
  - database keys,
  - random UUID-style identifiers,
  - or placeholders,
  and should not be user-facing.

### Powder Coat swimlane (Kanban / board view)

- The **Powder Coat** lane should be divided into **three horizontal sub-lanes**, representing three powder-coat vendors.
- Each vendor section has a capacity of **3 pumps per week**.
- Visually:
  - The Powder Coat lane should show three distinct vendor sections (e.g., horizontal bands, labeled sublanes, etc.).
- Capacity logic:
  - The relevant data model / scheduling logic should treat each sub-lane as having a 3-pump/week capacity.
  - The old single Powder Coat capacity of 7 should no longer be the main constraint.

---

## What you must do

### 1. Inspect department data and mappings

1. Use the Editor to find:
   - The structure that defines departments and their IDs.
   - The logic that feeds data to the Dashboard Tree Map.
2. Identify:
   - How labels are chosen for display.
   - Where the raw IDs (like `ioyX0SJKlnG86IKFYQSRU4`) are coming from.

You will then encode those expectations into tests and fix any mapping issues.

### 2. Start dev server and open Dashboard

1. Use Terminal:
   - Run the dev server (e.g., `npm run dev`).
2. Use the Browser Agent:
   - Open the local app URL.
   - Navigate via real clicks to the **Dashboard** view that contains the Tree Map.

### 3. Test: Tree Map department labels are valid

Create an E2E test that:

1. Navigates to the Dashboard page.
2. Locates the Tree Map component in the DOM.
3. Extracts all visible department labels from the Tree Map.
4. Asserts the following:
   - **No label** equals:
     - `ioyX0SJKlnG86IKFYQSRU4`
     - `jHfdlieALTpOHzYF3zz0k`
   - All labels are:
     - Non-empty strings.
     - User-friendly (e.g., not looking like random 20+ character IDs).
5. If any ID-like labels are present:
   - Fail the test.
   - Trace the data flow (e.g., from department ID to label).
   - Propose a fix:
     - Map IDs to proper display names before passing them to the Tree Map.
   - Optionally, implement the fix (after you show the code change) and re-run the test.

### 4. Navigate to the board / Kanban view with swimlanes

1. Use the Browser Agent to open the view that renders departments as swimlanes (Kanban board).
2. Confirm that **Powder Coat** appears as one of the lanes.

### 5. Test: Powder Coat swimlane structure

In your E2E test:

1. Identify the **Powder Coat** lane container.
2. Inside that container, find its sub-lanes / vendor sections.
3. Assert:
   - There are **exactly three** vendor sub-lanes.
   - Each sub-lane is visually separated (horizontal split) and/or individually labeled.
4. If the UI does not show three sub-lanes:
   - Fail the test.
   - Inspect the board configuration to see if the three vendors were added.
   - Propose minimal code changes to:
     - Define three Powder Coat vendor sub-lanes.
     - Render them distinctly in the UI.

### 6. Test: Powder Coat capacity logic (3 pumps/week per vendor)

1. Determine, from code or config:
   - The capacity assignment for each Powder Coat sub-lane.
   - Confirm that each is intended to hold **3 pumps per week**.

2. In your E2E test:
   - Place pumps/cards into a single Powder Coat vendor sub-lane using UI interactions (drag-and-drop, add buttons, etc.).
   - Try to exceed **3 pumps** for that vendor in a single week.

3. Assertions:
   - The system should either:
     - Prevent adding more than 3 pumps to that vendor/week, or
     - Clearly signal over-capacity (e.g., visual warning, count highlight, error message).
   - The old total capacity of **7** for Powder Coat should not be the controlling limit anymore:
     - Adding pumps should respect the 3-per-vendor rule instead.

If you observe that:
- There is still a single lane with capacity 7, or
- The capacity rules ignore the 3-pumps-per-vendor design,

then:
- Fail the test.
- Identify where the capacity is defined and still using the old value.
- Propose and/or implement a code change to:
  - Replace the single 7-capacity with per-vendor 3-capacity.
  - Update any capacity calculations used in scheduling or UI.

### 7. Implement and organize tests

1. Add a dedicated test file, e.g.:
   - `tests/e2e/dashboard-departments-and-powdercoat.e2e.spec.ts`
2. Inside:
   - Group tests logically:
     - `describe("Dashboard Tree Map department labels")`
     - `describe("Powder Coat swimlane structure and capacity")`
   - Use stable selectors:
     - `data-testid="tree-map-department-label"`
     - `data-testid="swimlane-powdercoat"`
     - `data-testid="swimlane-vendor"` (or similar).

### 8. Run tests and generate Artifacts

1. Run the E2E test suite from the Terminal.
2. Use Antigravity’s Artifact system to generate:
   - A Task/Implementation plan summarizing how you validated department labels and Powder Coat swimlanes.
   - Logs of the test runs.
   - A browser recording showing:
     - The incorrect behavior (if present).
     - The corrected behavior after fixes (if you apply them).

In your final response:

- Provide the full E2E test file.
- Provide the commands to re-run just this test suite.
- Summarize:
  - Whether any invalid department labels appeared.
  - Whether Powder Coat is correctly split and capacity-enforced.
- Outline the minimal code changes you recommend if the current implementation does not match the rules.
