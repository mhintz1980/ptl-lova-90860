// src/types.ts

export const STAGES = [
  "QUEUE",
  "FABRICATION",
  "POWDER COAT",
  "ASSEMBLY",
  "TESTING",
  "SHIPPING",
  "CLOSED",
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
  // Pause state
  isPaused?: boolean;      // true if job is in limbo
  pausedAt?: string;       // ISO timestamp when paused
  pausedStage?: Stage;     // stage where job was paused
  totalPausedDays?: number; // accumulated pause duration
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
  lines: PoLine[]; // expands to multiple Pump entries
}

export interface Filters {
  po?: string;
  customer?: string;
  model?: string;
  priority?: Priority | "";
  stage?: Stage | "";
  q?: string; // search
  dateFrom?: string; // ISO (optional for trend)
  dateTo?: string;   // ISO
}

export type DataAdapter = {
  load: () => Promise<Pump[]>;
  replaceAll: (rows: Pump[]) => Promise<void>;
  upsertMany: (rows: Pump[]) => Promise<void>;
  update: (id: string, patch: Partial<Pump>) => Promise<void>;
};

// Capacity Configuration Types
export interface WorkDayHours {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

export interface DepartmentStaffing {
  employeeCount: number;
  workDayHours: WorkDayHours;
  efficiency: number;      // 0.0 to 1.0 (default 0.85)
  dailyManHours: number;   // Calculated: employees * 8 * efficiency
}

export interface PowderCoatVendor {
  id: string;
  name: string;
  maxPumpsPerWeek: number;
}

export interface CapacityConfig {
  fabrication: DepartmentStaffing;
  assembly: DepartmentStaffing;
  testing: DepartmentStaffing;
  shipping: DepartmentStaffing;
  powderCoat: {
    vendors: PowderCoatVendor[];
  };
}

export interface Milestone {
  id: string;
  title: string;
  department: Stage;
  deadline: string; // ISO
  createdAt: string; // ISO
}

export interface MicroTask {
  id: string;
  milestoneId: string;
  description: string;
  isComplete: boolean;
  completedAt?: string; // ISO
  weight: number;
}

