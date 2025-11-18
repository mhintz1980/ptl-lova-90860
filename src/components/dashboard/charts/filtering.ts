import type { DashboardFilters } from "../../../dashboard/config";
import type { Pump, Stage, Department } from "../../../types";

const IN_PROGRESS_STAGES: Stage[] = [
  "FABRICATION",
  "POWDER COAT",
  "ASSEMBLY",
  "TESTING",
  "SHIPPING",
];
const DONE_STAGES: Stage[] = ["CLOSED"];

const STAGE_DEPARTMENT: Record<Stage, Department> = {
  UNSCHEDULED: "Fabrication",
  "NOT STARTED": "Fabrication",
  FABRICATION: "Fabrication",
  "POWDER COAT": "Powder Coat",
  ASSEMBLY: "Assembly",
  TESTING: "Testing & Shipping",
  SHIPPING: "Testing & Shipping",
  CLOSED: "Testing & Shipping",
};

const matchesDateRange = (
  dateString: string,
  from?: Date | null,
  to?: Date | null
) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return true;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
};

export function filterPumpsForDashboard(
  pumps: Pump[],
  filters: DashboardFilters
): Pump[] {
  return pumps.filter((pump) => {
    if (filters.customerId && pump.customer !== filters.customerId) return false;
    if (filters.modelId && pump.model !== filters.modelId) return false;
    if (filters.department) {
      const department = STAGE_DEPARTMENT[pump.stage];
      if (department !== filters.department) return false;
    }
    if (filters.stage) {
      if (filters.stage === "IN PROGRESS") {
        if (!IN_PROGRESS_STAGES.includes(pump.stage)) return false;
      } else if (filters.stage === "DONE") {
        if (!DONE_STAGES.includes(pump.stage)) return false;
      } else if (pump.stage !== filters.stage) {
        return false;
      }
    }
    const { from, to } = filters.dateRange ?? {};
    if (!matchesDateRange(pump.last_update, from, to)) return false;
    return true;
  });
}

export function groupCounts(
  pumps: Pump[],
  filters: DashboardFilters,
  selector: (pump: Pump) => string | undefined
) {
  const filtered = filterPumpsForDashboard(pumps, filters);
  const map = new Map<string, number>();
  filtered.forEach((pump) => {
    const key = selector(pump);
    if (!key) return;
    map.set(key, (map.get(key) ?? 0) + 1);
  });
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}
