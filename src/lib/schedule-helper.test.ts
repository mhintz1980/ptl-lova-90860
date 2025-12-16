import { describe, it, expect } from 'vitest';
import { buildCapacityAwareTimelines } from './schedule-helper';
import { DEFAULT_CAPACITY_CONFIG } from './capacity';
import { Pump } from '../types';

describe('Schedule Helper - Dynamic Durations', () => {
    const mockPump: Pump = {
        id: 'p1',
        model: 'TEST-MODEL',
        scheduledStart: '2025-01-01T09:00:00.000Z', // Wednesday
        // ... other required fields
        serial: 1, po: 'PO1', customer: 'C1', stage: 'QUEUE', priority: 'Normal', value: 1000, last_update: '',
        work_hours: {
            fabrication: 12,
            assembly: 8,
            testing: 2,
            shipping: 2
        }
    };

    const mockLeadTimes = {
        fabrication: 1.5,
        powder_coat: 2,
        assembly: 1,
        testing: 0.25,
        total_days: 5
    };

    const leadTimeLookup = (stage: string) => { void stage; return mockLeadTimes; };

    it('should calculate durations based on capacity', () => {
        // Setup Config
        const config = { ...DEFAULT_CAPACITY_CONFIG };

        // 1. Fabrication: 4 employees (32h/day). Work: 12h. Duration: 12/32 = 0.375 days -> 1 day.
        config.fabrication = { ...config.fabrication, employeeCount: 4, efficiency: 1.0, dailyManHours: 32 };

        // 2. Testing: 0.25 employees (2h/day). Work: 2h. Duration: 2/2 = 1.0 days -> 1 day.
        config.testing = { ...config.testing, employeeCount: 0.25, efficiency: 1.0, dailyManHours: 2 };

        const timelines = buildCapacityAwareTimelines([mockPump], config, leadTimeLookup);
        const blocks = timelines['p1'];

        expect(blocks).toBeDefined();

        // Check Fabrication
        // 12h work / 32h per day = 0.375 days → roundToQuarter = 0.5 days = 12 hours
        const fabBlock = blocks.find(b => b.stage === 'FABRICATION');
        expect(fabBlock).toBeDefined();
        const fabDurationHours = (new Date(fabBlock!.end).getTime() - new Date(fabBlock!.start).getTime()) / 3600000;
        expect(fabDurationHours).toBe(12); // 0.5 days

        // Check Testing
        // 2h work / 2h per day = 1.0 day → roundToQuarter = 1.0 days = 24 hours
        const testBlock = blocks.find(b => b.stage === 'TESTING');
        expect(testBlock).toBeDefined();
        const testDurationHours = (new Date(testBlock!.end).getTime() - new Date(testBlock!.start).getTime()) / 3600000;
        expect(testDurationHours).toBe(24);
    });
});
