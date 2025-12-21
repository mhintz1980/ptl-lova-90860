import type { DomainEvent } from './DomainEvent'

/**
 * LockDateChanged domain event.
 *
 * Constitution §7: Emitted when the global lock date changes.
 * Lock date changes affect forecast-hint operations
 * (autoSetForecastHints, clearQueueForecastHints) but NOT Kanban moves (§3.2).
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
