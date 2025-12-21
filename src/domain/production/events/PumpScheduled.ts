/**
 * PumpScheduled Event - Emitted when a pump is assigned scheduled dates.
 */
import { DomainEvent } from './DomainEvent';

export interface PumpScheduled extends DomainEvent {
    readonly eventType: 'PumpScheduled';
    readonly pumpId: string;
    readonly forecastStart: string; // ISO string
    readonly forecastEnd: string; // ISO string
}

export function pumpScheduled(
    pumpId: string,
    forecastStart: string,
    forecastEnd: string
): PumpScheduled {
    return {
        eventType: 'PumpScheduled',
        aggregateId: pumpId,
        occurredAt: new Date(),
        pumpId,
        forecastStart,
        forecastEnd,
    };
}

/**
 * PumpScheduleCleared Event - Emitted when a pump's schedule is removed.
 */
export interface PumpScheduleCleared extends DomainEvent {
    readonly eventType: 'PumpScheduleCleared';
    readonly pumpId: string;
}

export function pumpScheduleCleared(pumpId: string): PumpScheduleCleared {
    return {
        eventType: 'PumpScheduleCleared',
        aggregateId: pumpId,
        occurredAt: new Date(),
        pumpId,
    };
}
