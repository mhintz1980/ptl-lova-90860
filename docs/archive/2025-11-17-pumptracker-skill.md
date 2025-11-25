# PumpTracker Documentation Skill Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Package PumpTracker documentation into a reusable Claude Skill so agents can consume the docs intelligently and avoid hallucinating APIs or workflows.

**Architecture:** Collect existing markdown docs into a dedicated corpus, run a structured brainstorming session to define activation/routing rules, then use the `skill-creator` workflow to build the skill file that ships with the repo and is validated against a sample dev request.

**Tech Stack:** Markdown docs in `docs/`, Codex CLI superpowers skills (`brainstorming`, `skill-creator`, `executing-plans`), Serena tooling, Claude Code with skills support.

### Task 1: Prepare Documentation Corpus

**Files:**
- Create: `docs/skills/pumptracker/index.md`
- Modify: `docs/README.md`, `docs/architecture.md`, `docs/deployment.md`, `docs/development-guide.md`, `docs/testing.md`
- Copy: `docs/archive/**` (select any still-relevant guides)

**Step 1: Create skills corpus folder**

```bash
mkdir -p docs/skills/pumptracker
```

**Step 2: Seed corpus with canonical docs**

```bash
cp docs/README.md docs/skills/pumptracker/overview.md
cp docs/architecture.md docs/skills/pumptracker/architecture.md
cp docs/deployment.md docs/skills/pumptracker/deployment.md
cp docs/development-guide.md docs/skills/pumptracker/development.md
cp docs/testing.md docs/skills/pumptracker/testing.md
```

Expected: All key docs exist within the skills folder for packaging.

**Step 3: Curate archive content**

Review files under `docs/archive/`; move still-relevant guides into `docs/skills/pumptracker/archive/` so they can be referenced.

```bash
mkdir -p docs/skills/pumptracker/archive
cp docs/archive/*.md docs/skills/pumptracker/archive/
```

**Step 4: Add index metadata**

Create `docs/skills/pumptracker/index.md` summarizing when to use each doc and tagging keywords (e.g., "supabase", "vite build").

```markdown
# PumpTracker Skill Index

- **overview.md** — general product context, env variables (keywords: product, env)
- **architecture.md** — React/Vite structure, data flow (keywords: react, zustand, supabase)
...
```

**Step 5: Commit**

```bash
git add docs/skills/pumptracker
git commit -m "chore: curate PumpTracker docs for skill packaging"
```

### Task 2: Brainstorm Skill Requirements

**Files:**
- Reference: `docs/skills/pumptracker/index.md`
- Notes: `.notes/claude-skills/pumptracker-requirements.md` (create)

**Step 1: Launch brainstorming skill**

```bash
~/.codex/superpowers/.codex/superpowers-codex use-skill superpowers:brainstorming
```

Use the prompt from `skill-concept.txt` adapted for PumpTracker:

```
I want to create a skill that reads the docs in this folder @docs/skills/pumptracker/...
```

**Step 2: Answer clarifying questions**

Respond in the required "1/a" format, ensuring activation strategy covers frontend keywords ("stages", "charts", "Supabase"). Capture Q&A in `.notes/claude-skills/pumptracker-requirements.md` for future updates.

**Step 3: Review generated requirements**

Ensure the brainstorming output defines:
- Trigger phrases and manual invocation name `pumptracker-skill`
- Routing rules for component docs vs deployment docs
- Response formatting expectations (link to files, include code snippets)

Export final requirements into `docs/skills/pumptracker/requirements.md`.

**Step 4: Commit**

```bash
git add .notes/claude-skills/pumptracker-requirements.md docs/skills/pumptracker/requirements.md
git commit -m "docs: capture PumpTracker skill requirements"
```

### Task 3: Generate the Claude Skill

**Files:**
- Output: `skills/pumptracker-skill.json` (or `.yaml` depending on superpowers tooling)
- Source: `docs/skills/pumptracker/**`

**Step 1: Invoke skill-creator**

```bash
~/.codex/superpowers/.codex/superpowers-codex use-skill skill-creator \
  --skill-name pumptracker-skill \
  --docs-path docs/skills/pumptracker
```

Follow prompts to define:
- Activation phrases ("pumptracker", "stage board", "supabase client")
- Routing priority (index → component-specific doc → examples)
- Fallback instructions (ask user which area to load)

**Step 2: Inspect generated skill file**

Open `skills/pumptracker-skill.json` and verify:
- Metadata `knowledge_sources` list every markdown file
- `routing_rules` map keywords to doc subsets
- `response_templates` include "Context" + "Implementation guidance" sections

**Step 3: Commit**

```bash
git add skills/pumptracker-skill.json
git commit -m "feat: add PumpTracker Claude skill"
```

### Task 4: Validate Skill in Claude Code

**Files:**
- Scenario doc: `docs/skills/pumptracker/validation.md`
- Logs: `test-results/skills/pumptracker-validation.md`

**Step 1: Draft validation scenario**

Create `docs/skills/pumptracker/validation.md` describing a representative request (e.g., "Build stage analytics chart with Supabase data"). Include expected files touched and APIs used.

**Step 2: Run Claude session**

In Claude Code, open the repo and issue:

```
Read @docs/skills/pumptracker/validation.md and use the pumptracker-skill to implement the feature skeleton.
```

Ensure Claude reports which docs it read. Capture transcript snippets showing correct file references.

**Step 3: Record validation results**

Summarize findings in `test-results/skills/pumptracker-validation.md` (docs consulted, correctness, follow-ups).

**Step 4: Commit**

```bash
git add docs/skills/pumptracker/validation.md test-results/skills/pumptracker-validation.md
git commit -m "test: validate PumpTracker Claude skill"
```

### Task 5: Maintenance Workflow

**Files:**
- `docs/skills/pumptracker/CHANGELOG.md`
- `docs/plans/maintenance/pumptracker-skill.md`

**Step 1: Document update cadence**

Create `docs/skills/pumptracker/CHANGELOG.md` with template entries:

```markdown
## 2025-12-01
- Added docs for new chart module
```

**Step 2: Schedule monthly review**

Add checklist `docs/plans/maintenance/pumptracker-skill.md` describing how to diff docs and rebuild the skill when dependencies change (Supabase SDK updates, new UI components).

**Step 3: Commit final artifacts**

```bash
git add docs/skills/pumptracker/CHANGELOG.md docs/plans/maintenance/pumptracker-skill.md
git commit -m "docs: add PumpTracker skill maintenance plan"
```
