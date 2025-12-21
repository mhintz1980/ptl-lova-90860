/**
 * SchedulePumpCommand - Command to assign a scheduled production window to a pump.
 */
export interface SchedulePumpCommand {
    readonly type: 'SchedulePump';
    readonly pumpId: string;
    readonly forecastStart: string; // ISO string
    readonly forecastEnd: string; // ISO string
}

export function schedulePumpCommand(
    pumpId: string,
    forecastStart: string,
    forecastEnd: string
): SchedulePumpCommand {
    return {
        type: 'SchedulePump',
        pumpId,
        forecastStart,
        forecastEnd,
    };
}

/**
 * ClearScheduleCommand - Command to remove scheduled dates from a pump.
 */
export interface ClearScheduleCommand {
    readonly type: 'ClearSchedule';
    readonly pumpId: string;
}

export function clearScheduleCommand(pumpId: string): ClearScheduleCommand {
    return {
        type: 'ClearSchedule',
        pumpId,
    };
}
