import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    MovePumpStageHandler,
    SchedulePumpHandler,
    PlaceOrderHandler,
} from './CommandHandlers';
import { Pump } from '../../domain/production/entities/Pump';
import { EventBus } from '../../infrastructure/eventBus/EventBus';
import { IPumpRepository } from '../../domain/production/repository';
import { IOrderRepository } from '../../domain/sales/repository';
import { Stage } from '../../domain/production/value-objects/Stage';

// Mock Pump Repository
function createMockPumpRepository(
    pumps: Map<string, Pump> = new Map()
): IPumpRepository {
    let nextSerial = 1000;
    return {
        findById: vi.fn(async (id: string) => pumps.get(id) ?? null),
        findBySerial: vi.fn(async () => null),
        findByStage: vi.fn(async () => []),
        findByPo: vi.fn(async () => []),
        findByCustomer: vi.fn(async () => []),
        findAll: vi.fn(async () => Array.from(pumps.values())),
        save: vi.fn(async (pump: Pump) => {
            pumps.set(pump.id, pump);
        }),
        saveMany: vi.fn(async (newPumps: Pump[]) => {
            for (const p of newPumps) {
                pumps.set(p.id, p);
            }
        }),
        delete: vi.fn(async () => { }),
        getNextSerial: vi.fn(async () => nextSerial++),
        countByStage: vi.fn(async () => new Map<Stage, number>()),
    };
}

// Mock Order Repository
function createMockOrderRepository(): IOrderRepository {
    const orders = new Map();
    return {
        findByPo: vi.fn(async (po: string) => orders.get(po) ?? null),
        findByCustomer: vi.fn(async () => []),
        findAll: vi.fn(async () => []),
        save: vi.fn(async (order) => {
            orders.set(order.po, order);
        }),
        delete: vi.fn(async () => { }),
        exists: vi.fn(async (po: string) => orders.has(po)),
    };
}

describe('MovePumpStageHandler', () => {
    let handler: MovePumpStageHandler;
    let pumpRepo: IPumpRepository;
    let eventBus: EventBus;
    let testPump: Pump;

    beforeEach(() => {
        testPump = Pump.create({
            id: 'pump-001',
            serial: 1234,
            po: 'PO2025-0001',
            customer: 'United Rentals',
            model: 'DD6-SAFE',
            priority: 'Normal',
            value: 25000,
        });

        const pumps = new Map<string, Pump>();
        pumps.set(testPump.id, testPump);

        pumpRepo = createMockPumpRepository(pumps);
        eventBus = new EventBus();
        handler = new MovePumpStageHandler(pumpRepo, eventBus);
    });

    it('should move pump from QUEUE to FABRICATION', async () => {
        const result = await handler.execute({
            type: 'MovePumpStage',
            pumpId: 'pump-001',
            toStage: 'FABRICATION',
        });

        expect(result.ok).toBe(true);
        expect(testPump.stage).toBe('FABRICATION');
        expect(pumpRepo.save).toHaveBeenCalledWith(testPump);
    });

    it('should publish PumpStageMoved event', async () => {
        const events: unknown[] = [];
        eventBus.subscribe('PumpStageMoved', (e) => {
            events.push(e);
        });

        await handler.execute({
            type: 'MovePumpStage',
            pumpId: 'pump-001',
            toStage: 'FABRICATION',
        });

        expect(events.length).toBe(1);
    });

    it('should fail for invalid transition (skip stages)', async () => {
        const result = await handler.execute({
            type: 'MovePumpStage',
            pumpId: 'pump-001',
            toStage: 'SHIP',
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toContain('Cannot skip');
        }
        expect(pumpRepo.save).not.toHaveBeenCalled();
    });

    it('should fail if pump not found', async () => {
        const result = await handler.execute({
            type: 'MovePumpStage',
            pumpId: 'nonexistent',
            toStage: 'FABRICATION',
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toContain('not found');
        }
    });
});

describe('SchedulePumpHandler', () => {
    let handler: SchedulePumpHandler;
    let pumpRepo: IPumpRepository;
    let eventBus: EventBus;
    let testPump: Pump;

    beforeEach(() => {
        testPump = Pump.create({
            id: 'pump-001',
            serial: 1234,
            po: 'PO2025-0001',
            customer: 'United Rentals',
            model: 'DD6-SAFE',
            priority: 'Normal',
            value: 25000,
        });

        const pumps = new Map<string, Pump>();
        pumps.set(testPump.id, testPump);

        pumpRepo = createMockPumpRepository(pumps);
        eventBus = new EventBus();
        handler = new SchedulePumpHandler(pumpRepo, eventBus);
    });

    it('should schedule a pump and publish event', async () => {
        const events: unknown[] = [];
        eventBus.subscribe('PumpScheduled', (e) => {
            events.push(e);
        });

        const result = await handler.execute({
            type: 'SchedulePump',
            pumpId: 'pump-001',
            scheduledStart: '2025-01-15T00:00:00.000Z',
            scheduledEnd: '2025-01-20T00:00:00.000Z',
        });

        expect(result.ok).toBe(true);
        expect(testPump.scheduledStart).toBe('2025-01-15T00:00:00.000Z');
        expect(events.length).toBe(1);
    });
});

describe('PlaceOrderHandler', () => {
    let handler: PlaceOrderHandler;
    let pumpRepo: IPumpRepository;
    let orderRepo: IOrderRepository;
    let eventBus: EventBus;

    beforeEach(() => {
        pumpRepo = createMockPumpRepository();
        orderRepo = createMockOrderRepository();
        eventBus = new EventBus();
        handler = new PlaceOrderHandler(pumpRepo, orderRepo, eventBus);
    });

    it('should create pumps for each line item quantity', async () => {
        const result = await handler.execute({
            type: 'PlaceOrder',
            po: 'PO2025-0001',
            customer: 'United Rentals',
            lines: [
                { model: 'DD6-SAFE', quantity: 2, valueEach: 25000 },
                { model: 'DD8-SAFE', quantity: 1, valueEach: 35000 },
            ],
        });

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.length).toBe(3); // 2 + 1 pumps
        }
        expect(pumpRepo.saveMany).toHaveBeenCalled();
    });

    it('should publish OrderPlaced and PumpCreated events', async () => {
        const orderEvents: unknown[] = [];
        const pumpEvents: unknown[] = [];

        eventBus.subscribe('OrderPlaced', (e) => {
            orderEvents.push(e);
        });
        eventBus.subscribe('PumpCreated', (e) => {
            pumpEvents.push(e);
        });

        await handler.execute({
            type: 'PlaceOrder',
            po: 'PO2025-0001',
            customer: 'United Rentals',
            lines: [{ model: 'DD6-SAFE', quantity: 2, valueEach: 25000 }],
        });

        expect(orderEvents.length).toBe(1);
        expect(pumpEvents.length).toBe(2);
    });

    it('should fail if PO already exists', async () => {
        // First order
        await handler.execute({
            type: 'PlaceOrder',
            po: 'PO2025-0001',
            customer: 'United Rentals',
            lines: [{ model: 'DD6-SAFE', quantity: 1, valueEach: 25000 }],
        });

        // Duplicate
        const result = await handler.execute({
            type: 'PlaceOrder',
            po: 'PO2025-0001',
            customer: 'Different Customer',
            lines: [{ model: 'DD6-SAFE', quantity: 1, valueEach: 25000 }],
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toContain('already exists');
        }
    });
});
