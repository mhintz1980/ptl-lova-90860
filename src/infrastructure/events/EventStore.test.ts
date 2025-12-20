import { describe, it, expect, beforeEach } from 'vitest';
import { eventStore } from './EventStore';
import { pumpStageMoved } from '../../domain/production/events/PumpStageMoved';

describe('EventStore', () => {
  beforeEach(async () => {
    // Clear events before each test
    await eventStore.clear();
  });

  it('should append and retrieve events', async () => {
    const event = pumpStageMoved('pump-1', 'QUEUE', 'FABRICATION');
    
    await eventStore.append(event);
    
    const events = await eventStore.getAllEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe('PumpStageMoved');
    expect(events[0].aggregateId).toBe('pump-1');
  });

  it('should filter events by aggregateId', async () => {
    const event1 = pumpStageMoved('pump-1', 'QUEUE', 'FABRICATION');
    const event2 = pumpStageMoved('pump-2', 'QUEUE', 'FABRICATION');
    const event3 = pumpStageMoved('pump-1', 'FABRICATION', 'ASSEMBLY');
    
    await eventStore.append(event1);
    await eventStore.append(event2);
    await eventStore.append(event3);
    
    const pump1Events = await eventStore.getEvents('pump-1');
    expect(pump1Events).toHaveLength(2);
    expect(pump1Events.every(e => e.aggregateId === 'pump-1')).toBe(true);
  });

  it('should preserve event order', async () => {
    const event1 = pumpStageMoved('pump-1', 'QUEUE', 'FABRICATION');
    await eventStore.append(event1);
    
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const event2 = pumpStageMoved('pump-1', 'FABRICATION', 'ASSEMBLY');
    await eventStore.append(event2);
    
    const events = await eventStore.getEvents('pump-1');
    expect(events).toHaveLength(2);
    expect(events[0].occurredAt.getTime()).toBeLessThan(events[1].occurredAt.getTime());
  });

  it('should handle empty store', async () => {
    const events = await eventStore.getAllEvents();
    expect(events).toHaveLength(0);
  });

  it('should clear all events', async () => {
    const event = pumpStageMoved('pump-1', 'QUEUE', 'FABRICATION');
    await eventStore.append(event);
    
    await eventStore.clear();
    
    const events = await eventStore.getAllEvents();
    expect(events).toHaveLength(0);
  });
});
