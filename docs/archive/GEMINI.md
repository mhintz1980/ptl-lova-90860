# Project: PumpTracker Lite

## Project Overview

This project is a modern, responsive production management system for tracking pump manufacturing orders. It's a lightweight yet powerful web application designed to help manufacturing teams manage pump production orders efficiently. It provides real-time visibility into production status, KPI tracking, and intuitive drag-and-drop Kanban board management.

The application is built with React and TypeScript, using Vite as a build tool. Styling is done with Tailwind CSS, and state management is handled by Zustand. Data visualization is implemented with Recharts.

The project is structured with a clear separation of concerns, with components organized by feature (dashboard, kanban, toolbar, ui), and a `lib` directory for utilities and a `store.ts` for state management.

## Building and Running

### Prerequisites

*   Node.js 18+
*   pnpm (or npm/yarn)

### Development

To run the development server:

```bash
pnpm dev
```

### Build

To build the project for production:

```bash
pnpm build
```

The production-ready files will be in the `dist/` directory.

### Linting

To run the linter:

```bash
pnpm lint
```

## Development Conventions

*   **Styling**: The project uses Tailwind CSS for styling. Custom UI components are located in `src/components/ui`.
*   **State Management**: Global state is managed with Zustand. The store is defined in `src/store.ts`.
*   **Path Aliases**: The project uses a path alias `@` which maps to the `src` directory.
*   **Components**: Components are organized by feature under the `src/components` directory.
*   **Types**: TypeScript types are defined in `src/types.ts`.
