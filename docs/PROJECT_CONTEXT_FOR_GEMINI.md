# PTL-LOVA Project Context - Manufacturing Pump Tracking System

## Project Overview
**Current State**: React/TypeScript pump tracking dashboard with calendar scheduling and kanban board
**Goal**: Refactor to implement double-entry ledger architecture for complete auditability
**Domain**: Manufacturing tracking, inventory management, and business intelligence

**Project Type**: Brownfield refactoring (enhancing existing codebase)
**Development Track**: BMad Method (full planning with PRD + UX + Architecture)

---

## Critical Business Requirements

### Core Problem Statement
The current system tracks pumps through manufacturing stages but lacks comprehensive audit capabilities needed for business intelligence and regulatory compliance.

### Key Business Questions to Answer
1. **Customer Analytics**: "How many of the DD6_SAFE did we ship to United Rentals in August and how many were against PO#1234?"
2. **Vendor Performance**: "How many pumps did we send to 'Powder Coater#3' this month and what was the average time in that stage?"
3. **Forecasting**: "What will our total shipped units be for this quarter if we stay on the current schedule?"

### Required Double-Entry Ledger Features
- **Complete Audit Trail**: Every pump movement logged with timestamps
- **PO Line Item Tracking**: Link every pump to specific PO# and Line Item#
- **Serial Number Traceability**: Unique 4-digit serial for every pump
- **Stage Transition History**: Full lifecycle from QUEUE through FABRICATION → POWDER COAT → ASSEMBLY → TESTING → SHIPPING → CLOSED
- **Historical Data Access**: Query any pump/PO combination from any time period
- **Pump Details Modal**: Comprehensive information repository linked to audit trail

### Data Points to Track
- Purchase Order # (essential)
- Line Item # (essential)
- Serial # (4-digit unique, essential)
- Every stage transition with timestamp
- Vendor assignments (e.g., "Powder Coater#3")
- Customer information
- Model specifications and configurations
- Quality control data
- Shipping information

---

## Current Technical Architecture

### Technology Stack
- **Frontend**: React 19.2.0, TypeScript
- **State Management**: Zustand (persisted to localStorage)
- **Styling**: TailwindCSS with Radix UI components
- **Charts**: Recharts for dashboard analytics
- **Date Handling**: date-fns
- **Drag & Drop**: @dnd-kit for kanban functionality
- **Testing**: Vitest + Playwright for E2E
- **Build**: Vite

### Current Data Models

#### Core Pump Entity
```typescript
interface Pump {
  id: string;              // uuid
  serial: number;          // 4-digit unique
  po: string;              // Purchase Order
  customer: string;
  model: string;           // DD-4S, DD-6, DV-6, DD-8, etc.
  stage: Stage;            // Current stage
  priority: Priority;     // Low/Normal/High/Rush/Urgent
  powder_color?: string;
  last_update: string;     // ISO timestamp
  value: number;           // numeric value
  scheduledEnd?: string;   // ISO
  scheduledStart?: string; // ISO
  promiseDate?: string;    // from PO line
}
```

#### Manufacturing Stages
```typescript
const STAGES = [
  "QUEUE",        // Entry point
  "FABRICATION",  // Manufacturing
  "POWDER COAT",  // External vendor
  "ASSEMBLY",     // Final assembly
  "TESTING",      // Quality control
  "SHIPPING",     // Dispatch
  "CLOSED"        // Completed
] as const;
```

#### Current Capacity Model
```typescript
interface CapacityConfig {
  fabrication: DepartmentStaffing;    // Internal capacity
  assembly: DepartmentStaffing;       // Internal capacity
  testing: DepartmentStaffing;         // Internal capacity
  shipping: DepartmentStaffing;        // Internal capacity
  powderCoat: {                        // External vendors
    vendors: PowderCoatVendor[];
  };
}
```

### Current State Management
- **Store**: Zustand with persistence
- **Adapters**: Pluggable data layer (Local/Sandbox)
- **Real-time Updates**: Immediate UI updates on all changes
- **Scheduling**: Auto-scheduling with capacity constraints
- **Filtering**: Comprehensive filtering by PO, customer, model, stage, priority

### Key Components Structure
```
src/components/
├── dashboard/           # Analytics and charts
│   ├── charts/         # Various chart components
│   └── DashboardEngine.tsx
├── kanban/             # Stage-based kanban board
│   └── StageColumn.tsx
├── scheduling/         # Calendar scheduling
│   ├── CalendarEvent.tsx
│   └── MainCalendarGrid.tsx
├── ui/                 # Reusable UI components
│   ├── PumpDetailModal.tsx    # Current pump details
│   ├── SettingsModal.tsx
│   └── MilestoneManager.tsx
```

### Current Data Flow
1. **PO Entry**: Users enter PO with line items → creates Pump records
2. **Stage Management**: Drag-and-drop kanban for stage transitions
3. **Scheduling**: Calendar view for capacity planning
4. **Dashboard**: Analytics and reporting

---

## Pump Models Catalog (Current)

