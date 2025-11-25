import { addDays, addHours, isWeekend } from "date-fns";
import type { Pump, CapacityConfig } from "../types";
import type { StageDurations, StageBlock } from "./schedule";

/**
 * Adds work days to a date, skipping weekends.
 * Assumes 8-hour work day for fractional calculations.
 */
function addWorkDays(startDate: Date, days: number): Date {
    let remainingHours = days * 8;
    let currentDate = new Date(startDate);

    // Move to start of work day (09:00) if needed? 
    // For simplicity, we just add time and skip weekends.

    while (remainingHours > 0) {
        // If weekend, skip to Monday
        if (isWeekend(currentDate)) {
            currentDate = addDays(currentDate, 1);
            currentDate.setHours(9, 0, 0, 0);
            continue;
        }

        // Work hours in a day: 8
        // If we have less than 8 hours, just add it
        if (remainingHours <= 8) {
            currentDate = addHours(currentDate, remainingHours);
            remainingHours = 0;
        } else {
            // Add 1 full day (24h clock time, but conceptually 8 work hours)
            currentDate = addDays(currentDate, 1);
            remainingHours -= 8;
        }
    }
    return currentDate;
}

/**
 * Calculates the duration of a stage in days based on capacity.
 */
function calculateDuration(
    baseLeadTimeDays: number,
    dailyManHoursCapacity: number
): number {
    if (dailyManHoursCapacity <= 0) return baseLeadTimeDays; // Fallback

    // Work Content (Man-Hours) = Base Lead Time (Days) * 8 Hours/Day
    const workContentHours = baseLeadTimeDays * 8;

    // Duration (Days) = Work Content / Daily Capacity
    return workContentHours / dailyManHoursCapacity;
}

export function buildCapacityAwareTimelines(
    pumps: Pump[],
    capacityConfig: CapacityConfig,
    leadTimeLookup: (model: string) => StageDurations | undefined
): Record<string, StageBlock[]> {
    const result: Record<string, StageBlock[]> = {};

    pumps.forEach(pump => {
        if (!pump.scheduledStart) return;

        const leadTimes = leadTimeLookup(pump.model);
        if (!leadTimes) return;

        const timeline: StageBlock[] = [];
        let currentStart = new Date(pump.scheduledStart);

        // 1. Fabrication
        const fabDuration = calculateDuration(
            leadTimes.fabrication,
            capacityConfig.fabrication.dailyManHours
        );
        const fabEnd = addWorkDays(currentStart, fabDuration);

        timeline.push({
            stage: "FABRICATION",
            start: currentStart,
            end: fabEnd,
            days: Math.max(1, Math.ceil(fabDuration)),
            pump
        });
        currentStart = fabEnd;

        // 2. Powder Coat (External - Fixed Lead Time)
        const pcDuration = leadTimes.powder_coat;
        const pcEnd = addWorkDays(currentStart, pcDuration);

        timeline.push({
            stage: "POWDER COAT",
            start: currentStart,
            end: pcEnd,
            days: Math.max(1, Math.ceil(pcDuration)),
            pump
        });
        currentStart = pcEnd;

        // 3. Assembly
        const asDuration = calculateDuration(
            leadTimes.assembly,
            capacityConfig.assembly.dailyManHours
        );
        const asEnd = addWorkDays(currentStart, asDuration);

        timeline.push({
            stage: "ASSEMBLY",
            start: currentStart,
            end: asEnd,
            days: Math.max(1, Math.ceil(asDuration)),
            pump
        });
        currentStart = asEnd;

        // 4. Testing
        const teDuration = calculateDuration(
            leadTimes.testing,
            capacityConfig.testing.dailyManHours
        );
        const teEnd = addWorkDays(currentStart, teDuration);

        timeline.push({
            stage: "TESTING",
            start: currentStart,
            end: teEnd,
            days: Math.max(1, Math.ceil(teDuration)),
            pump
        });
        currentStart = teEnd;

        // 5. Shipping
        // Assume 0.25 days base work content if not specified
        const shBaseDays = 0.25;
        const shDuration = calculateDuration(
            shBaseDays,
            capacityConfig.shipping.dailyManHours
        );
        const shEnd = addWorkDays(currentStart, shDuration);

        timeline.push({
            stage: "SHIPPING",
            start: currentStart,
            end: shEnd,
            days: Math.max(1, Math.ceil(shDuration)),
            pump
        });

        result[pump.id] = timeline;
    });

    return result;
}
