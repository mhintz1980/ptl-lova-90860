/**
 * SetForecastHintCommand - Command to assign a forecast hint to a pump.
 * Constitution §7: Calendar is projection only, not truth.
 */
export interface SetForecastHintCommand {
  readonly type: 'SetForecastHint'
  readonly pumpId: string
  readonly forecastStart: string // ISO string
  readonly forecastEnd: string // ISO string
}

export function setForecastHintCommand(
  pumpId: string,
  forecastStart: string,
  forecastEnd: string
): SetForecastHintCommand {
  return {
    type: 'SetForecastHint',
    pumpId,
    forecastStart,
    forecastEnd,
  }
}

/**
 * ClearForecastHintCommand - Command to remove forecast hint from a pump.
 */
export interface ClearForecastHintCommand {
  readonly type: 'ClearForecastHint'
  readonly pumpId: string
}

export function clearForecastHintCommand(
  pumpId: string
): ClearForecastHintCommand {
  return {
    type: 'ClearForecastHint',
    pumpId,
  }
}
