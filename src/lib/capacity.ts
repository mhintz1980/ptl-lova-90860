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
        efficiency: 0.85,
        dailyManHours: 4 * 8 * 0.85,
    },
    assembly: {
        employeeCount: 2,
        workDayHours: { ...DEFAULT_WORK_HOURS },
        efficiency: 0.85,
        dailyManHours: 2 * 8 * 0.85,
    },
    testing: {
        employeeCount: 0.25,
        workDayHours: { ...DEFAULT_WORK_HOURS },
        efficiency: 0.85,
        dailyManHours: 0.25 * 8 * 0.85,
    },
    shipping: {
        employeeCount: 0.25,
        workDayHours: { ...DEFAULT_WORK_HOURS },
        efficiency: 0.85,
        dailyManHours: 0.25 * 8 * 0.85,
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
 * Calculate weekly capacity based on daily man-hours
 * @param staffing Department staffing configuration
 * @param daysPerPump How many days each pump occupies an employee (e.g., 3-5 days for fabrication)
 * @returns Number of pumps that can START per week
 */
export function calculateWeeklyCapacity(
    staffing: DepartmentStaffing,
    daysPerPump: number = 4 // Default: ~4 days per pump per stage
): number {
    // New Logic:
    // 1. Weekly Man-Hours = Daily Man-Hours * 5 (assuming 5 work days for simplicity in this calculation context)
    // 2. Man-Hours Per Pump = daysPerPump * 8 (assuming 8 hours/day standard)
    // 3. Pumps Per Week = Weekly Man-Hours / Man-Hours Per Pump

    const weeklyManHours = staffing.dailyManHours * 5;
    const manHoursPerPump = daysPerPump * 8;

    if (manHoursPerPump === 0) return 999;

    return Math.floor(weeklyManHours / manHoursPerPump);
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
