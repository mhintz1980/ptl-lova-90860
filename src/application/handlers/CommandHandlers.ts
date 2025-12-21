/**
 * Command Handlers - Application layer orchestration.
 *
 * Handlers coordinate between domain entities, repositories, and event bus.
 * They implement use cases without containing business logic (that lives in domain).
 */
import { MovePumpStageCommand } from '../commands/MovePumpStageCommand'
import {
  SetForecastHintCommand,
  ClearForecastHintCommand,
} from '../commands/SetForecastHintCommand'
import { PlaceOrderCommand } from '../commands/PlaceOrderCommand'
import { IPumpRepository } from '../../domain/production/repository'
import { IOrderRepository } from '../../domain/sales/repository'
import { EventBus } from '../../infrastructure/eventBus/EventBus'
import {
  pumpStageMoved,
  pumpScheduled,
  pumpScheduleCleared,
} from '../../domain/production/events'
import { orderPlaced } from '../../domain/sales/events/OrderPlaced'
import { pumpCreated } from '../../domain/production/events/PumpCreated'
import { PurchaseOrder } from '../../domain/sales/entities/PurchaseOrder'

// Result types
export type CommandResult<T = void> =
  | { ok: true; value: T }
  | { ok: false; error: string }

/**
 * Handler for MovePumpStageCommand.
 */
export class MovePumpStageHandler {
  constructor(
    private readonly pumpRepository: IPumpRepository,
    private readonly eventBus: EventBus
  ) {}

  async execute(cmd: MovePumpStageCommand): Promise<CommandResult> {
    // 1. Load the pump
    const pump = await this.pumpRepository.findById(cmd.pumpId)
    if (!pump) {
      return { ok: false, error: `Pump not found: ${cmd.pumpId}` }
    }

    // 2. Attempt the domain operation
    const result = pump.moveToStage(cmd.toStage)
    if (!result.ok) {
      return { ok: false, error: result.error.reason }
    }

    // 3. Persist the change
    await this.pumpRepository.save(pump)

    // 4. Publish the domain event
    await this.eventBus.publish(
      pumpStageMoved(cmd.pumpId, result.value.fromStage, result.value.toStage)
    )

    return { ok: true, value: undefined }
  }
}

/**
 * Handler for SetForecastHintCommand.
 * Constitution §7: Forecast hints are projection only, not truth.
 */
export class SetForecastHintHandler {
  constructor(
    private readonly pumpRepository: IPumpRepository,
    private readonly eventBus: EventBus
  ) {}

  async execute(cmd: SetForecastHintCommand): Promise<CommandResult> {
    const pump = await this.pumpRepository.findById(cmd.pumpId)
    if (!pump) {
      return { ok: false, error: `Pump not found: ${cmd.pumpId}` }
    }

    pump.setForecastHint(new Date(cmd.forecastStart), new Date(cmd.forecastEnd))
    await this.pumpRepository.save(pump)

    await this.eventBus.publish(
      pumpScheduled(cmd.pumpId, cmd.forecastStart, cmd.forecastEnd)
    )

    return { ok: true, value: undefined }
  }
}

/**
 * Handler for ClearForecastHintCommand.
 */
export class ClearForecastHintHandler {
  constructor(
    private readonly pumpRepository: IPumpRepository,
    private readonly eventBus: EventBus
  ) {}

  async execute(cmd: ClearForecastHintCommand): Promise<CommandResult> {
    const pump = await this.pumpRepository.findById(cmd.pumpId)
    if (!pump) {
      return { ok: false, error: `Pump not found: ${cmd.pumpId}` }
    }

    pump.clearForecastHint()
    await this.pumpRepository.save(pump)

    await this.eventBus.publish(pumpScheduleCleared(cmd.pumpId))

    return { ok: true, value: undefined }
  }
}

/**
 * Handler for PlaceOrderCommand.
 */
export class PlaceOrderHandler {
  constructor(
    private readonly pumpRepository: IPumpRepository,
    private readonly orderRepository: IOrderRepository,
    private readonly eventBus: EventBus
  ) {}

  async execute(cmd: PlaceOrderCommand): Promise<CommandResult<string[]>> {
    // 1. Check if PO already exists
    if (await this.orderRepository.exists(cmd.po)) {
      return { ok: false, error: `PO already exists: ${cmd.po}` }
    }

    // 2. Create the PurchaseOrder aggregate
    const order = new PurchaseOrder({
      po: cmd.po,
      customer: cmd.customer,
      dateReceived: cmd.dateReceived,
      promiseDate: cmd.promiseDate,
      lines: cmd.lines,
    })

    // 3. Get next serial and expand to pumps
    const nextSerial = await this.pumpRepository.getNextSerial()
    const pumps = order.expandToPumps(nextSerial)

    // 4. Persist order and pumps
    await this.orderRepository.save(order)
    await this.pumpRepository.saveMany(pumps)

    // 5. Publish events
    await this.eventBus.publish(
      orderPlaced(cmd.po, cmd.customer, cmd.lines, cmd.promiseDate)
    )

    for (const pump of pumps) {
      await this.eventBus.publish(
        pumpCreated({
          pumpId: pump.id,
          serial: pump.serial,
          model: pump.model,
          customer: pump.customer,
          po: pump.po,
          stage: pump.stage,
          priority: pump.priority,
          value: pump.value,
        })
      )
    }

    return { ok: true, value: pumps.map((p) => p.id) }
  }
}
