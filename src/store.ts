import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Pump, Filters, AddPoPayload, Stage, DataAdapter, Milestone, MicroTask } from "./types";
import { nanoid } from "nanoid";
import { LocalAdapter } from "./adapters/local";
import { SandboxAdapter } from "./adapters/sandbox";
import { getModelLeadTimes as getCatalogLeadTimes } from "./lib/seed";
import { addDays, startOfDay, isAfter, parseISO } from "date-fns";
import { buildStageTimeline, type StageDurations, type StageBlock } from "./lib/schedule";
import { applyFilters, genSerial } from "./lib/utils";
import { sortPumps, SortDirection, SortField } from "./lib/sort";
import type { CapacityConfig, DepartmentStaffing, PowderCoatVendor } from "./types";
import { DEFAULT_CAPACITY_CONFIG, getStageCapacity } from "./lib/capacity";

// --- Store Definition ---

export interface AppState {
  pumps: Pump[];
  filters: Filters;
  collapsedStages: Record<Stage, boolean>;
  collapsedCards: boolean;
  wipLimits: Record<Stage, number | null>;
  adapter: DataAdapter;
  loading: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  schedulingStageFilters: Stage[];
  lockDate: string | null; // ISO date string
  capacityConfig: CapacityConfig;

  // Sandbox State
  isSandbox: boolean;
  originalSnapshot: Pump[] | null;

  // Progress Engine State
  milestones: Milestone[];
  microTasks: MicroTask[];

  // actions
  setAdapter: (a: DataAdapter) => void;
  load: () => Promise<void>;
  setFilters: (f: Partial<Filters>) => void;
  clearFilters: () => void;
  addPO: (payload: AddPoPayload) => void;
  moveStage: (id: string, to: Stage) => void;
  updatePump: (id: string, patch: Partial<Pump>) => void;
  schedulePump: (id: string, dropDate: string) => void;
  clearSchedule: (id: string) => void;
  clearQueueSchedules: () => number;
  levelNotStartedSchedules: () => number; // Deprecated, kept for compatibility if needed, but logic should move to autoSchedule
  autoSchedule: () => number;
  replaceDataset: (rows: Pump[]) => void;
  toggleStageCollapse: (stage: Stage) => void;
  toggleCollapsedCards: () => void;
  setWipLimit: (stage: Stage, limit: number | null) => void;
  setSort: (field: SortField, direction: SortDirection) => void;
  toggleSchedulingStageFilter: (stage: Stage) => void;
  clearSchedulingStageFilters: () => void;
  setLockDate: (date: string | null) => void;
  updateDepartmentStaffing: (stage: "fabrication" | "assembly" | "testing" | "shipping", config: Partial<DepartmentStaffing>) => void;
  updatePowderCoatVendor: (vendorId: string, config: Partial<PowderCoatVendor>) => void;
  resetCapacityDefaults: () => void;

  // Sandbox Actions
  enterSandbox: () => void;
  commitSandbox: () => void;
  exitSandbox: () => void;

  // Progress Engine Actions
  addMilestone: (m: Milestone) => void;
  updateMilestone: (id: string, patch: Partial<Milestone>) => void;
  deleteMilestone: (id: string) => void;
  addMicroTask: (t: MicroTask) => void;
  toggleMicroTask: (id: string) => void;
  deleteMicroTask: (id: string) => void;

  // selectors
  filtered: () => Pump[];
  getModelLeadTimes: (model: string) => StageDurations | undefined;
  getStageSegments: (id: string) => StageBlock[] | undefined;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      pumps: [],
      filters: {},
      collapsedStages: {
        "QUEUE": false,
        FABRICATION: false, "POWDER COAT": false,
        ASSEMBLY: false, TESTING: false, SHIPPING: false, CLOSED: false
      } as Record<Stage, boolean>,
      collapsedCards: false,
      wipLimits: {
        "QUEUE": null,
        FABRICATION: 8,
        "POWDER COAT": 6,
        ASSEMBLY: 8,
        TESTING: 5,
        SHIPPING: 4,
        CLOSED: null,
      },
      adapter: LocalAdapter, // Default to LocalAdapter
      loading: true,
      sortField: "default",
      sortDirection: "desc",
      schedulingStageFilters: [],
      lockDate: null,
      capacityConfig: DEFAULT_CAPACITY_CONFIG,

      isSandbox: false,
      originalSnapshot: null,

      milestones: [],
      microTasks: [],

