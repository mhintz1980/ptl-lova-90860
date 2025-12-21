// src/test-fixtures/pump-snapshot.ts
// Snapshot of pumps for testing projections against reality
// Generated: 2025-12-20

import { Pump, Stage, Priority } from "../types";

/**
 * Customer tiers based on business relationship:
 * - Tier1: Major national rental chains (high volume, contractual SLAs)
 * - Tier2: Regional CAT dealers (strategic partners)
 * - Tier3: Other equipment dealers
 */
export type CustomerTier = "Tier1" | "Tier2" | "Tier3";

export interface PumpSnapshot {
  id: string;
  serial: number;
  po: string;
  customer: string;
  customerTier: CustomerTier;
  model: string;
  stage: Stage;
  priority: Priority;
  promiseDate: string;    // ISO date
  forecastEnd?: string;  // ISO date (projected completion)
  lastUpdate: string;     // ISO timestamp
  value: number;
}

// Customer tier classification
export const CUSTOMER_TIERS: Record<string, CustomerTier> = {
  "United Rentals": "Tier1",
  "Sunbelt Rentals": "Tier1",
  "Herc Rentals": "Tier1",
  "Rain For Rent": "Tier1",
  "Equipment Share": "Tier1",
  "H&E Equipment": "Tier2",
  "Carter CAT": "Tier2",
  "Ring Power CAT": "Tier2",
  "Thompson CAT": "Tier2",
  "Texas First CAT": "Tier2",
  "Yancey CAT": "Tier2",
  "Valencourt": "Tier3",
  "Pioneer Pump": "Tier3",
  "Nat. Tank & Equip.": "Tier3",
  "SunState": "Tier3",
};

export function getCustomerTier(customer: string): CustomerTier {
  return CUSTOMER_TIERS[customer] ?? "Tier3";
}

/**
 * Convert a Pump to a PumpSnapshot for projection testing
 */
export function toPumpSnapshot(pump: Pump): PumpSnapshot {
  return {
    id: pump.id,
    serial: pump.serial,
    po: pump.po,
    customer: pump.customer,
    customerTier: getCustomerTier(pump.customer),
    model: pump.model,
    stage: pump.stage,
    priority: pump.priority,
    promiseDate: pump.promiseDate ?? "",
    forecastEnd: pump.forecastEnd,
    lastUpdate: pump.last_update,
    value: pump.value,
  };
}

/**
 * Create a snapshot array from pumps for testing
 */
export function createPumpSnapshots(pumps: Pump[]): PumpSnapshot[] {
  return pumps.map(toPumpSnapshot);
}

/**
 * Example frozen snapshot for deterministic tests.
 * This captures a known state to test projections against.
 */
