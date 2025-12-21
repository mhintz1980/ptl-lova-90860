import type { Pump, CapacityConfig } from "../types";
import { type StageDurations, type StageBlock, buildStageTimeline } from "./schedule";

export function buildCapacityAwareTimelines(
    pumps: Pump[],
    capacityConfig: CapacityConfig,
    leadTimeLookup: (model: string) => StageDurations | undefined
): Record<string, StageBlock[]> {
    const result: Record<string, StageBlock[]> = {};

    pumps.forEach(pump => {
        if (!pump.forecastStart) return;

        const leadTimes = leadTimeLookup(pump.model);
        if (!leadTimes) return;

        // Use the centralized buildStageTimeline which now handles capacity and work hours
        const timeline = buildStageTimeline(pump, leadTimes, {
            startDate: new Date(pump.forecastStart),
            capacityConfig
        });

        if (timeline.length > 0) {
            result[pump.id] = timeline;
        }
    });

    return result;
}
