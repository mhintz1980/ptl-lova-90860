/**
 * EventStore - Persists domain events to localStorage
 * 
 * This is the foundation for event sourcing, enabling:
 * - Audit trail of all stage transitions
 * - Reconstruction of actual timeline from events
 * - Future migration to backend event store
 */

import type { DomainEvent } from '../../domain/production/events/DomainEvent';

const EVENTS_STORAGE_KEY = 'pumptracker-events';

export interface EventStore {
  append(event: DomainEvent): Promise<void>;
  getEvents(aggregateId: string): Promise<DomainEvent[]>;
  getAllEvents(): Promise<DomainEvent[]>;
  clear(): Promise<void>;
}

/**
 * LocalStorageEventStore - Simple event store backed by localStorage
 */
class LocalStorageEventStore implements EventStore {
  async append(event: DomainEvent): Promise<void> {
    const events = await this.getAllEvents();
    events.push(event);
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  }

  async getEvents(aggregateId: string): Promise<DomainEvent[]> {
    const allEvents = await this.getAllEvents();
    return allEvents.filter(e => e.aggregateId === aggregateId);
  }

  async getAllEvents(): Promise<DomainEvent[]> {
    const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (!raw) return [];
    
    try {
      const events = JSON.parse(raw);
      // Reconstruct Date objects from ISO strings
      return events.map((e: any) => ({
        ...e,
        occurredAt: new Date(e.occurredAt)
      }));
    } catch (error) {
      console.error('Failed to parse events from localStorage:', error);
      return [];
    }
  }

  async clear(): Promise<void> {
    localStorage.removeItem(EVENTS_STORAGE_KEY);
  }
}

/**
 * Singleton instance
 */
export const eventStore: EventStore = new LocalStorageEventStore();
