# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the React + TypeScript app (components, store, lib utilities, adapters).
- `tests/` holds Playwright E2E specs (see `tests/e2e`).
- `docs/` is the source of truth for architecture, development, testing, and constitution rules.
- `public/` contains static assets; `dist/` is build output.

## Build, Test, and Development Commands
- `pnpm install` installs dependencies (pnpm is required).
- `pnpm dev` starts Vite with hot reload.
- `pnpm build` runs `tsc -b` then builds the production bundle.
- `pnpm preview` serves the production build locally.
- `pnpm lint` runs ESLint; `pnpm format` runs Prettier.
- `pnpm test` runs Vitest unit/integration suites.
- `pnpm test:e2e` runs Playwright E2E tests (use `PLAYWRIGHT_TEST_BASE_URL=http://localhost:5173` when pointing at a running dev server).

## Implementation & Modular Design Philosophy
- Favor ruthless simplicity: solve today’s need directly, avoid future-proofing, minimize abstractions.
- Build in vertical slices so data flows end-to-end early; refine after core paths work.
- Prefer small, self-contained modules with stable interfaces (“bricks”) that can be regenerated without rippling changes.
- Treat external contracts as sacred: interfaces and boundaries stay stable even if internals change.
- Use libraries when they align cleanly; revert to custom code when the library becomes the constraint.

## Coding Style & Naming Conventions
- TypeScript + React function components; keep feature components in `src/components/<feature>` and shared UI in `src/components/ui`.
- Tailwind CSS for layout and utilities; reuse shared classes from `src/index.css` when styles repeat.
- Prefer Zustand selectors/actions in `src/store.ts` over ad-hoc component state.
- Use canonical stage constants and names defined in the Constitution and DDD blueprint; never reintroduce legacy stage strings.
- Keep modules focused and readable; if an abstraction doesn’t buy clarity, remove it.

## Testing Guidelines
- Vitest covers store logic, hooks, and helpers; add tests near the code or under `tests/components` as appropriate.
- Playwright covers end-to-end workflows; update E2E specs when UI flows change.
- Name tests clearly for the behavior (e.g., `scheduling-enhanced.spec.ts`).

## Commit & Pull Request Guidelines
- Follow Conventional Commits style seen in history: `feat:`, `test:`, `fix:`, `docs:` (include scope when useful).
- Keep PRs small and tightly scoped; prefer modular changes that can stand alone.
- PR description must link an issue/plan item when applicable, or state “no issue”.
- UI changes require before/after screenshots or a short GIF.
- Confirm Constitution compliance: Kanban truth is not mutated by calendar/projection, canonical stages enforced, and no legacy stage strings.
- Include test results in the PR; add/update tests for behavior changes (Vitest, Playwright for UI workflow changes).
- If localStorage/data shapes change, include migration notes and fixture updates.
- Update docs when rules/architecture change (Constitution + relevant implementation plan).

## Agent-Specific Notes
- Key references: `docs/development.md`, `docs/testing.md`, `DDD_BLUEPRINT-OPUS.md`,
  `master-agents/IMPLEMENTATION_PHILOSOPHY.md`, and `master-agents/MODULAR_DESIGN_PHILOSOPHY.md`.
