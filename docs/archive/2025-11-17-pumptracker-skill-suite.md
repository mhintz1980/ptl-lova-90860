# PumpTracker Skill Suite Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Package PumpTracker's frontend, data/state, and testing/tooling docs into three Claude Skills that can be loaded independently or combined later for full-stack assistance.

**Architecture:** Each skill gets its own curated docs folder under `docs/skills/<domain>/`, a brainstorming transcript to define triggers/routing, a generated `.json` skill file via `skill-creator`, and a validation scenario verified in Claude Code. Repeatable structure ensures future skills follow the same ceremony.

**Tech Stack:** Markdown docs from `docs/`, Codex superpowers (`brainstorming`, `skill-creator`, `executing-plans`), Git for versioning, Claude Code for validation sessions.

### Task 1: Frontend Skill (UI & Vite)

**Files:**
- Create: `docs/skills/frontend/{index.md,requirements.md,validation.md}`
- Copy: `docs/architecture.md`, `docs/development-guide.md`, `src/index.css` excerpts, `vite.config.ts` notes
- Output: `skills/pumptracker-frontend-skill.json`

**Step 1: Curate docs**

```bash
mkdir -p docs/skills/frontend
cp docs/architecture.md docs/skills/frontend/architecture.md
cp docs/development-guide.md docs/skills/frontend/development.md
# export relevant snippets (style tokens, layout guides)
```

Document Tailwind tokens and layout primitives inside `docs/skills/frontend/ui-primitives.md`.

**Step 2: Brainstorm requirements**

Use superpowers:brainstorming with prompt: "Create a skill for docs @docs/skills/frontend/ ..." Capture Q&A in `docs/skills/frontend/requirements.md`.

**Step 3: Generate skill**

```bash
~/.codex/superpowers/.codex/superpowers-codex use-skill skill-creator \
  --skill-name pumptracker-frontend \
  --docs-path docs/skills/frontend
```

Inspect `skills/pumptracker-frontend-skill.json` for correct triggers ("stage board", "timeline", "tailwind").

**Step 4: Validate**

Write `docs/skills/frontend/validation.md` describing a UI feature (e.g., "new stage timeline view"). In Claude Code: `Read @docs/skills/frontend/validation.md and use pumptracker-frontend skill...`. Save transcript summary to `test-results/skills/pumptracker-frontend.md`.

**Step 5: Commit**

```bash
git add docs/skills/frontend skills/pumptracker-frontend-skill.json test-results/skills/pumptracker-frontend.md
git commit -m "feat: add PumpTracker frontend skill"
```

### Task 2: Data & State Skill (Supabase/Zustand)

**Files:**
- Create: `docs/skills/data/{index.md,requirements.md,validation.md}`
- Copy: Supabase schema docs, Zustand store notes, API references (`docs/deployment.md` sections on env vars)
- Output: `skills/pumptracker-data-skill.json`

**Step 1: Curate docs** by extracting Supabase table definitions, API endpoints, CSV parsing guidance into the `docs/skills/data/` folder.

**Step 2: Brainstorm** activation for terms like "supabase", "stage transitions", "zustand"; capture into requirements.

**Step 3: Generate skill** via `skill-creator --skill-name pumptracker-data --docs-path docs/skills/data`.

**Step 4: Validate** with scenario "Sync stage metrics from Supabase"; log outcomes in `test-results/skills/pumptracker-data.md`.

**Step 5: Commit** with descriptive message.

### Task 3: Testing & Tooling Skill (Vitest/Playwright)

**Files:**
- Create: `docs/skills/testing/{index.md,requirements.md,validation.md}`
- Copy: `docs/testing.md`, Playwright README snippets, `package.json` scripts, build guidance
- Output: `skills/pumptracker-testing-skill.json`

**Steps 1-4:** repeat curation → brainstorming → skill generation → validation focusing on "run Playwright headlessly", "Vitest mocking" use cases. Store validation summary in `test-results/skills/pumptracker-testing.md`.

**Step 5:** Commit new docs and skill file.

### Task 4: Optional Composite Skill Prep (deferred)

After individual skills exist, create `docs/skills/full-stack/plan.md` outlining how to compose them. For now just add a TODO note in `docs/plans/maintenance/pumptracker-skill.md` referencing each artifact.

### Task 5: Monthly Maintenance Checklist

**Files:**
- Update/extend: `docs/plans/maintenance/pumptracker-skill.md`

Add a section listing each skill with steps: diff docs vs `docs/skills/<domain>`, rerun skill-creator if changed, redo validation scenario, log in `docs/skills/<domain>/CHANGELOG.md`.

Commit all maintenance docs once initial skills are in place.
