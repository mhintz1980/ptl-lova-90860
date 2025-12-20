/**
 * Constitution Compliance Tests
 * 
 * These tests enforce the invariants defined in the Constitution:
 * - Kanban movement events are the only mechanism for stage changes
 * - moveStage creates PumpStageMoved events
 * - Locked pumps cannot be moved
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useApp } from './store';
import { eventStore } from './infrastructure/events/EventStore';
import type { Pump } from './types';

describe('Constitution Invariants', () => {
  beforeEach(async () => {
    // Clear event store before each test
    await eventStore.clear();
    
    // Reset store state
    const store = useApp.getState();
    store.replaceDataset([]);
  });

  describe('Section 1.1: Kanban is sole source of truth', () => {
    it('moveStage should create PumpStageMoved event', async () => {
      const store = useApp.getState();
      
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
      };
      
      store.replaceDataset([testPump]);
      
      // Move stage
      store.moveStage('test-pump-1', 'FABRICATION');
      
      // Wait for async event persistence
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Verify event was created
      const events = await eventStore.getEvents('test-pump-1');
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('PumpStageMoved');
      expect(events[0]).toMatchObject({
        pumpId: 'test-pump-1',
        fromStage: 'QUEUE',
        toStage: 'FABRICATION',
      });
    });

    it('moveStage should update pump stage', () => {
      const store = useApp.getState();
      
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
      };
      
      store.replaceDataset([testPump]);
      
      // Move stage
      store.moveStage('test-pump-2', 'FABRICATION');
      
      // Verify pump stage updated - need to get fresh state
      const updatedState = useApp.getState();
      const updatedPump = updatedState.pumps.find(p => p.id === 'test-pump-2');
      expect(updatedPump?.stage).toBe('FABRICATION');
    });

    it('should not create event if pump already in target stage', async () => {
      const store = useApp.getState();
      
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
      };
      
      store.replaceDataset([testPump]);
      
      // Try to move to same stage
      store.moveStage('test-pump-3', 'FABRICATION');
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Should not create event
      const events = await eventStore.getEvents('test-pump-3');
      expect(events).toHaveLength(0);
    });
  });

  describe('Section 7.1: Job-level locks', () => {
    it('should prevent moving locked pumps', async () => {
      const store = useApp.getState();
      
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
        scheduledStart: '2025-01-01T00:00:00.000Z',
      };
      
      store.replaceDataset([testPump]);
      
      // Set lock date to lock this pump
      store.setLockDate('2025-01-01');
      
      // Try to move locked pump
      store.moveStage('test-pump-4', 'ASSEMBLY');
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Pump should not have moved - get fresh state
      const updatedState = useApp.getState();
      const pump = updatedState.pumps.find(p => p.id === 'test-pump-4');
      expect(pump?.stage).toBe('FABRICATION');
      
      // No event should be created
      const events = await eventStore.getEvents('test-pump-4');
      expect(events).toHaveLength(0);
      
      // Clean up lock date for other tests
      store.setLockDate(null);
    });
  });

  describe('Event history reconstruction', () => {
    it('should maintain chronological event order', async () => {
      const store = useApp.getState();
      
      // Ensure no lock date
      store.setLockDate(null);
      
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
      };
      
      store.replaceDataset([testPump]);
      
      // Move through stages
      store.moveStage('test-pump-5', 'FABRICATION');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      store.moveStage('test-pump-5', 'ASSEMBLY');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      store.moveStage('test-pump-5', 'SHIP');
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Verify event order
      const events = await eventStore.getEvents('test-pump-5');
      expect(events).toHaveLength(3);
      
      // Cast to PumpStageMoved to access toStage property
      const stageEvents = events as any[];
      expect(stageEvents[0].toStage).toBe('FABRICATION');
      expect(stageEvents[1].toStage).toBe('ASSEMBLY');
      expect(stageEvents[2].toStage).toBe('SHIP');
      
      // Verify chronological order
      expect(events[0].occurredAt.getTime()).toBeLessThan(events[1].occurredAt.getTime());
      expect(events[1].occurredAt.getTime()).toBeLessThan(events[2].occurredAt.getTime());
    });
  });
});