export const FROZEN_SNAPSHOT: PumpSnapshot[] = [
  // QUEUE - Not started
  {
    id: "snap-001",
    serial: 1001,
    po: "PO2025-0001-01",
    customer: "United Rentals",
    customerTier: "Tier1",
    model: "DD-4S",
    stage: "QUEUE",
    priority: "Normal",
    promiseDate: "2025-01-15",
    forecastEnd: undefined,
    lastUpdate: "2024-12-20T10:00:00.000Z",
    value: 20000,
  },
  {
    id: "snap-002",
    serial: 1002,
    po: "PO2025-0002-01",
    customer: "Carter CAT",
    customerTier: "Tier2",
    model: "RL200",
    stage: "QUEUE",
    priority: "High",
    promiseDate: "2025-01-10",
    forecastEnd: undefined,
    lastUpdate: "2024-12-19T08:00:00.000Z",
    value: 45000,
  },
  
  // FABRICATION - In progress
  {
    id: "snap-003",
    serial: 1003,
    po: "PO2025-0003-01",
    customer: "Sunbelt Rentals",
    customerTier: "Tier1",
    model: "DD-6 SAFE",
    stage: "FABRICATION",
    priority: "Rush",
    promiseDate: "2025-01-05",
    forecastEnd: "2025-01-08T17:00:00.000Z",
    lastUpdate: "2024-12-18T14:00:00.000Z",
    value: 30000,
  },
  {
    id: "snap-004",
    serial: 1004,
    po: "PO2025-0004-01",
    customer: "Valencourt",
    customerTier: "Tier3",
    model: "DD-8",
    stage: "FABRICATION",
    priority: "Normal",
    promiseDate: "2025-01-20",
    forecastEnd: "2025-01-18T17:00:00.000Z",
    lastUpdate: "2024-12-17T09:00:00.000Z",
    value: 38000,
  },
  
  // POWDER COAT - At vendor
  {
    id: "snap-005",
    serial: 1005,
    po: "PO2025-0005-01",
    customer: "Herc Rentals",
    customerTier: "Tier1",
    model: "RL300",
    stage: "POWDER_COAT",
    priority: "Urgent",
    promiseDate: "2024-12-28",
    forecastEnd: "2024-12-27T17:00:00.000Z",
    lastUpdate: "2024-12-15T16:00:00.000Z",
    value: 50000,
  },
  {
    id: "snap-006",
    serial: 1006,
    po: "PO2025-0006-01",
    customer: "Ring Power CAT",
    customerTier: "Tier2",
    model: "HC-150",
    stage: "POWDER_COAT",
    priority: "High",
    promiseDate: "2025-01-02",
    forecastEnd: "2025-01-03T17:00:00.000Z",
    lastUpdate: "2024-12-14T11:00:00.000Z",
    value: 36000,
  },
  
  // ASSEMBLY - Final build
  {
    id: "snap-007",
    serial: 1007,
    po: "PO2025-0007-01",
    customer: "Rain For Rent",
    customerTier: "Tier1",
    model: "DV-6",
    stage: "ASSEMBLY",
    priority: "Normal",
    promiseDate: "2024-12-30",
    forecastEnd: "2024-12-28T17:00:00.000Z",
    lastUpdate: "2024-12-20T08:00:00.000Z",
    value: 29000,
  },
  
  // TESTING - QA stage
  {
    id: "snap-008",
    serial: 1008,
    po: "PO2025-0008-01",
    customer: "Thompson CAT",
    customerTier: "Tier2",
    model: "PP-150",
    stage: "SHIP",
    priority: "Normal",
    promiseDate: "2024-12-24",
    forecastEnd: "2024-12-23T17:00:00.000Z",
    lastUpdate: "2024-12-20T07:00:00.000Z",
    value: 25000,
  },
  
  // SHIPPING - Ready to ship
  {
    id: "snap-009",
    serial: 1009,
    po: "PO2025-0009-01",
    customer: "Equipment Share",
    customerTier: "Tier1",
    model: "SIP-150",
    stage: "SHIP",
    priority: "Normal",
    promiseDate: "2024-12-22",
    forecastEnd: "2024-12-21T17:00:00.000Z",
    lastUpdate: "2024-12-20T06:00:00.000Z",
    value: 30000,
  },
  
  // CLOSED - Completed
  {
    id: "snap-010",
    serial: 1010,
    po: "PO2025-0010-01",
    customer: "Pioneer Pump",
    customerTier: "Tier3",
    model: "DP-150",
    stage: "CLOSED",
    priority: "Normal",
    promiseDate: "2024-12-15",
    forecastEnd: "2024-12-14T17:00:00.000Z",
    lastUpdate: "2024-12-14T17:30:00.000Z",
    value: 25000,
  },
];

/**
 * Helper to find pumps by criteria for projection assertions
 */
export function findSnapshots(
  snapshots: PumpSnapshot[],
  criteria: Partial<Pick<PumpSnapshot, "stage" | "customerTier" | "priority">>
): PumpSnapshot[] {
  return snapshots.filter((s) => {
    if (criteria.stage && s.stage !== criteria.stage) return false;
    if (criteria.customerTier && s.customerTier !== criteria.customerTier) return false;
    if (criteria.priority && s.priority !== criteria.priority) return false;
    return true;
  });
}

/**
 * Calculate stats from snapshots for projection validation
 */
export function snapshotStats(snapshots: PumpSnapshot[]) {
  const byStage = new Map<Stage, number>();
  const byTier = new Map<CustomerTier, number>();
  const byPriority = new Map<Priority, number>();
  let totalValue = 0;
  let lateCount = 0;
  const now = new Date().toISOString();

  for (const s of snapshots) {
    byStage.set(s.stage, (byStage.get(s.stage) ?? 0) + 1);
    byTier.set(s.customerTier, (byTier.get(s.customerTier) ?? 0) + 1);
    byPriority.set(s.priority, (byPriority.get(s.priority) ?? 0) + 1);
    totalValue += s.value;
    if (s.promiseDate && s.promiseDate < now && s.stage !== "CLOSED" && s.stage !== "SHIP") {
      lateCount++;
    }
  }

  return {
    total: snapshots.length,
    byStage: Object.fromEntries(byStage),
    byTier: Object.fromEntries(byTier),
    byPriority: Object.fromEntries(byPriority),
    totalValue,
    lateCount,
  };
}
