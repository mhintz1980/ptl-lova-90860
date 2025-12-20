import { describe, expect, it } from 'vitest'
import { startOfDay } from 'date-fns'
import {
  buildCalendarEvents,
  buildStageTimeline,
  deriveScheduleWindow,
  getScheduleWindow,
  isValidScheduleDate,
  type StageDurations,
} from '../../src/lib/schedule'
import type { Pump } from '../../src/types'

const pump: Pump = {
  id: 'pump-1',
  serial: 1100,
  po: 'PO2025-0001-01',
  customer: 'United Rentals',
  model: 'DD-6',
  stage: 'QUEUE',
  priority: 'Normal',
  last_update: '2025-11-01T00:00:00.000Z',
  value: 28000,
  scheduledStart: '2025-11-10T00:00:00.000Z',
  scheduledEnd: '2025-11-20T00:00:00.000Z',
}

// Constitution §2.1: Canonical StageDurations
const leadTimes: StageDurations = {
  fabrication: 2,
  powder_coat: 3,
  assembly: 1,
  ship: 2, // merged testing+shipping
}

describe('schedule utilities', () => {
  it('builds sequential stage blocks using lead times', () => {
    const blocks = buildStageTimeline(pump, leadTimes)
    // Constitution §2.1: 4 canonical stages in timeline
    expect(blocks).toHaveLength(4)
    expect(blocks.map((b) => b.stage)).toEqual([
      'FABRICATION',
      'POWDER_COAT',
      'ASSEMBLY',
      'SHIP',
    ])
    const expectedStart = startOfDay(new Date(pump.scheduledStart!))
    expect(blocks[0].start.getTime()).toBe(expectedStart.getTime())
    expect(blocks[0].end > blocks[0].start).toBe(true)
    expect(blocks.at(-1)?.end.toISOString()).toBeDefined()
  })

  it('maps stage blocks to weekly calendar events', () => {
    const events = buildCalendarEvents({
      pumps: [pump],
      viewStart: new Date('2025-11-10T00:00:00.000Z'),
      days: 28,
      leadTimeLookup: () => leadTimes,
    })

    // Constitution §2.1: Use canonical POWDER_COAT
    const fabrication = events.find((event) => event.stage === 'FABRICATION')
    const powder = events.find((event) => event.stage === 'POWDER_COAT')
    expect(fabrication).toBeDefined()
    expect(powder).toBeDefined()
    expect(fabrication?.week).toBe(0)
    expect(powder!.startDay).toBeGreaterThanOrEqual(fabrication!.startDay)
  })

  it('returns ISO window boundaries for a timeline', () => {
    const blocks = buildStageTimeline(pump, leadTimes)
    const window = getScheduleWindow(blocks)
    expect(window).toEqual({
      startISO: blocks[0].start.toISOString(),
      endISO: blocks[blocks.length - 1].end.toISOString(),
    })
  })

  it("validates schedule drops against today's date", () => {
    const reference = startOfDay(new Date('2025-11-10T00:00:00.000Z'))
    expect(
      isValidScheduleDate(new Date('2025-11-10T00:00:00.000Z'), reference)
    ).toBe(true)
    expect(
      isValidScheduleDate(new Date('2025-11-12T00:00:00.000Z'), reference)
    ).toBe(true)
    expect(
      isValidScheduleDate(new Date('2025-11-09T00:00:00.000Z'), reference)
    ).toBe(false)
  })

  it('derives schedule windows from calendar drops', () => {
    const dropDate = new Date('2025-11-15T00:00:00.000Z')
    const result = deriveScheduleWindow(pump, leadTimes, dropDate)
    expect(result).not.toBeNull()
    expect(result?.window.startISO).toBe(startOfDay(dropDate).toISOString())
    expect(result?.timeline.length).toBeGreaterThan(0)
  })
})
