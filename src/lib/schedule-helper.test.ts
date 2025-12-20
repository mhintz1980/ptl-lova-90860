import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildCapacityAwareTimelines } from './schedule-helper'
import { DEFAULT_CAPACITY_CONFIG } from './capacity'
import { Pump } from '../types'
import { getModelWorkHours } from './seed'

// Mock the seed module to provide work hours for TEST-MODEL
vi.mock('./seed', () => ({
  getModelWorkHours: vi.fn(),
  getModelLeadTimes: vi.fn(),
}))

const mockGetModelWorkHours = vi.mocked(getModelWorkHours)

describe('Schedule Helper - Dynamic Durations', () => {
  const mockPump: Pump = {
    id: 'p1',
    model: 'TEST-MODEL',
    scheduledStart: '2025-01-01T09:00:00.000Z', // Wednesday
    serial: 1,
    po: 'PO1',
    customer: 'C1',
    stage: 'QUEUE',
    priority: 'Normal',
    value: 1000,
    last_update: '',
  }

  const mockLeadTimes = {
    fabrication: 1.5,
    powder_coat: 2,
    assembly: 1,
    ship: 0.25,
    total_days: 5,
  }

  const leadTimeLookup = (_model: string) => mockLeadTimes

  beforeEach(() => {
    // Return work hours for TEST-MODEL
    mockGetModelWorkHours.mockReturnValue({
      fabrication: 12,
      assembly: 8,
      ship: 2,
    })
  })

  it('should calculate durations based on capacity', () => {
    // Setup Config
    const config = { ...DEFAULT_CAPACITY_CONFIG }

    // 1. Fabrication: 4 employees (32h/day). Work: 12h. Duration: 12/32 = 0.375 days -> 1 day.
    config.fabrication = {
      ...config.fabrication,
      employeeCount: 4,
      efficiency: 1.0,
      dailyManHours: 32,
    }

    // 2. Testing: 0.25 employees (2h/day). Work: 2h. Duration: 2/2 = 1.0 days -> 1 day.
    config.ship = {
      ...config.ship,
      employeeCount: 0.25,
      efficiency: 1.0,
      dailyManHours: 2,
    }

    const timelines = buildCapacityAwareTimelines(
      [mockPump],
      config,
      leadTimeLookup
    )
    const blocks = timelines['p1']

    expect(blocks).toBeDefined()

    // Check Fabrication
    // 12h work / 32h per day = 0.375 days → roundToHour = 9/24 = 0.375 days = 9 hours
    const fabBlock = blocks.find((b) => b.stage === 'FABRICATION')
    expect(fabBlock).toBeDefined()
    const fabDurationHours =
      (new Date(fabBlock!.end).getTime() -
        new Date(fabBlock!.start).getTime()) /
      3600000
    expect(fabDurationHours).toBe(9) // 0.375 days with hourly precision

    // Check Testing
    // 2h work / 2h per day = 1.0 day → roundToQuarter = 1.0 days = 24 hours
    const testBlock = blocks.find((b) => b.stage === 'SHIP')
    expect(testBlock).toBeDefined()
    const testDurationHours =
      (new Date(testBlock!.end).getTime() -
        new Date(testBlock!.start).getTime()) /
      3600000
    expect(testDurationHours).toBe(24)
  })
})
