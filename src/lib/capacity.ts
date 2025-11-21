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
 * Calculate weekly capacity for a stage based on employee hours and typical pump hours
 * @param staffing Department staffing configuration
 * @param hoursPerPump Typical hours needed per pump for this stage (from model lead times)
 * @returns Number of pumps that can be processed per week
 */
export function calculateWeeklyCapacity(
    staffing: DepartmentStaffing,
    hoursPerPump: number = 8 // Default assumption: 1 day per pump
): number {
    const availableHours = calculateWeeklyHours(staffing);
    if (hoursPerPump <= 0) return 0;
    return Math.floor(availableHours / hoursPerPump);
}

/**
 * Get stage-specific capacity from config
 */
export function getStageCapacity(
    stage: Stage,
    config: CapacityConfig,
    hoursPerPump: number = 8
): number {
    switch (stage) {
        case "FABRICATION":
            return calculateWeeklyCapacity(config.fabrication, hoursPerPump);
        case "ASSEMBLY":
            return calculateWeeklyCapacity(config.assembly, hoursPerPump);
        case "TESTING":
            return calculateWeeklyCapacity(config.testing, hoursPerPump);
        case "SHIPPING":
            return calculateWeeklyCapacity(config.shipping, hoursPerPump);
        case "POWDER COAT":
            // Sum all vendor capacities
            return config.powderCoat.vendors.reduce(
                (sum, vendor) => sum + vendor.maxPumpsPerWeek,
                0
            );
        default:
            return 999; // No limit for QUEUE and CLOSED
    }
}
