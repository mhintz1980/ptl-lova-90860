/**
 * Domain Events - Barrel export for all production domain events.
 */

export type { DomainEvent } from './DomainEvent'
export { createEvent } from './DomainEvent'
export type { PumpCreated } from './PumpCreated'
export { pumpCreated } from './PumpCreated'
export type { PumpStageMoved } from './PumpStageMoved'
export { pumpStageMoved } from './PumpStageMoved'
export type { PumpScheduled, PumpScheduleCleared } from './PumpScheduled'
export { pumpScheduled, pumpScheduleCleared } from './PumpScheduled'
// Constitution §3.3: Pause/Resume events
export type { PumpPaused } from './PumpPaused'
export { pumpPaused } from './PumpPaused'
export type { PumpResumed } from './PumpResumed'
export { pumpResumed } from './PumpResumed'

/**
 * Union type of all production domain events.
 */
export type ProductionEvent =
  | import('./PumpCreated').PumpCreated
  | import('./PumpStageMoved').PumpStageMoved
  | import('./PumpScheduled').PumpScheduled
  | import('./PumpScheduled').PumpScheduleCleared
  | import('./PumpPaused').PumpPaused
  | import('./PumpResumed').PumpResumed
