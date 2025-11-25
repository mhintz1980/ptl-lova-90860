---
title: "PumpTracker Lite"
doc_type: "project_readme"
app_name: "PumpTracker Lite"
version: "1.0.0"
status: "active"
entrypoint: true
related_docs:
  - "Architecture Overview"
  - "PumpTracker Lite – Development Guide"
  - "PumpTracker Lite – Testing Guide"
  - "PumpTracker Lite – Deployment Guide"
---

# PumpTracker Lite
 
A modern, responsive production management system for tracking pump manufacturing orders through their complete lifecycle. Built with React, TypeScript, Tailwind CSS, and Recharts for data visualization.

## 🎯 Overview

PumpTracker Lite is a lightweight yet powerful web application designed to help manufacturing teams manage pump production orders efficiently. It provides real-time visibility into production status, KPI tracking, and intuitive drag-and-drop Kanban board management.

## 📚 Documentation

All project documents now live under [`docs/`](docs/README.md). Most docs include **YAML front matter** so both humans and coding agents can understand their type and relationships.

Key starting points:

- [`docs/architecture.md`](docs/architecture.md) – UI surfaces, data flow, and state responsibilities.
- [`docs/development-guide.md`](docs/development-guide.md) – setup, workflow, and coding conventions.
- [`docs/testing.md`](docs/testing.md) – Vitest/Playwright instructions, including how to verify the scheduling legend filters.
- [`docs/deployment.md`](docs/deployment.md) – updated hosting guidance.

Historical context and older migration notes were moved to [`docs/archive/`](docs/archive/).

## ✨ Features

### Dashboard View
- **KPI Strip**: Real-time metrics including average build time, shop efficiency, on-time orders, and late orders
- **Workload Distribution**: Donut charts showing workload breakdown by customer and pump model
- **Build Time Trend**: Area chart tracking average build times over the past 12 weeks
- **Value Breakdown**: Pie charts displaying order value distribution by customer and model
- **Order Details Table**: Comprehensive sortable table with all pump order information

### Kanban Board View
- **8-Stage Production Pipeline**: UNSCHEDULED → NOT STARTED → FABRICATION → POWDER COAT → ASSEMBLY → TESTING → SHIPPING → CLOSED
- **Drag-and-Drop Interface**: Move pumps between stages with intuitive drag-and-drop functionality
- **Smart Card Display**: Each pump card shows essential information including:
  - Model and Serial Number
  - PO Number and Customer
  - Order Value
  - Scheduled End Date
  - Priority Badge (Low, Normal, High, Rush, Urgent)
  - Color-Coded Priority Indicators

### Scheduling View
- **Unscheduled Queue**: Sidebar showing all pumps in "UNSCHEDULED" stage ready for scheduling
- **Drag-and-Drop Calendar**: Intuitive 4-week calendar grid where pumps can be dropped to assign dates
- **Automatic Stage Progression**: When a pump is scheduled, it automatically moves from "UNSCHEDULED" to "NOT STARTED"
- **Smart Scheduling**: Uses model-specific lead times to calculate optimal start and end dates
- **Calendar Event Display**: Scheduled pumps appear as color-coded events on the calendar with stage metadata
- **Empty State Management**: Helpful messaging when all pumps are scheduled with navigation to upcoming work

### Filtering & Search
- **Multi-Criteria Filtering**: Filter by PO, Customer, Model, Priority, and Stage
- **Full-Text Search**: Search across all pump data
- **Quick Clear**: Reset all filters with one click

### Data Management
- **Add PO Modal**: Create new purchase orders with multi-line item support
- **Bulk CSV Import**: Upload pump data from CSV files
- **Local Storage**: Automatic data persistence in browser
- **Mock Data**: Pre-populated with 80 realistic pump orders for demonstration

## 🏗️ Architecture

### Technology Stack
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 3.4 with custom design tokens
- **State Management**: Zustand
- **Data Visualization**: Recharts
- **Drag & Drop**: @dnd-kit (sortable)
- **UI Components**: Custom components following 21st.dev/magic design standards
- **Icons**: Lucide React
- **Notifications**: Sonner (toast notifications)
- **CSV Parsing**: PapaParse