### DD-4S Series (4" Diaphragm)
- **DD-4S**: $20,000, 9.75 days total
- **DD-4S SAFE**: $25,000, 9.75 days (enclosed version)

### DD-6 Series (6" Diaphragm)
- **DD-6**: $24,000, 9.75 days
- **DD-6 SAFE**: $30,000, 10.0 days (enclosed version)

### DV-6 (6" Vacuum Assisted)
- **DV-6**: $29,000, 10.0 days

### DD-8 (8" Diaphragm)
- **DD-8**: $38,000, 11.25 days

### Manufacturing Lead Times
- **Fabrication**: 1.5-2 days (internal)
- **Powder Coat**: 7 days (external vendor)
- **Assembly**: 1-2 days (internal)
- **Testing**: 0.25 days (internal)
- **Shipping**: 2-3 days (internal)

---

## Current Limitations & Refactoring Goals

### Missing Audit Capabilities
1. **No Historical Tracking**: Only current stage stored
2. **No Line Item Tracking**: PO level only
3. **No Vendor Assignment History**: Can't track which vendor handled specific jobs
4. **No Complete Lifecycle**: Missing intermediate timestamps
5. **Limited Business Intelligence**: Can't answer complex queries about historical performance

### Required Architecture Changes

#### Double-Entry Ledger Pattern
```typescript
// Needed: Transaction-based audit system
interface PumpTransaction {
  id: string;
  pumpId: string;
  transactionType: 'STAGE_CHANGE' | 'ASSIGNMENT' | 'QUALITY_CHECK' | 'MODIFICATION';
  timestamp: string;
  fromStage?: Stage;
  toStage?: Stage;
  assignedTo?: string;        // Vendor/employee
  poNumber: string;
  lineItemNumber: number;
  serialNumber: number;
  metadata: Record<string, any>;
}
```

#### Enhanced Pump Entity
```typescript
interface EnhancedPump extends Pump {
  lineItemNumber: number;      // NEW: Track specific line item
  currentVendor?: string;      // NEW: Current assigned vendor
  qualityStatus?: string;      // NEW: Quality control status
  shipmentInfo?: ShipmentInfo; // NEW: Shipping details
  fullHistory: PumpTransaction[]; // NEW: Complete audit trail
}
```

### Database Requirements
- **Transactions Table**: Immutable audit log
- **Pumps Table**: Current state (denormalized for performance)
- **POs Table**: Purchase order master data
- **LineItems Table**: PO line item details
- **Vendors Table**: External vendor information
- **Indexes**: Optimized for time-series and business intelligence queries

---

## Implementation Constraints

### Must Preserve
1. **Current UI/UX**: Maintain intuitive drag-and-drop interface
2. **Performance**: Real-time updates and responsive interface
3. **Existing Features**: Calendar scheduling, capacity planning, dashboard
4. **Data Migration**: Seamless upgrade from current data structure

### Technical Challenges
1. **Data Model Migration**: Transform current flat structure to audit ledger
2. **Query Performance**: Complex historical queries must remain fast
3. **Offline Capability**: Current localStorage persistence strategy
4. **Real-time Synchronization**: Multiple users/sessions

---

## Success Criteria

### Functional Requirements
- ✅ Complete pump lifecycle audit trail
- ✅ PO line item level tracking
- ✅ Historical data queries (any time period)
- ✅ Vendor performance analytics
- ✅ Customer shipment reporting
- ✅ Predictive forecasting based on current schedules
- ✅ Compliance-ready audit reports

### Technical Requirements
- ✅ Maintain current performance levels
- ✅ Preserve existing UI/UX paradigms
- ✅ Backward compatibility for data import
- ✅ Real-time updates across all views
- ✅ Mobile-responsive interface

### Business Intelligence Capabilities
- **Time-based Analysis**: Stage duration trends, vendor performance
- **Customer Analytics**: Shipment volumes, PO compliance
- **Forecasting**: Predictive models based on historical data
- **Vendor Management**: Performance metrics, capacity planning
- **Quality Tracking**: Defect rates, rework patterns

---

## Development Environment Setup

### Local Development
```bash
npm run dev          # Development server
npm run test         # Unit tests
npm run test:e2e     # End-to-end tests
npm run build        # Production build
```

### Key Configuration Files
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Build configuration
- `tailwind.config.js` - Styling configuration

### Data Sources
- `src/data/pumptracker-data.json` - Model catalog and configurations
- `src/lib/seed.ts` - Default data generation
- `src/adapters/` - Data layer abstraction

---

## Next Development Steps

### Phase 1: Analysis & Documentation
1. Document current codebase architecture
2. Define new data models for audit ledger
3. Plan data migration strategy

### Phase 2: Architecture Design
1. Design double-entry ledger schema
2. Plan API layer for historical queries
3. Define migration path from current structure

### Phase 3: Implementation Planning
1. Break down into epics and user stories
2. Plan feature rollout phases
3. Define testing strategy for audit functionality

### Current Status: Ready for Architecture Design Phase

The project has comprehensive requirements gathering completed and is ready to proceed with the BMad Method workflow for architectural design and implementation planning.