      setAdapter: (a) => set({ adapter: a }),

      load: async () => {
        set({ loading: true });
        let rows = await get().adapter.load();

        // Migration: Convert UNSCHEDULED/NOT STARTED to QUEUE
        let migrated = false;
        const migratedRows = rows.map(p => {
          if ((p.stage as string) === "UNSCHEDULED" || (p.stage as string) === "NOT STARTED") {
            migrated = true;
            return { ...p, stage: "QUEUE" as Stage };
          }
          return p;
        });

        if (migrated) {
          // If we migrated, we should probably persist it back immediately or just let the next save handle it.
          // For now, we just load it into state as QUEUE.
          rows = migratedRows;
        }

        set({ pumps: rows, loading: false });
      },

      setFilters: (f) => set({ filters: { ...get().filters, ...f } }),
      clearFilters: () => set({ filters: {} }),

      addPO: ({ po, customer, lines, promiseDate }) => {
        const expanded: Pump[] = lines.flatMap((line) =>
          Array.from({ length: line.quantity || 1 }).map(() => ({
            id: nanoid(),
            serial: genSerial(get().pumps),
            po,
            customer,
            model: line.model,
            stage: "QUEUE",
            priority: line.priority ?? "Normal",
            powder_color: line.color,
            last_update: new Date().toISOString(),
            value: line.valueEach || 0,
            promiseDate: promiseDate || line.promiseDate,
          }))
        );

        const newPumps = [...get().pumps, ...expanded];
        set({ pumps: newPumps });
        get().adapter.upsertMany(expanded);
      },

      moveStage: (id, to) => {
        const now = new Date().toISOString();
        const newPumps = get().pumps.map((p) =>
          p.id === id ? { ...p, stage: to, last_update: now } : p
        );
        set({ pumps: newPumps });
        get().adapter.update(id, { stage: to, last_update: now });
      },

      updatePump: (id, patch) => {
        const now = new Date().toISOString();
        const newPumps = get().pumps.map((p) =>
          p.id === id ? { ...p, ...patch, last_update: now } : p
        );
        set({ pumps: newPumps });
        get().adapter.update(id, { ...patch, last_update: now });
      },

      schedulePump: (id, dropDate) => {
        // When dropping on calendar, we set stage to QUEUE (conceptually "Scheduled Queue")
        // The distinction is purely whether scheduledStart is set.
        const pump = get().pumps.find((p) => p.id === id);
        if (!pump) return;

        // Calculate end date based on lead time
        const leadTimes = get().getModelLeadTimes(pump.model);
        const totalDays = leadTimes ? Object.values(leadTimes).reduce((a, b) => a + b, 0) : 1;

        // dropDate is YYYY-MM-DD from the calendar cell
        // We treat it as the start of the FABRICATION phase
        const start = startOfDay(new Date(dropDate));
        const end = addDays(start, totalDays);

        const patch: Partial<Pump> = {
          stage: "QUEUE", // Ensure it's in QUEUE
          scheduledStart: start.toISOString(),
          scheduledEnd: end.toISOString(),
          last_update: new Date().toISOString(),
        };

        get().updatePump(id, patch);
      },

      clearSchedule: (id) => {
        const patch: Partial<Pump> = {
          stage: "QUEUE",
          scheduledStart: undefined,
          scheduledEnd: undefined,
          last_update: new Date().toISOString(),
        };
        get().updatePump(id, patch);
      },

      clearQueueSchedules: () => {
        const { pumps, lockDate, updatePump } = get();
        let count = 0;

        pumps.forEach((p) => {
          if (p.stage === "QUEUE" && p.scheduledStart) {
            // Check lock date
            if (lockDate && !isAfter(parseISO(p.scheduledStart), parseISO(lockDate))) {
              return; // Skip locked items
            }

            updatePump(p.id, {
              scheduledStart: undefined,
              scheduledEnd: undefined,
              last_update: new Date().toISOString(),
            });
            count++;
          }
        });
        return count;
      },

      // Deprecated alias for compatibility
      levelNotStartedSchedules: () => {
        return get().autoSchedule();
      },

