// src/lib/capacity.ts
import type { CapacityConfig, DepartmentStaffing, WorkDayHours } from "../types";
import type { Stage } from "../types";

/**
 * Default work schedule: M-Th full days (8 hrs), Fri half day (4 hrs), weekends off
 */
export const DEFAULT_WORK_HOURS: WorkDayHours = {
    monday: 8,
    tuesday: 8,
    wednesday: 8,
    thursday: 8,
    friday: 4,
    saturday: 0,
    sunday: 0,
};

/**
 * Default capacity configuration matching user specs
 */
export const DEFAULT_CAPACITY_CONFIG: CapacityConfig = {
    fabrication: {
        employeeCount: 4,
        workDayHours: { ...DEFAULT_WORK_HOURS },
    },
    assembly: {
        employeeCount: 2,
        workDayHours: { ...DEFAULT_WORK_HOURS },
    },
    testing: {
        employeeCount: 1,
        workDayHours: { ...DEFAULT_WORK_HOURS },
    },
    shipping: {
        employeeCount: 1,
        workDayHours: { ...DEFAULT_WORK_HOURS },
    },
    powderCoat: {
        vendors: [
            { id: "pc-1", name: "PC-1", maxPumpsPerWeek: 3 },
            { id: "pc-2", name: "PC-2", maxPumpsPerWeek: 3 },
            { id: "pc-3", name: "PC-3", maxPumpsPerWeek: 3 },
        ],
    },
};

/**
 * Calculate total hours available per week for a department
 */
export function calculateWeeklyHours(staffing: DepartmentStaffing): number {
    const hoursPerEmployee =
        staffing.workDayHours.monday +
        staffing.workDayHours.tuesday +
        staffing.workDayHours.wednesday +
        staffing.workDayHours.thursday +
        staffing.workDayHours.friday +
        staffing.workDayHours.saturday +
        staffing.workDayHours.sunday;

    return staffing.employeeCount * hoursPerEmployee;
}

/**
 * Calculate weekly capacity based on how many pumps can START per week
 * This accounts for the fact that each pump occupies an employee for multiple DAYS
 * @param staffing Department staffing configuration
 * @param daysPerPump How many days each pump occupies an employee (e.g., 3-5 days for fabrication)
 * @returns Number of pumps that can START per week
 */
export function calculateWeeklyCapacity(
    staffing: DepartmentStaffing,
    daysPerPump: number = 4 // Default: ~4 days per pump per stage
): number {
    // Each employee can handle roughly 5 work days / daysPerPump pumps per week
    // For example: if a pump takes 4 days, each employee can start ~1.25 pumps/week
    const pumpsPerEmployeePerWeek = 5 / daysPerPump;
    return Math.floor(staffing.employeeCount * pumpsPerEmployeePerWeek);
}

/**
 * Get stage-specific capacity from config
 * @param stage Production stage
 * @param config Capacity configuration
 * @param daysPerPump Days each pump occupies resources (default 4 days)
 */
export function getStageCapacity(
    stage: Stage,
    config: CapacityConfig,
    daysPerPump: number = 4
): number {
    switch (stage) {
        case "FABRICATION":
            // Fabrication typically takes 3-5 days per pump
            return calculateWeeklyCapacity(config.fabrication, daysPerPump);
        case "ASSEMBLY":
            // Assembly typically takes 2-4 days per pump
            return calculateWeeklyCapacity(config.assembly, daysPerPump);
        case "TESTING":
            // Testing typically takes 1-2 days per pump
            return calculateWeeklyCapacity(config.testing, daysPerPump);
        case "SHIPPING":
            // Shipping typically takes 1 day per pump
            return calculateWeeklyCapacity(config.shipping, daysPerPump);
        case "POWDER COAT":
            // Sum all vendor capacities (outsourced, simple weekly limit)
            return config.powderCoat.vendors.reduce(
                (sum, vendor) => sum + vendor.maxPumpsPerWeek,
                0
            );
        default:
            return 999; // No limit for QUEUE and CLOSED
    }
}
