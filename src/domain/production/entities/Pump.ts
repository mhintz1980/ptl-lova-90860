/**
 * Pump Entity - Core Domain Aggregate Root
 *
 * Represents a manufactured pump asset progressing through production stages.
 * Enforces invariants:
 * 1. Stage transitions must follow the ordered sequence (no skipping)
 * 2. Serial number is immutable after creation
 * 3. Moving a pump updates last_update timestamp
 * 4. CLOSED pumps cannot be moved (terminal state)
 */

import { Entity } from '../../shared/Entity'
import { Stage, canTransition, getNextStage } from '../value-objects/Stage'
import { Priority } from '../value-objects/Priority'

// Result types for domain operations
export type PumpStageMoved = {
  readonly type: 'PumpStageMoved'
  readonly pumpId: string
  readonly fromStage: Stage
  readonly toStage: Stage
  readonly occurredAt: Date
}

export type InvalidTransition = {
  readonly type: 'InvalidTransition'
  readonly pumpId: string
  readonly fromStage: Stage
  readonly toStage: Stage
  readonly reason: string
}

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }

export interface PumpProps {
  readonly id: string
  readonly serial: number
  readonly po: string
  readonly customer: string
  readonly model: string
  readonly stage: Stage
  readonly priority: Priority
  readonly powder_color?: string
  readonly last_update: string // ISO string
  readonly value: number
  readonly forecastStart?: string // ISO string
  readonly forecastEnd?: string // ISO string
  readonly promiseDate?: string // ISO string
  readonly work_hours?: {
    fabrication: number
    assembly: number
    testing: number
    shipping: number
  }
}

export class Pump extends Entity<string> {
  private _stage: Stage
  private _priority: Priority
  private _forecastStart?: string
  private _forecastEnd?: string
  private _last_update: string
  private _powder_color?: string

  // Immutable properties
  readonly serial: number
  readonly po: string
  readonly customer: string
  readonly model: string
  readonly value: number
  readonly promiseDate?: string
  readonly work_hours?: {
    fabrication: number
    assembly: number
    testing: number
    shipping: number
  }

  constructor(props: PumpProps) {
    super(props.id)
    this.serial = props.serial
    this.po = props.po
    this.customer = props.customer
    this.model = props.model
    this.value = props.value
    this.promiseDate = props.promiseDate
    this.work_hours = props.work_hours

    this._stage = props.stage
    this._priority = props.priority
    this._forecastStart = props.forecastStart
    this._forecastEnd = props.forecastEnd
    this._last_update = props.last_update
    this._powder_color = props.powder_color
  }

  // Getters for mutable state
  get stage(): Stage {
    return this._stage
  }

  get priority(): Priority {
    return this._priority
  }

  get forecastStart(): string | undefined {
    return this._forecastStart
  }

  get forecastEnd(): string | undefined {
    return this._forecastEnd
  }

  get last_update(): string {
    return this._last_update
  }

  get powder_color(): string | undefined {
    return this._powder_color
  }

  /**
   * Attempt to move pump to the specified stage.
   * Enforces:
   * - CLOSED is terminal (cannot transition from it)
   * - Transitions must be sequential (no skipping)
   */
  moveToStage(toStage: Stage): Result<PumpStageMoved, InvalidTransition> {
    const fromStage = this._stage

    // Check if transition is valid
    if (!canTransition(fromStage, toStage)) {
      let reason: string
      if (fromStage === 'CLOSED') {
        reason = 'CLOSED is terminal; pump cannot be re-opened'
      } else {
        const next = getNextStage(fromStage)
        reason = next
          ? `Cannot skip stages. Next valid stage is ${next}`
          : 'Invalid stage transition'
      }

      return {
        ok: false,
        error: {
          type: 'InvalidTransition',
          pumpId: this.id,
          fromStage,
          toStage,
          reason,
        },
      }
    }

    // Apply the transition
    const occurredAt = new Date()
    this._stage = toStage
    this._last_update = occurredAt.toISOString()

    return {
      ok: true,
      value: {
        type: 'PumpStageMoved',
        pumpId: this.id,
        fromStage,
        toStage,
        occurredAt,
      },
    }
  }

  /**
   * Move pump to the immediate next stage in sequence.
   */
  moveToNextStage(): Result<PumpStageMoved, InvalidTransition> {
    const nextStage = getNextStage(this._stage)
    if (!nextStage) {
      return {
        ok: false,
        error: {
          type: 'InvalidTransition',
          pumpId: this.id,
          fromStage: this._stage,
          toStage: this._stage,
          reason: 'Already at terminal stage (CLOSED)',
        },
      }
    }
    return this.moveToStage(nextStage)
  }

  /**
   * Constitution §7: Set forecast hint (projection only, not truth).
   */
  setForecastHint(start: Date, end: Date): void {
    this._forecastStart = start.toISOString()
    this._forecastEnd = end.toISOString()
    this._last_update = new Date().toISOString()
  }

  /**
   * Constitution §7: Clear forecast hint (return to backlog).
   */
  clearForecastHint(): void {
    this._forecastStart = undefined
    this._forecastEnd = undefined
    this._last_update = new Date().toISOString()
  }

  /**
   * Update priority level.
   */
  setPriority(priority: Priority): void {
    this._priority = priority
    this._last_update = new Date().toISOString()
  }

  /**
   * Update powder coat color.
   */
  setPowderColor(color: string): void {
    this._powder_color = color
    this._last_update = new Date().toISOString()
  }

  /**
   * Check if pump is in Work-In-Progress (WIP) - i.e., not in QUEUE or CLOSED.
   */
  isWIP(): boolean {
    return this._stage !== 'QUEUE' && this._stage !== 'CLOSED'
  }

  /**
   * Check if pump has past its promise date and is not closed.
   */
  isLate(referenceDate: Date = new Date()): boolean {
    if (!this.promiseDate || this._stage === 'CLOSED') {
      return false
    }
    return new Date(this.promiseDate) < referenceDate
  }

  /**
   * Serialize to plain object (for persistence).
   */
  toProps(): PumpProps {
    return {
      id: this.id,
      serial: this.serial,
      po: this.po,
      customer: this.customer,
      model: this.model,
      stage: this._stage,
      priority: this._priority,
      powder_color: this._powder_color,
      last_update: this._last_update,
      value: this.value,
      forecastStart: this._forecastStart,
      forecastEnd: this._forecastEnd,
      promiseDate: this.promiseDate,
      work_hours: this.work_hours,
    }
  }

  /**
   * Factory method to create a new pump in QUEUE stage.
   */
  static create(props: Omit<PumpProps, 'stage' | 'last_update'>): Pump {
    return new Pump({
      ...props,
      stage: 'QUEUE',
      last_update: new Date().toISOString(),
    })
  }
}