      autoSchedule: () => {
        const { pumps, updatePump, getModelLeadTimes, lockDate, capacityConfig } = get();

        // 1. Get un-scheduled pumps
        const unscheduled = pumps.filter(p => p.stage === "QUEUE" && !p.scheduledStart);
        if (unscheduled.length === 0) return 0;

        // 2. Sort by Priority then Due Date
        const priorityWeight = { Urgent: 4, Rush: 3, High: 2, Normal: 1, Low: 0 };

        const sorted = [...unscheduled].sort((a, b) => {
          const pA = priorityWeight[a.priority] ?? 1;
          const pB = priorityWeight[b.priority] ?? 1;
          if (pA !== pB) return pB - pA; // Higher priority first

          // If same priority, sooner promiseDate first
          if (a.promiseDate && b.promiseDate) {
            return a.promiseDate.localeCompare(b.promiseDate);
          }
          return 0;
        });

        // 3. Build capacity map using employee-based capacity
        // Calculate weekly capacity for fabrication (start stage)
        // Fabrication typically takes ~4 days per pump (3-5 days range)
        // With 4 employees, this gives ~4-5 pumps/week capacity
        const fabWeeklyCapacity = getStageCapacity("FABRICATION", capacityConfig, 4);
        // Daily capacity is roughly weekly / 5 work days (excluding weekends)
        const fabDailyCapacity = Math.max(1, Math.ceil(fabWeeklyCapacity / 5));

        // Seed capacity with existing scheduled jobs
        // We need to know how many jobs are starting on each day
        const dailyStarts: Record<string, number> = {};

        pumps.forEach(p => {
          if (p.scheduledStart) {
            const dateKey = p.scheduledStart.split('T')[0];
            dailyStarts[dateKey] = (dailyStarts[dateKey] || 0) + 1;
          }
        });

        let scheduledCount = 0;
        const today = new Date();

        // Determine start date for autoscheduling
        let searchStartDate = today;
        if (lockDate) {
          const lock = parseISO(lockDate);
          if (isAfter(lock, today)) {
            searchStartDate = addDays(lock, 1);
          }
        }

        // 4. Assign dates
        sorted.forEach(pump => {
          // Find first day with capacity < fabDailyCapacity
          let dayOffset = 0;
          let foundDate = false;
          let targetDateStr = "";

          while (!foundDate && dayOffset < 365) { // Cap at 1 year lookahead
            const targetDate = addDays(searchStartDate, dayOffset);
            const dateKey = targetDate.toISOString().split('T')[0];
            const currentLoad = dailyStarts[dateKey] || 0;

            if (currentLoad < fabDailyCapacity) {
              foundDate = true;
              targetDateStr = dateKey;
              dailyStarts[dateKey] = currentLoad + 1;
            } else {
              dayOffset++;
            }
          }

          if (foundDate) {
            // Calculate end date
            const leadTimes = getModelLeadTimes(pump.model);
            const duration = leadTimes ? Object.values(leadTimes).reduce((a, b) => a + b, 0) : 1;
            const start = startOfDay(new Date(targetDateStr));
            const end = addDays(start, duration);

            updatePump(pump.id, {
              scheduledStart: start.toISOString(),
              scheduledEnd: end.toISOString(),
              last_update: new Date().toISOString()
            });
            scheduledCount++;
          }
        });

        return scheduledCount;
      },

      replaceDataset: (rows) => {
        set({ pumps: rows });
        get().adapter.replaceAll(rows);
      },

      toggleStageCollapse: (stage) =>
        set((state) => ({
          collapsedStages: {
            ...state.collapsedStages,
            [stage]: !state.collapsedStages[stage],
          },
        })),

      toggleCollapsedCards: () =>
        set((state) => ({ collapsedCards: !state.collapsedCards })),

      setWipLimit: (stage, limit) =>
        set((state) => ({
          wipLimits: { ...state.wipLimits, [stage]: limit },
        })),

      setSort: (field, direction) =>
        set({ sortField: field, sortDirection: direction }),

      toggleSchedulingStageFilter: (stage) =>
        set((state) => {
          const current = state.schedulingStageFilters;
          const next = current.includes(stage)
            ? current.filter(s => s !== stage)
            : [...current, stage];
          return { schedulingStageFilters: next };
        }),

      clearSchedulingStageFilters: () =>
        set({ schedulingStageFilters: [] }),

      setLockDate: (date) => set({ lockDate: date }),