### Project Structure
```text
src/
├── components/
│   ├── dashboard/          # Dashboard-specific components
│   │   ├── KpiStrip.tsx   # KPI metrics display
│   │   ├── Donuts.tsx     # Workload distribution charts
│   │   ├── BuildTimeTrend.tsx  # Build time trend chart
│   │   ├── ValueBreakdown.tsx  # Value distribution charts
│   │   └── OrderTable.tsx  # Order details table
│   ├── kanban/             # Kanban board components
│   │   ├── KanbanBoard.tsx # Main kanban container
│   │   ├── StageColumn.tsx # Individual stage column
│   │   └── PumpCard.tsx    # Pump card with drag support
│   ├── toolbar/            # Filter and action components
│   │   ├── FilterBar.tsx   # Filter controls
│   │   ├── AddPoButton.tsx # Add PO button
│   │   └── AddPoModal.tsx  # Add PO form modal
│   └── ui/                 # Reusable UI components
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       └── Badge.tsx
├── lib/
│   ├── format.ts           # Formatting utilities
│   ├── seed.ts             # Mock data generation
│   ├── csv.ts              # CSV import functionality
│   ├── utils.ts            # Class name utilities
│   └── theme.ts            # Design tokens
├── adapters/
│   ├── local.ts            # Local storage adapter
│   └── supabase.ts         # Supabase integration (optional)
├── types.ts                # TypeScript type definitions
├── store.ts                # Zustand store
├── App.tsx                 # Main application component
├── main.tsx                # Entry point
└── index.css               # Global styles
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (or npm/yarn)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pumptracker-lite
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start the development server**
   ```bash
   pnpm dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5173/`

### Build for Production

```bash
pnpm build
```

The production-ready files will be in the `dist/` directory.

#### Bundle chunking strategy

To keep Rollup from emitting a single ~800kB vendor bundle (which triggered the default 500kB chunk-size warning), the Vite config now defines `build.rollupOptions.output.manualChunks`. During `pnpm build` or `pnpm run build:dev`, dependencies in `node_modules` are routed into purpose-specific chunks:

- `react` – React runtime, React DOM, and JSX helpers
- `charts` – Recharts + date-fns formatting helpers
- `dnd` – all `@dnd-kit/*` drag-and-drop packages
- `ui` – Lucide icons, Sonner toasts, and Radix primitives
- `table` – TanStack table utilities
- `supabase` – Supabase client (tree-shaken when unused)
- `vendor` – fallback for any other third-party modules

This keeps the largest chunk under ~275 kB in development builds and removes the chunk-size warning without changing application code-splitting behavior. Adjust or extend the groups in `vite.config.ts` if new dependency clusters grow too large.

## 📊 Key Metrics Explained

### Average Build Time
The mean number of days between order creation and completion for all closed orders.

### Shop Efficiency
The percentage of orders completed on or before their scheduled end date.

### On-Time Orders
The count of orders that were completed by their scheduled end date.

### Late Orders
The count of orders that were completed after their scheduled end date.

## 🎨 Design System

### Color Palette
- **Primary**: Blue (#2563eb)
- **Success**: Green (#16a34a)
- **Warning**: Yellow (#ca8a04)
- **Error**: Red (#dc2626)
- **Neutral**: Gray scale for backgrounds and text

### Priority Color Coding
- **Urgent**: Red border and background
- **Rush**: Orange border and background
- **High**: Yellow border and background
- **Normal**: Blue border and background
- **Low**: Gray border and background

## 🔄 State Management

The application uses **Zustand** for state management. The main store manages:

- Pump Data: All pump orders and their state
- Filters: Active filter selections
- UI State: Collapsed stages, selected pump details
- Data Persistence: Automatic save/load from local storage

## 📈 Data Visualization

The application uses Recharts for interactive charts including:

- Donut Charts: Workload and value distribution
- Area Chart: Build time trends over time
- Pie Charts: Detailed value breakdowns

All charts are responsive and include tooltips, legends, and custom styling.

## ♿ Accessibility

The application follows WCAG 2.1 guidelines:
- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Color contrast compliance
- Focus indicators for keyboard users

## 📱 Responsive Design

The application is fully responsive and tested on:
- Desktop (1920px, 1440px, 1024px)
- Tablet (768px, 810px)
- Mobile (375px, 414px)

## 🚀 Future Enhancements

- Real-time collaboration with WebSockets
- Advanced reporting and analytics
- User authentication and role-based access
- Email notifications for order updates
- Mobile app with offline support
- API integration with ERP systems
- Advanced scheduling with resource constraints
- Historical data and audit logs

## 📄 License

This project is proprietary software. All rights reserved.

---

**Version**: 1.0.0  
**Last Updated**: October 24, 2025  
**Built with**: React + TypeScript + Tailwind CSS
