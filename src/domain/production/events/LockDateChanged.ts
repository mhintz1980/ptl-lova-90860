import type { DomainEvent } from './DomainEvent'

/**
 * Domain event emitted when the global lock date is changed.
 *
 * Constitution §7: Lock date affects forecast/projection only, never truth.
 * Pumps with scheduledStart ≤ lockDate are "locked" from forecast operations
 * (autoSchedule, clearQueueSchedules) but NOT from Kanban moves (§3.2).
 */
export interface LockDateChanged extends DomainEvent {
  eventType: 'LockDateChanged'
  previousLockDate: string | null
  newLockDate: string | null
}

/**
 * Factory function to create a LockDateChanged event.
 */
export function lockDateChanged(
  previousLockDate: string | null,
  newLockDate: string | null
): LockDateChanged {
  return {
    eventType: 'LockDateChanged',
    aggregateId: 'global', // Lock date is a global setting
    occurredAt: new Date(),
    previousLockDate,
    newLockDate,
  }
}