      // Capacity management actions
      updateDepartmentStaffing: (stage, config) =>
        set((state) => {
          const current = state.capacityConfig[stage];
          const newConfig = { ...current, ...config };

          // Reactive Logic:
          // 1. If Employee Count changed -> Recalc Daily Man-Hours
          if (config.employeeCount !== undefined && config.employeeCount !== current.employeeCount) {
            newConfig.dailyManHours = newConfig.employeeCount * 8 * newConfig.efficiency;
          }
          // 2. If Efficiency changed -> Recalc Daily Man-Hours
          else if (config.efficiency !== undefined && config.efficiency !== current.efficiency) {
            newConfig.dailyManHours = newConfig.employeeCount * 8 * newConfig.efficiency;
          }
          // 3. If Daily Man-Hours changed -> Recalc Efficiency (keep employees constant)
          else if (config.dailyManHours !== undefined && config.dailyManHours !== current.dailyManHours) {
            // efficiency = dailyManHours / (employees * 8)
            const denom = newConfig.employeeCount * 8;
            if (denom > 0) {
              newConfig.efficiency = newConfig.dailyManHours / denom;
            }
          }

          return {
            capacityConfig: {
              ...state.capacityConfig,
              [stage]: newConfig,
            },
          };
        }),

      updatePowderCoatVendor: (vendorId, config) =>
        set((state) => ({
          capacityConfig: {
            ...state.capacityConfig,
            powderCoat: {
              vendors: state.capacityConfig.powderCoat.vendors.map((vendor) =>
                vendor.id === vendorId ? { ...vendor, ...config } : vendor
              ),
            },
          },
        })),

      resetCapacityDefaults: () =>
        set({ capacityConfig: DEFAULT_CAPACITY_CONFIG }),

      // Sandbox Actions
      enterSandbox: () => {
        const state = get();
        if (state.isSandbox) return;
        set({
          isSandbox: true,
          originalSnapshot: [...state.pumps],
          adapter: SandboxAdapter,
        });
      },

      commitSandbox: () => {
        const state = get();
        if (!state.isSandbox) return;

        // Restore LocalAdapter
        const realAdapter = LocalAdapter;

        // Persist current state to real adapter
        realAdapter.replaceAll(state.pumps);

        set({
          isSandbox: false,
          originalSnapshot: null,
          adapter: realAdapter,
        });
      },

      exitSandbox: () => {
        const state = get();
        if (!state.isSandbox || !state.originalSnapshot) return;

        set({
          isSandbox: false,
          pumps: state.originalSnapshot,
          originalSnapshot: null,
          adapter: LocalAdapter,
        });
      },

      // Progress Engine Actions
      addMilestone: (m) =>
        set((state) => ({ milestones: [...state.milestones, m] })),

      updateMilestone: (id, patch) =>
        set((state) => ({
          milestones: state.milestones.map((m) =>
            m.id === id ? { ...m, ...patch } : m
          ),
        })),

      deleteMilestone: (id) =>
        set((state) => ({
          milestones: state.milestones.filter((m) => m.id !== id),
          microTasks: state.microTasks.filter((t) => t.milestoneId !== id),
        })),

      addMicroTask: (t) =>
        set((state) => ({ microTasks: [...state.microTasks, t] })),

      toggleMicroTask: (id) =>
        set((state) => ({
          microTasks: state.microTasks.map((t) =>
            t.id === id
              ? {
                ...t,
                isComplete: !t.isComplete,
                completedAt: !t.isComplete ? new Date().toISOString() : undefined,
              }
              : t
          ),
        })),

      deleteMicroTask: (id) =>
        set((state) => ({
          microTasks: state.microTasks.filter((t) => t.id !== id),
        })),

      // Selectors
      filtered: () => {
        const { pumps, filters, sortField, sortDirection } = get();
        const filtered = applyFilters(pumps, filters);
        return sortPumps(filtered, sortField, sortDirection);
      },

      getModelLeadTimes: (model) => getCatalogLeadTimes(model),

      getStageSegments: (id) => {
        const pump = get().pumps.find((p) => p.id === id);
        if (!pump || !pump.scheduledStart) return undefined;

        const leadTimes = get().getModelLeadTimes(pump.model);
        if (!leadTimes) return undefined;

        return buildStageTimeline(pump, leadTimes);
      },
    }),
    {
      name: "pumptracker-storage",
      partialize: (state) => ({
        filters: state.filters,
        collapsedStages: state.collapsedStages,
        collapsedCards: state.collapsedCards,
        wipLimits: state.wipLimits,
        sortField: state.sortField,
        sortDirection: state.sortDirection,
        lockDate: state.lockDate,
        capacityConfig: state.capacityConfig,
        milestones: state.milestones,
        microTasks: state.microTasks,
        // Do NOT persist isSandbox or originalSnapshot
      }),
    }
  )
);
