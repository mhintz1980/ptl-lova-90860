/**
 * Application Commands - Barrel export.
 */
export type { MovePumpStageCommand } from './MovePumpStageCommand'
export { movePumpStageCommand } from './MovePumpStageCommand'

export type {
  SetForecastHintCommand,
  ClearForecastHintCommand,
} from './SetForecastHintCommand'
export {
  setForecastHintCommand,
  clearForecastHintCommand,
} from './SetForecastHintCommand'

export type { PlaceOrderCommand } from './PlaceOrderCommand'
export { placeOrderCommand } from './PlaceOrderCommand'

/**
 * Union of all commands.
 */
export type Command =
  | import('./MovePumpStageCommand').MovePumpStageCommand
  | import('./SetForecastHintCommand').SetForecastHintCommand
  | import('./SetForecastHintCommand').ClearForecastHintCommand
  | import('./PlaceOrderCommand').PlaceOrderCommand
