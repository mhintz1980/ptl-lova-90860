# Complete Repository Snapshot - PTL-LOVA

This file contains essential parts of the repository to give Gemini Gems full context.

---

## PROJECT STRUCTURE

```
ptl-lova/
├── src/
│   ├── components/          # React components
│   ├── lib/                # Utility libraries
│   ├── data/               # Data files
│   ├── adapters/           # Data layer abstraction
│   ├── types.ts           # Core type definitions
│   ├── store.ts           # Zustand state management
│   └── App.tsx            # Main application
├── docs/                  # Documentation
├── tests/                 # Test files
├── package.json           # Dependencies and scripts
└── tsconfig.json         # TypeScript config
```

## KEY FILES CONTENT

---

### package.json
```json
{
  "name": "pumptracker-lite",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "build:dev": "vite build --mode development",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:codegen": "playwright codegen",
    "test:e2e:install": "playwright install",
    "test:e2e:report": "playwright show-report"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/modifiers": "^9.0.0",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@radix-ui/react-progress": "^1.1.8",
    "@radix-ui/react-scroll-area": "^1.2.10",
    "@radix-ui/react-slot": "^1.2.4",
    "@supabase/supabase-js": "^2.81.1",
    "@tanstack/react-table": "^8.21.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "framer-motion": "^12.23.24",
    "lucide-react": "^0.545.0",
    "nanoid": "^5.1.6",
    "papaparse": "^5.5.3",
    "playwright": "^1.56.1",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.9.6",
    "recharts": "^3.4.1",
    "sonner": "^2.0.7",
    "stall": "^0.0.2",
    "tailwind-merge": "^3.4.0",
    "tailwindcss-animate": "^1.0.7",
    "zustand": "^5.0.8"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "@playwright/test": "^1.56.1",
    "@testing-library/react": "^16.3.0",
    "@types/node": "^24.10.1",
    "@types/papaparse": "^5.5.0",
    "@types/react": "^19.2.5",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "autoprefixer": "^10.4.22",
    "eslint": "^9.39.1",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.24",
    "globals": "^16.5.0",
    "jsdom": "^27.2.0",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.18",
    "typescript": "~5.9.3",
    "typescript-eslint": "^8.46.4",
    "vite": "^7.2.2",
    "vitest": "^4.0.9"
  }
}
```

---

### src/types.ts (Already covered in context file, but included for completeness)

```typescript
// Core types from the context file - included for repository completeness
export const STAGES = [
  "QUEUE", "FABRICATION", "POWDER COAT", "ASSEMBLY", "TESTING", "SHIPPING", "CLOSED"
] as const;

export type Stage = typeof STAGES[number];
export type Priority = "Low" | "Normal" | "High" | "Rush" | "Urgent";

export interface Pump {
  id: string;              // uuid
  serial: number;          // 4-digit unique
  po: string;
  customer: string;
  model: string;
  stage: Stage;
  priority: Priority;
  powder_color?: string;
  last_update: string;     // ISO
  value: number;           // numeric
  scheduledEnd?: string;   // ISO
  scheduledStart?: string; // ISO
  // derived, non-persistent:
  promiseDate?: string;    // from PO line
  work_hours?: {
    fabrication: number;
    assembly: number;
    testing: number;
    shipping: number;
  };
}

export interface PoLine {
  model: string;
  quantity: number;
  color?: string;
  promiseDate?: string; // ISO
  valueEach?: number;
  priority?: Priority;
}

export interface AddPoPayload {
  po: string;
  customer: string;
  dateReceived?: string;
  promiseDate?: string;
  lines: PoLine[];
}

// ... other types from context file
```

---

### src/lib/seed.ts - Data Generation and Catalog

