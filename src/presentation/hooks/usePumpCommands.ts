/**
 * usePumpCommands - Hook for pump operations using new DDD domain layer.
 *
 * This hook provides a bridge between React components and the domain layer.
 * Feature-flagged via USE_NEW_DOMAIN for rollback safety.
 */
import { useCallback, useMemo } from 'react';
import { MovePumpStageHandler, SchedulePumpHandler, ClearScheduleHandler, PlaceOrderHandler } from '../../application/handlers/CommandHandlers';
import { PumpRepository } from '../../infrastructure/persistence/repositories/PumpRepository';
import { OrderRepository } from '../../infrastructure/persistence/repositories/OrderRepository';
import { InMemoryAdapter } from '../../infrastructure/persistence/adapters/InMemoryAdapter';
import { getEventBus } from '../../infrastructure/eventBus/EventBus';
import { Stage } from '../../domain/production/value-objects/Stage';
import { LineItemProps } from '../../domain/sales/entities/LineItem';

// Feature flag - set to true to use new domain layer
const USE_NEW_DOMAIN = false;

// Singleton adapter instance (will be replaced with LocalStorageAdapter in production)
let adapterInstance: InMemoryAdapter | null = null;

function getAdapter(): InMemoryAdapter {
    if (!adapterInstance) {
        adapterInstance = new InMemoryAdapter();
    }
    return adapterInstance;
}

export interface PumpCommandsResult {
    /**
     * Move a pump to a new stage.
     * Returns true on success, error message on failure.
     */
    movePump: (id: string, toStage: Stage) => Promise<{ ok: boolean; error?: string }>;

    /**
     * Schedule a pump with start and end dates.
     */
    schedulePump: (
        id: string,
        forecastStart: string,
        forecastEnd: string
    ) => Promise<{ ok: boolean; error?: string }>;

    /**
     * Clear a pump's schedule (return to backlog).
     */
    clearSchedule: (id: string) => Promise<{ ok: boolean; error?: string }>;

    /**
     * Place a new order (creates pumps).
     */
    placeOrder: (
        po: string,
        customer: string,
        lines: LineItemProps[],
        promiseDate?: string
    ) => Promise<{ ok: boolean; pumpIds?: string[]; error?: string }>;

    /**
     * Whether the new domain layer is active.
     */
    isNewDomainActive: boolean;
}

/**
 * Hook that provides pump commands using the new DDD domain layer.
 * Falls back to legacy store.ts when USE_NEW_DOMAIN is false.
 */
export function usePumpCommands(): PumpCommandsResult {
    const adapter = useMemo(() => getAdapter(), []);
    const eventBus = useMemo(() => getEventBus(), []);
    const pumpRepo = useMemo(() => new PumpRepository(adapter), [adapter]);
    const orderRepo = useMemo(() => new OrderRepository(adapter), [adapter]);

    const movePump = useCallback(
        async (id: string, toStage: Stage) => {
            if (!USE_NEW_DOMAIN) {
                // Fallback to legacy - caller should use store.moveStage directly
                return { ok: false, error: 'New domain layer not active' };
            }

            const handler = new MovePumpStageHandler(pumpRepo, eventBus);
            const result = await handler.execute({
                type: 'MovePumpStage',
                pumpId: id,
                toStage,
            });

            return result.ok
                ? { ok: true }
                : { ok: false, error: result.error };
        },
        [pumpRepo, eventBus]
    );

    const schedulePump = useCallback(
        async (id: string, forecastStart: string, forecastEnd: string) => {
            if (!USE_NEW_DOMAIN) {
                return { ok: false, error: 'New domain layer not active' };
            }

            const handler = new SchedulePumpHandler(pumpRepo, eventBus);
            const result = await handler.execute({
                type: 'SchedulePump',
                pumpId: id,
                forecastStart,
                forecastEnd,
            });

            return result.ok
                ? { ok: true }
                : { ok: false, error: result.error };
        },
        [pumpRepo, eventBus]
    );

    const clearSchedule = useCallback(
        async (id: string) => {
            if (!USE_NEW_DOMAIN) {
                return { ok: false, error: 'New domain layer not active' };
            }

            const handler = new ClearScheduleHandler(pumpRepo, eventBus);
            const result = await handler.execute({
                type: 'ClearSchedule',
                pumpId: id,
            });

            return result.ok
                ? { ok: true }
                : { ok: false, error: result.error };
        },
        [pumpRepo, eventBus]
    );

    const placeOrder = useCallback(
        async (
            po: string,
            customer: string,
            lines: LineItemProps[],
            promiseDate?: string
        ) => {
            if (!USE_NEW_DOMAIN) {
                return { ok: false, error: 'New domain layer not active' };
            }

            const handler = new PlaceOrderHandler(pumpRepo, orderRepo, eventBus);
            const result = await handler.execute({
                type: 'PlaceOrder',
                po,
                customer,
                lines,
                promiseDate,
            });

            return result.ok
                ? { ok: true, pumpIds: result.value }
                : { ok: false, error: result.error };
        },
        [pumpRepo, orderRepo, eventBus]
    );

    return {
        movePump,
        schedulePump,
        clearSchedule,
        placeOrder,
        isNewDomainActive: USE_NEW_DOMAIN,
    };
}

/**
 * Export the feature flag for conditional rendering.
 */
export { USE_NEW_DOMAIN };
