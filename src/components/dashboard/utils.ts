import { Pump } from '../../types'
import { DashboardFilters } from './dashboardConfig'
import { isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns'

export function applyDashboardFilters(
  pumps: Pump[],
  filters: DashboardFilters
): Pump[] {
  return pumps.filter((pump) => {
    // Date Range (based on last_update or forecastEnd? Plan didn't specify, assuming last_update or relevant date)
    // Let's use last_update for now as it's generic, or maybe forecastEnd if we are looking at schedule.
    // For general dashboard, maybe we don't filter by date unless specified.
    if (filters.dateRange.from && filters.dateRange.to) {
      const date = parseISO(pump.last_update)
      if (
        !isWithinInterval(date, {
          start: startOfDay(filters.dateRange.from),
          end: endOfDay(filters.dateRange.to),
        })
      ) {
        return false
      }
    }

    if (filters.customerId && pump.customer !== filters.customerId) {
      return false
    }

    if (filters.modelId && pump.model !== filters.modelId) {
      return false
    }

    if (filters.stage && pump.stage !== filters.stage) {
      return false
    }

    // Department mapping (if needed, for now assuming stage maps to department)
    if (filters.department) {
      // Map department to stages (Constitution v1.2 canonical stages)
      const deptStages: Record<string, string[]> = {
        Fabrication: ['FABRICATION'],
        'Powder Coat': ['STAGED_FOR_POWDER', 'POWDER_COAT'],
        Assembly: ['ASSEMBLY'],
        Ship: ['SHIP'], // Constitution: TESTING+SHIPPING merged to SHIP
      }
      const allowedStages = deptStages[filters.department]
      if (allowedStages && !allowedStages.includes(pump.stage)) {
        return false
      }
    }

    return true
  })
}
