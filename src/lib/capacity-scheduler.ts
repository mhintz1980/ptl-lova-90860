// src/lib/capacity-scheduler.ts
import { addDays } from 'date-fns'
import type { StageDurations } from './schedule'
import type { Pump } from '../types'

/**
 * Converts a Date to ISO date string (YYYY-MM-DD)
 */
export const toISODate = (date: Date): string =>
  date.toISOString().split('T')[0]

/**
 * Converts an ISO date string to a Date object
 */
export const fromISODate = (iso: string): Date =>
  new Date(`${iso}T00:00:00.000Z`)

/**
 * Adds days to an ISO date string and returns the result as ISO date string
 */
export const addDaysToISODate = (iso: string, delta: number): string =>
  toISODate(addDays(fromISODate(iso), delta))

/**
 * Normalizes duration values to ensure minimum of 1 day
 */
const normalizeDays = (value?: number): number =>
  Math.max(1, Math.ceil(value ?? 0))

/**
 * Computes fabrication and total duration from stage lead times
 * Constitution §2.1: ship replaces testing+shipping
 */
export const computeDurationSummary = (leadTimes: StageDurations) => {
  const fabrication = normalizeDays(leadTimes.fabrication)
  const powder = normalizeDays(leadTimes.powder_coat)
  const assembly = normalizeDays(leadTimes.assembly)
  const ship = normalizeDays(leadTimes.ship) // Constitution §2.1: merged testing+shipping
  const total = fabrication + powder + assembly + ship
  return { fabricationDays: fabrication, totalDays: total }
}

/**
 * Manages daily capacity tracking and placement validation
 */
export class CapacityTracker {
  private usage = new Map<string, number>()

  constructor(private capacity: number) {}

  /**
   * Reserves capacity for a range of days starting from startISO
   */
  reserveDays(startISO: string, days: number): void {
    for (let i = 0; i < days; i++) {
      const dayISO = addDaysToISODate(startISO, i)
      this.usage.set(dayISO, (this.usage.get(dayISO) ?? 0) + 1)
    }
  }

  /**
   * Checks if a job can be placed starting at startISO for the given duration
   */
  canPlace(startISO: string, days: number): boolean {
    if (!Number.isFinite(this.capacity)) return true

    for (let i = 0; i < days; i++) {
      const dayISO = addDaysToISODate(startISO, i)
      if ((this.usage.get(dayISO) ?? 0) >= this.capacity) {
        return false
      }
    }
    return true
  }

  /**
   * Finds the earliest possible start date for a job, trying to pull it forward
   * from the target date without violating capacity constraints
   */
  findEarliestStart(
    targetStart: string,
    minDateISO: string,
    fabricationDays: number
  ): string {
    let earliestStart = targetStart

    while (true) {
      const candidate = addDaysToISODate(earliestStart, -1)

      // Can't go earlier than minimum date
      if (candidate < minDateISO) break

      // Can't place if capacity would be exceeded
      if (!this.canPlace(candidate, fabricationDays)) break

      earliestStart = candidate
    }

    return earliestStart
  }
}

/**
 * Seeds capacity tracker with existing fabrication jobs to prevent overbooking
 */
export const seedCapacityWithExistingJobs = (
  tracker: CapacityTracker,
  pumps: Pump[],
  getModelLeadTimes: (model: string) => StageDurations | undefined
): void => {
  pumps.forEach((pump) => {
    if (pump.stage !== 'FABRICATION' || !pump.forecastStart) return

    const leadTimes = getModelLeadTimes(pump.model)
    if (!leadTimes) return

    const { fabricationDays } = computeDurationSummary(leadTimes)
    tracker.reserveDays(pump.forecastStart, fabricationDays)
  })
}

/**
 * Schedules NOT STARTED jobs by finding the earliest possible start date
 * for each job while respecting capacity constraints
 */
export const scheduleJobsWithCapacity = (
  notStartedPumps: Pump[],
  capacityTracker: CapacityTracker,
  minDateISO: string,
  getModelLeadTimes: (model: string) => StageDurations | undefined
): Array<{ id: string; forecastStart: string; forecastEnd: string }> => {
  // Sort jobs by their scheduled start date (earliest first)
  const sorted = [...notStartedPumps].sort((a, b) => {
    const aTime = fromISODate(a.forecastStart!).getTime()
    const bTime = fromISODate(b.forecastStart!).getTime()
    return aTime - bTime
  })

  const patches: Array<{
    id: string
    forecastStart: string
    forecastEnd: string
  }> = []

  sorted.forEach((pump) => {
    const leadTimes = getModelLeadTimes(pump.model)
    if (!leadTimes) return

    const { fabricationDays, totalDays } = computeDurationSummary(leadTimes)

    // Ensure target start is at least the minimum date
    let targetStart = pump.forecastStart!
    if (!targetStart || targetStart < minDateISO) {
      targetStart = minDateISO
    }

    // Find the earliest possible start date
    const earliestStart = capacityTracker.findEarliestStart(
      targetStart,
      minDateISO,
      fabricationDays
    )

    // Reserve capacity for this job
    capacityTracker.reserveDays(earliestStart, fabricationDays)

    // Calculate end date
    const forecastEnd = addDaysToISODate(earliestStart, totalDays)

    // Only create a patch if dates actually changed
    if (
      earliestStart !== pump.forecastStart ||
      forecastEnd !== pump.forecastEnd
    ) {
      patches.push({
        id: pump.id,
        forecastStart: earliestStart,
        forecastEnd: forecastEnd,
      })
    }
  })

  return patches
}
