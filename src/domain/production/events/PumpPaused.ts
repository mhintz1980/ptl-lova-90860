/**
 * PumpPaused Event - Emitted when a pump is paused within a work stage.
 * Constitution §3.3: Pause/Unpause is truth (WIP enforcement)
 */
import type { DomainEvent } from './DomainEvent'
import type { Stage } from '../../../types'

export interface PumpPaused extends DomainEvent {
  readonly eventType: 'PumpPaused'
  readonly pumpId: string
  readonly stage: Stage
  readonly reason: 'auto' | 'manual' // 'auto' when entering full stage, 'manual' when user initiated
}

export function pumpPaused(
  pumpId: string,
  stage: Stage,
  reason: 'auto' | 'manual' = 'manual'
): PumpPaused {
  return {
    eventType: 'PumpPaused',
    aggregateId: pumpId,
    occurredAt: new Date(),
    pumpId,
    stage,
    reason,
  }
}