```typescript
// Core pump models and configurations
export const PUMP_MODELS = [
  {
    model: "DD-4S",
    description: "4\" Double Diaphragm",
    price: 20000,
    bom: { engine: "HATZ 1B50E", gearbox: "RENOLD WM6", control_panel: "DSEE050" },
    lead_times: { fabrication: 1.5, powder_coat: 7, assembly: 1, testing: 0.25, total_days: 9.75 },
    work_hours: { fabrication: 12, assembly: 8, testing: 2, shipping: 2 }
  },
  {
    model: "DD-4S SAFE",
    description: "4\" Double Diaphragm (Enclosed)",
    price: 25000,
    bom: { engine: "HATZ 1B50E", gearbox: "RENOLD WM6", control_panel: "DSEE050" },
    lead_times: { fabrication: 1.5, powder_coat: 7, assembly: 1, testing: 0.25, total_days: 9.75 },
    work_hours: { fabrication: 16, assembly: 12, testing: 2, shipping: 2 }
  },
  {
    model: "DD-6",
    description: "6\" Double Diaphragm",
    price: 24000,
    bom: { engine: "HATZ 1D90E", gearbox: "RENOLD WM6", control_panel: "DSEE050" },
    lead_times: { fabrication: 1.5, powder_coat: 7, assembly: 1, testing: 0.25, total_days: 9.75 },
    work_hours: { fabrication: 14, assembly: 10, testing: 2, shipping: 2 }
  },
  // ... other models
];

export const getModelLeadTimes = (model: string) => {
  return PUMP_MODELS.find(m => m.model === model)?.lead_times;
};

// Sample data generation functions
export const generateSamplePumps = (count: number): Pump[] => {
  // Implementation for generating test data
};
```

---

### src/lib/utils.ts - Utility Functions

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Serial number generation
export function genSerial(existingPumps: Pump[]): number {
  const usedSerials = existingPumps.map(p => p.serial);
  let serial = 1000; // Start from 1000
  while (usedSerials.includes(serial)) {
    serial++;
  }
  return serial;
}

// Filter utilities
export function applyFilters(pumps: Pump[], filters: Filters): Pump[] {
  return pumps.filter(pump => {
    // PO filter
    if (filters.po && !pump.po.toLowerCase().includes(filters.po.toLowerCase())) {
      return false;
    }
    // Customer filter
    if (filters.customer && !pump.customer.toLowerCase().includes(filters.customer.toLowerCase())) {
      return false;
    }
    // Model filter
    if (filters.model && pump.model !== filters.model) {
      return false;
    }
    // Stage filter
    if (filters.stage && pump.stage !== filters.stage) {
      return false;
    }
    // Priority filter
    if (filters.priority && pump.priority !== filters.priority) {
      return false;
    }
    // Search query
    if (filters.q) {
      const query = filters.q.toLowerCase();
      const searchableText = `${pump.po} ${pump.customer} ${pump.model} ${pump.serial}`.toLowerCase();
      if (!searchableText.includes(query)) {
        return false;
      }
    }
    return true;
  });
}
```

---

### src/lib/capacity.ts - Manufacturing Capacity Management

```typescript
import { CapacityConfig, DepartmentStaffing, PowderCoatVendor, Pump } from "../types";

export const DEFAULT_CAPACITY_CONFIG: CapacityConfig = {
  fabrication: {
    employeeCount: 4,
    workDayHours: {
      monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8, saturday: 0, sunday: 0
    },
    efficiency: 0.85,
    dailyManHours: 27.2 // 4 * 8 * 0.85
  },
  assembly: {
    employeeCount: 3,
    workDayHours: {
      monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8, saturday: 0, sunday: 0
    },
    efficiency: 0.85,
    dailyManHours: 20.4 // 3 * 8 * 0.85
  },
  testing: {
    employeeCount: 2,
    workDayHours: {
      monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8, saturday: 0, sunday: 0
    },
    efficiency: 0.85,
    dailyManHours: 13.6 // 2 * 8 * 0.85
  },
  shipping: {
    employeeCount: 2,
    workDayHours: {
      monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8, saturday: 0, sunday: 0
    },
    efficiency: 0.85,
    dailyManHours: 13.6 // 2 * 8 * 0.85
  },
  powderCoat: {
    vendors: [
      { id: "vendor1", name: "Powder Coater#1", maxPumpsPerWeek: 20 },
      { id: "vendor2", name: "Powder Coater#2", maxPumpsPerWeek: 15 },
      { id: "vendor3", name: "Powder Coater#3", maxPumpsPerWeek: 25 }
    ]
  }
};

export const getStageCapacity = (stage: keyof Omit<CapacityConfig, 'powderCoat'>, config: CapacityConfig, baseDaysPerPump: number): number => {
  const dept = config[stage];
  const weeklyHours = dept.dailyManHours * 5; // 5 day work week
  const hoursPerPump = baseDaysPerPump * 8; // 8 hours per day
  return Math.max(1, Math.floor(weeklyHours / hoursPerPump));
};
```

---

### src/lib/schedule.ts - Manufacturing Scheduling Logic

```typescript
import { Pump, Stage, CapacityConfig, StageDurations, StageBlock } from "../types";
import { addDays, startOfDay, differenceInBusinessDays } from "date-fns";

