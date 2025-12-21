/**
 * Constitution Compliance Tests
 *
 * These tests enforce the invariants defined in the Constitution:
 * - Kanban movement events are the only mechanism for stage changes
 * - moveStage creates PumpStageMoved events
 * - Locked pumps cannot be moved
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useApp } from './store'
import { eventStore } from './infrastructure/events/EventStore'
import type { Pump } from './types'

describe('Constitution Invariants', () => {
  beforeEach(async () => {
    // Clear event store before each test
    await eventStore.clear()

    // Reset store state
    const store = useApp.getState()
    store.replaceDataset([])
  })

  describe('Section 1.1: Kanban is sole source of truth', () => {
    it('moveStage should create PumpStageMoved event', async () => {
      const store = useApp.getState()

      // Add a test pump
      const testPump: Pump = {
        id: 'test-pump-1',
        serial: 1001,
        po: 'PO-001',
        customer: 'Test Customer',
        model: 'Model A',
        stage: 'QUEUE',
        priority: 'Normal',
        last_update: new Date().toISOString(),
        value: 1000,
      }

      store.replaceDataset([testPump])

      // Move stage
      store.moveStage('test-pump-1', 'FABRICATION')

      // Wait for async event persistence
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Verify event was created
      const events = await eventStore.getEvents('test-pump-1')
      expect(events).toHaveLength(1)
      expect(events[0].eventType).toBe('PumpStageMoved')
      expect(events[0]).toMatchObject({
        pumpId: 'test-pump-1',
        fromStage: 'QUEUE',
        toStage: 'FABRICATION',
      })
    })

    it('moveStage should update pump stage', () => {
      const store = useApp.getState()

      const testPump: Pump = {
        id: 'test-pump-2',
        serial: 1002,
        po: 'PO-002',
        customer: 'Test Customer',
        model: 'Model A',
        stage: 'QUEUE',
        priority: 'Normal',
        last_update: new Date().toISOString(),
        value: 1000,
      }

      store.replaceDataset([testPump])

      // Move stage
      store.moveStage('test-pump-2', 'FABRICATION')

      // Verify pump stage updated - need to get fresh state
      const updatedState = useApp.getState()
      const updatedPump = updatedState.pumps.find((p) => p.id === 'test-pump-2')
      expect(updatedPump?.stage).toBe('FABRICATION')
    })

    it('should not create event if pump already in target stage', async () => {
      const store = useApp.getState()

      const testPump: Pump = {
        id: 'test-pump-3',
        serial: 1003,
        po: 'PO-003',
        customer: 'Test Customer',
        model: 'Model A',
        stage: 'FABRICATION',
        priority: 'Normal',
        last_update: new Date().toISOString(),
        value: 1000,
      }

      store.replaceDataset([testPump])

      // Try to move to same stage
      store.moveStage('test-pump-3', 'FABRICATION')

      await new Promise((resolve) => setTimeout(resolve, 50))

      // Should not create event
      const events = await eventStore.getEvents('test-pump-3')
      expect(events).toHaveLength(0)
    })
  })

  describe('Section 3.2: Locks never block Kanban', () => {
    it('should allow moving pumps even when locked (locks are forecast-only)', async () => {
      const store = useApp.getState()

      const testPump: Pump = {
        id: 'test-pump-4',
        serial: 1004,
        po: 'PO-004',
        customer: 'Test Customer',
        model: 'Model A',
        stage: 'FABRICATION',
        priority: 'Normal',
        last_update: new Date().toISOString(),
        value: 1000,
        forecastStart: '2025-01-01T00:00:00.000Z',
      }

      store.replaceDataset([testPump])

      // Set lock date - this locks the pump for forecast purposes
      store.setLockDate('2025-01-01')

      // Move locked pump - Constitution §3.2: locks NEVER block Kanban
      store.moveStage('test-pump-4', 'STAGED_FOR_POWDER')

      await new Promise((resolve) => setTimeout(resolve, 50))

      // Pump SHOULD have moved - locks only affect forecasting, not Kanban
      const updatedState = useApp.getState()
      const pump = updatedState.pumps.find((p) => p.id === 'test-pump-4')
      expect(pump?.stage).toBe('STAGED_FOR_POWDER')

      // Event SHOULD be created
      const events = await eventStore.getEvents('test-pump-4')
      expect(events).toHaveLength(1)

      // Clean up lock date for other tests
      store.setLockDate(null)
    })
  })

  describe('Event history reconstruction', () => {
    it('should maintain chronological event order', async () => {
      const store = useApp.getState()

      // Ensure no lock date
      store.setLockDate(null)

      const testPump: Pump = {
        id: 'test-pump-5',
        serial: 1005,
        po: 'PO-005',
        customer: 'Test Customer',
        model: 'Model A',
        stage: 'QUEUE',
        priority: 'Normal',
        last_update: new Date().toISOString(),
        value: 1000,
      }

      store.replaceDataset([testPump])

      // Move through stages
      store.moveStage('test-pump-5', 'FABRICATION')
      await new Promise((resolve) => setTimeout(resolve, 10))

      store.moveStage('test-pump-5', 'ASSEMBLY')
      await new Promise((resolve) => setTimeout(resolve, 10))

      store.moveStage('test-pump-5', 'SHIP')
      await new Promise((resolve) => setTimeout(resolve, 50))

      // Verify event order
      const events = await eventStore.getEvents('test-pump-5')
      expect(events).toHaveLength(3)

      // Cast to PumpStageMoved to access toStage property
      const stageEvents = events as any[]
      expect(stageEvents[0].toStage).toBe('FABRICATION')
      expect(stageEvents[1].toStage).toBe('ASSEMBLY')
      expect(stageEvents[2].toStage).toBe('SHIP')

      // Verify chronological order
      expect(events[0].occurredAt.getTime()).toBeLessThan(
        events[1].occurredAt.getTime()
      )
      expect(events[1].occurredAt.getTime()).toBeLessThan(
        events[2].occurredAt.getTime()
      )
    })
  })

  describe('Section 7: Lock-Date affects forecast only', () => {
    it('should emit LockDateChanged event when lock date changes', async () => {
      const store = useApp.getState()

      // Clear any existing lock date
      store.setLockDate(null)
      await eventStore.clear()

      // Set a lock date
      store.setLockDate('2025-01-15')

      await new Promise((resolve) => setTimeout(resolve, 50))

      // Verify event was emitted with global aggregate ID
      const events = await eventStore.getEvents('global')
      expect(events.length).toBeGreaterThan(0)

      const lockEvent = events.find(
        (e: any) => e.eventType === 'LockDateChanged'
      )
      expect(lockEvent).toBeDefined()
      expect((lockEvent as any).previousLockDate).toBeNull()
      expect((lockEvent as any).newLockDate).toBe('2025-01-15')

      // Clean up
      store.setLockDate(null)
    })

    it('should NOT emit event when setting same lock date', async () => {
      const store = useApp.getState()

      // Set initial lock date
      store.setLockDate('2025-02-01')
      // Wait for the first event to be persisted
      await new Promise((resolve) => setTimeout(resolve, 50))

      await eventStore.clear()

      // Set same lock date again
      store.setLockDate('2025-02-01')

      await new Promise((resolve) => setTimeout(resolve, 50))

      // No new events should be created
      const events = await eventStore.getEvents('global')
      expect(
        events.filter((e: any) => e.eventType === 'LockDateChanged').length
      ).toBe(0)

      // Clean up
      store.setLockDate(null)
    })
  })
})
