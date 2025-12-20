/**
 * PumpResumed Event - Emitted when a pump is resumed (unpaused) within a work stage.
 * Constitution §3.3: Pause/Unpause is truth (WIP enforcement)
 */
import type { DomainEvent } from './DomainEvent'
import type { Stage } from '../../../types'

export interface PumpResumed extends DomainEvent {
  readonly eventType: 'PumpResumed'
  readonly pumpId: string
  readonly stage: Stage
  readonly pausedDays: number // How long was it paused
}

export function pumpResumed(
  pumpId: string,
  stage: Stage,
  pausedDays: number
): PumpResumed {
  return {
    eventType: 'PumpResumed',
    aggregateId: pumpId,
    occurredAt: new Date(),
    pumpId,
    stage,
    pausedDays,
  }
}