export interface StageBlock {
  stage: Stage;
  start: Date;
  end: Date;
  duration: number; // days
  capacity: number;
  vendor?: string; // for external stages like powder coat
}

export const buildStageTimeline = (
  pump: Pump,
  leadTimes: StageDurations,
  options: {
    startDate: Date;
    capacityConfig: CapacityConfig;
  }
): StageBlock[] => {
  const { startDate, capacityConfig } = options;
  const timeline: StageBlock[] = [];
  let currentDate = startDate;

  // Skip QUEUE stage for timeline calculation
  const stagesToSchedule: Stage[] = ["FABRICATION", "POWDER COAT", "ASSEMBLY", "TESTING", "SHIPPING"];

  for (const stage of stagesToSchedule) {
    const stageLeadTime = leadTimes[stage.toLowerCase()];
    if (!stageLeadTime) continue;

    let vendor: string | undefined;
    if (stage === "POWDER COAT") {
      // Assign to vendor based on current load
      const vendors = capacityConfig.powderCoat.vendors;
      vendor = assignToVendor(vendors);
    }

    const stageEnd = addDays(currentDate, stageLeadTime);

    timeline.push({
      stage,
      start: currentDate,
      end: stageEnd,
      duration: stageLeadTime,
      capacity: getStageCapacity(stage, capacityConfig, stageLeadTime),
      vendor
    });

    currentDate = stageEnd;
  }

  return timeline;
};

const assignToVendor = (vendors: PowderCoatVendor[]): string => {
  // Simple round-robin assignment - could be made more sophisticated
  const randomIndex = Math.floor(Math.random() * vendors.length);
  return vendors[randomIndex].name;
};
```

---

### src/adapters/local.ts - Local Storage Data Adapter

```typescript
import { Pump, DataAdapter } from "../types";

export const LocalAdapter: DataAdapter = {
  load: async (): Promise<Pump[]> => {
    const stored = localStorage.getItem("pumptracker-data");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error("Error parsing stored data:", error);
        return [];
      }
    }
    return [];
  },

  replaceAll: async (rows: Pump[]): Promise<void> => {
    localStorage.setItem("pumptracker-data", JSON.stringify(rows));
  },

  upsertMany: async (rows: Pump[]): Promise<void> => {
    const existing = await LocalAdapter.load();
    const existingIds = new Set(existing.map(p => p.id));

    const newRows = rows.filter(r => !existingIds.has(r.id));
    const updated = existing.map(p => {
      const update = rows.find(r => r.id === p.id);
      return update || p;
    });

    const allRows = [...updated, ...newRows];
    localStorage.setItem("pumptracker-data", JSON.stringify(allRows));
  },

  update: async (id: string, patch: Partial<Pump>): Promise<void> => {
    const existing = await LocalAdapter.load();
    const updated = existing.map(p =>
      p.id === id ? { ...p, ...patch } : p
    );
    localStorage.setItem("pumptracker-data", JSON.stringify(updated));
  }
};
```

---

### src/components/dashboard/DashboardEngine.tsx - Main Dashboard Component

```typescript
import React from "react";
import { useApp } from "../../store";
import { Pump, Stage } from "../../types";
import { PumpCardGrid } from "./charts/PumpCardGrid";
import { TreemapChart } from "./charts/TreemapChart";
import { ModelBarChart } from "./charts/ModelBarChart";
import { RadialBarChart } from "./charts/RadialBarChart";
import { ValueByModelChart } from "./charts/ValueByModelChart";

