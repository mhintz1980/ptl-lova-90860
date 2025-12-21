import { describe, it, expect } from 'vitest';
import {
    pumpCreated,
    pumpStageMoved,
    pumpScheduled,
    pumpScheduleCleared,
} from './index';

describe('Domain Events', () => {
    describe('pumpCreated', () => {
        it('should create a PumpCreated event with correct type', () => {
            const event = pumpCreated({
                pumpId: 'pump-001',
                serial: 1234,
                model: 'DD6-SAFE',
                customer: 'United Rentals',
                po: 'PO2025-0001',
                stage: 'QUEUE',
                priority: 'Normal',
                value: 25000,
            });

            expect(event.eventType).toBe('PumpCreated');
            expect(event.aggregateId).toBe('pump-001');
            expect(event.pumpId).toBe('pump-001');
            expect(event.occurredAt).toBeInstanceOf(Date);
        });

        it('should serialize to JSON correctly', () => {
            const event = pumpCreated({
                pumpId: 'pump-001',
                serial: 1234,
                model: 'DD6-SAFE',
                customer: 'United Rentals',
                po: 'PO2025-0001',
                stage: 'QUEUE',
                priority: 'Normal',
                value: 25000,
            });

            const json = JSON.stringify(event);
            const parsed = JSON.parse(json);

            expect(parsed.eventType).toBe('PumpCreated');
            expect(parsed.pumpId).toBe('pump-001');
            expect(typeof parsed.occurredAt).toBe('string');
        });
    });

    describe('pumpStageMoved', () => {
        it('should create a PumpStageMoved event', () => {
            const event = pumpStageMoved('pump-001', 'QUEUE', 'FABRICATION');

            expect(event.eventType).toBe('PumpStageMoved');
            expect(event.pumpId).toBe('pump-001');
            expect(event.fromStage).toBe('QUEUE');
            expect(event.toStage).toBe('FABRICATION');
        });

        it('should handle null fromStage for initial creation', () => {
            const event = pumpStageMoved('pump-001', null, 'QUEUE');

            expect(event.fromStage).toBeNull();
            expect(event.toStage).toBe('QUEUE');
        });
    });

    describe('pumpScheduled', () => {
        it('should create a PumpScheduled event', () => {
            const event = pumpScheduled(
                'pump-001',
                '2025-01-15T00:00:00.000Z',
                '2025-01-20T00:00:00.000Z'
            );

            expect(event.eventType).toBe('PumpScheduled');
            expect(event.pumpId).toBe('pump-001');
            expect(event.forecastStart).toBe('2025-01-15T00:00:00.000Z');
            expect(event.forecastEnd).toBe('2025-01-20T00:00:00.000Z');
        });
    });

    describe('pumpScheduleCleared', () => {
        it('should create a PumpScheduleCleared event', () => {
            const event = pumpScheduleCleared('pump-001');

            expect(event.eventType).toBe('PumpScheduleCleared');
            expect(event.pumpId).toBe('pump-001');
            expect(event.aggregateId).toBe('pump-001');
        });
    });
});