export const DashboardEngine: React.FC = () => {
  const filtered = useApp((state) => state.filtered());
  const pumps = filtered();

  const stageDistribution = pumps.reduce((acc, pump) => {
    acc[pump.stage] = (acc[pump.stage] || 0) + 1;
    return acc;
  }, {} as Record<Stage, number>);

  const totalValue = pumps.reduce((sum, pump) => sum + pump.value, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Pumps</h3>
          <p className="text-2xl font-bold text-gray-900">{pumps.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Value</h3>
          <p className="text-2xl font-bold text-gray-900">${totalValue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">In Production</h3>
          <p className="text-2xl font-bold text-gray-900">
            {pumps.filter(p => p.stage !== "QUEUE" && p.stage !== "CLOSED").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Shipped</h3>
          <p className="text-2xl font-bold text-gray-900">
            {pumps.filter(p => p.stage === "CLOSED").length}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TreemapChart data={pumps} />
        <ModelBarChart data={pumps} />
        <RadialBarChart data={stageDistribution} />
        <ValueByModelChart data={pumps} />
      </div>

      {/* Detailed Pump Grid */}
      <PumpCardGrid pumps={pumps} />
    </div>
  );
};
```

---

### src/components/kanban/StageColumn.tsx - Kanban Board Component

```typescript
import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Stage, Pump } from "../../types";
import { PumpCard } from "./PumpCard";

interface StageColumnProps {
  stage: Stage;
  pumps: Pump[];
  wipLimit?: number;
  collapsed?: boolean;
}

export const StageColumn: React.FC<StageColumnProps> = ({
  stage,
  pumps,
  wipLimit,
  collapsed
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  const isOverLimit = wipLimit && pumps.length >= wipLimit;

  if (collapsed) {
    return (
      <div className="bg-gray-100 rounded-lg p-4">
        <h3 className="font-semibold text-gray-700">{stage}</h3>
        <p className="text-sm text-gray-500">{pumps.length} items</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-900">{stage}</h3>
        {wipLimit && (
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-sm ${isOverLimit ? 'text-red-600' : 'text-gray-500'}`}>
              {pumps.length} / {wipLimit}
            </span>
            {isOverLimit && <span className="text-xs text-red-600 font-medium">WIP Limit Exceeded</span>}
          </div>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={`p-4 min-h-[200px] transition-colors ${
          isOver ? 'bg-blue-50' : ''
        }`}
      >
        <SortableContext items={pumps.map(p => p.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {pumps.map((pump) => (
              <PumpCard key={pump.id} pump={pump} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};
```

---

### CONFIGURATION FILES

### vite.config.ts
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
  },
});
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## DEVELOPMENT WORKFLOW

### Available Scripts
```bash
npm run dev          # Development server (http://localhost:3000)
npm run build        # Production build
npm run test         # Unit tests with Vitest
npm run test:e2e     # End-to-end tests with Playwright
npm run lint          # ESLint
npm run preview       # Preview production build
```

### File Loading Priority for Gemini Gem

**Primary Files (Load First):**
1. `PROJECT_CONTEXT_FOR_GEMINI.md` - Complete project context
2. `COMPLETE_REPO_SNAPSHOT.md` - This file - essential code and configs

**Secondary Files (Reference as Needed):**
- `src/components/dashboard/DashboardEngine.tsx` - Dashboard implementation
- `src/components/kanban/StageColumn.tsx` - Kanban implementation
- `src/lib/schedule.ts` - Manufacturing scheduling logic
- `src/lib/capacity.ts` - Capacity management
- `src/adapters/local.ts` - Data persistence layer
- `src/data/pumptracker-data.json` - Model catalog and configurations

**Configuration Files (For Setup):**
- `package.json` - Dependencies and build configuration
- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript configuration

---

## TESTING SETUP

### Unit Tests (Vitest)
- Located in `src/lib/*.test.ts`
- Focus on business logic and utility functions
- Run with `npm run test`

### E2E Tests (Playwright)
- Located in `tests/e2e/`
- Full application flow testing
- Run with `npm run test:e2e`

### Test Configuration
```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
```

---

## DATA MODELS REFERENCE

### Current Pump Lifecycle
1. **QUEUE** - Entry point, waiting to be scheduled
2. **FABRICATION** - Manufacturing stage (internal)
3. **POWDER COAT** - External vendor stage
4. **ASSEMBLY** - Final assembly (internal)
5. **TESTING** - Quality control (internal)
6. **SHIPPING** - Dispatch preparation
7. **CLOSED** - Completed/shipped

### Key Data Relationships
- **PO → Pump**: One-to-many relationship
- **Pump → Serial**: Unique 4-digit identifier
- **Stage → Duration**: Model-specific lead times
- **Vendor → Capacity**: External vendor limitations

### State Management Pattern
- **Zustand** for global state
- **Persisted** to localStorage
- **Adapter pattern** for data layer abstraction
- **Real-time updates** on all state changes

---

This snapshot provides your Gemini Gem with complete understanding of:
- Full application architecture
- Component structure and patterns
- Data models and business logic
- Development workflow and configuration
- Testing setup and patterns

The Gem can reference specific files and implementations when needed for detailed analysis or implementation guidance.