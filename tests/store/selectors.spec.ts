import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useApp } from '../../src/store'
import type { Pump, Stage } from '../../src/types'
import {
  getModelLeadTimes as catalogLeadTimes,
  getModelWorkHours as catalogWorkHours,
} from '../../src/lib/seed'

vi.mock('../../src/adapters/local', () => ({
  LocalAdapter: {
    load: vi.fn().mockResolvedValue([]),
    upsertMany: vi.fn(),
    update: vi.fn(),
    replaceAll: vi.fn(),
  },
}))

vi.mock('../../src/lib/seed', () => ({
  getModelLeadTimes: vi.fn(),
  getModelWorkHours: vi.fn(),
}))

const mockGetModelLeadTimes = vi.mocked(catalogLeadTimes)
const mockGetModelWorkHours = vi.mocked(catalogWorkHours)

const resetStore = () => {
  useApp.setState((state) => ({
    ...state,
    pumps: [],
    filters: {},
    loading: false,
  }))
  mockGetModelLeadTimes.mockReset()
  mockGetModelWorkHours.mockReset()
}

describe('store selectors', () => {
  beforeEach(() => {
    resetStore()
  })

  describe('getModelLeadTimes', () => {
    it('returns catalog durations for known models', () => {
      const sample = {
        fabrication: 2,
        powder_coat: 1,
        assembly: 1,
        ship: 1,
        total_days: 7,
      }
      mockGetModelLeadTimes.mockReturnValue(sample)

      const result = useApp.getState().getModelLeadTimes('DD-6')
      expect(result).toEqual(sample)
      expect(mockGetModelLeadTimes).toHaveBeenCalledWith('DD-6')
    })

    it('bubbles undefined when catalog misses the model', () => {
      mockGetModelLeadTimes.mockReturnValue(undefined)
      expect(useApp.getState().getModelLeadTimes('UNKNOWN')).toBeUndefined()
    })

    it('does not memoize across models', () => {
      mockGetModelLeadTimes
        .mockReturnValueOnce({
          fabrication: 1,
          powder_coat: 1,
          assembly: 1,
          ship: 1,
          total_days: 4,
        })
        .mockReturnValueOnce({
          fabrication: 3,
          powder_coat: 2,
          assembly: 1,
          ship: 1,
          total_days: 7,
        })

      const { getModelLeadTimes } = useApp.getState()
      expect(getModelLeadTimes('DD-4')?.fabrication).toBe(1)
      expect(getModelLeadTimes('DD-8')?.fabrication).toBe(3)
      expect(mockGetModelLeadTimes).toHaveBeenCalledTimes(2)
    })
  })

  describe('filtered selector', () => {
    const basePumps: Pump[] = [
      {
        id: 'pump-1',
        serial: 1001,
        po: 'PO-1',
        customer: 'A Corp',
        model: 'DD-6',
        stage: 'FABRICATION',
        priority: 'Normal',
        last_update: '2025-01-01T00:00:00.000Z',
        value: 25000,
        powder_color: 'Blue',
      },
      {
        id: 'pump-2',
        serial: 1002,
        po: 'PO-2',
        customer: 'B Corp',
        model: 'DD-8',
        stage: 'SHIP', // Constitution: TESTING merged to SHIP
        priority: 'High',
        last_update: '2025-01-02T00:00:00.000Z',
        value: 52000,
        powder_color: 'Black',
      },
    ]

    beforeEach(() => {
      resetStore()
      useApp.setState((state) => ({ ...state, pumps: basePumps, filters: {} }))
    })

    it('returns all pumps when no filters are applied', () => {
      expect(useApp.getState().filtered()).toHaveLength(2)
    })

    it('filters by exact stage', () => {
      useApp.getState().setFilters({ stage: 'SHIP' as Stage })
      const result = useApp.getState().filtered()
      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe('pump-2')
    })

    it('performs case-insensitive text search', () => {
      useApp.getState().setFilters({ q: 'a corp' })
      const result = useApp.getState().filtered()
      expect(result).toHaveLength(1)
      expect(result[0]?.customer).toBe('A Corp')
    })

    it('combines search and field filters', () => {
      useApp.getState().setFilters({ q: 'po-2', priority: 'High' })
      const result = useApp.getState().filtered()
      expect(result).toHaveLength(1)
      expect(result[0]?.po).toBe('PO-2')
    })
  })

  describe('setForecastHint', () => {
    const scheduledPump: Pump = {
      id: 'schedule-me',
      serial: 2001,
      po: 'PO-SCHED',
      customer: 'Scheduler',
      model: 'DD-12',
      stage: 'QUEUE',
      priority: 'Normal',
      last_update: '2025-01-01T00:00:00.000Z',
      value: 44000,
    }

    beforeEach(() => {
      resetStore()
      useApp.setState((state) => ({ ...state, pumps: [scheduledPump] }))
    })

    it('applies scheduled dates and advances stage when lead times exist', () => {
      mockGetModelLeadTimes.mockReturnValue({
        fabrication: 2,
        powder_coat: 1,
        assembly: 1,
        ship: 1,
        total_days: 7,
      })
      mockGetModelWorkHours.mockReturnValue({
        fabrication: 24,
        assembly: 12,
        ship: 4,
      })

      useApp.getState().setForecastHint('schedule-me', '2025-02-10')
      const pump = useApp.getState().pumps[0]

      expect(pump?.forecastStart).toContain('2025-02-10')
      expect(pump?.forecastEnd).toBeDefined()
      expect(pump?.stage).toBe('QUEUE')
      expect(pump?.last_update).toBeTruthy()
    })

    it('does nothing if lead times are missing', () => {
      mockGetModelLeadTimes.mockReturnValue(undefined)
      useApp.getState().setForecastHint('schedule-me', '2025-02-10')
      const pump = useApp.getState().pumps[0]
      expect(pump?.forecastStart).toBeUndefined()
      expect(pump?.stage).toBe('QUEUE')
    })

    it('gracefully ignores unknown pump ids', () => {
      mockGetModelLeadTimes.mockReturnValue({
        fabrication: 1,
        powder_coat: 1,
        assembly: 1,
        ship: 1,
        total_days: 4,
      })
      mockGetModelWorkHours.mockReturnValue({
        fabrication: 12,
        assembly: 8,
        ship: 2,
      })
      useApp.getState().setForecastHint('missing-id', '2025-02-10')
      expect(useApp.getState().pumps[0]?.stage).toBe('QUEUE')
    })
  })

  describe('clearForecastHint', () => {
    const pumpWithSchedule: Pump = {
      id: 'clear-me',
      serial: 3010,
      po: 'PO-CLEAR',
      customer: 'Clear Corp',
      model: 'DD-4',
      stage: 'FABRICATION',
      priority: 'Rush',
      last_update: '2025-01-01T00:00:00.000Z',
      value: 30000,
      forecastStart: '2025-02-01',
      forecastEnd: '2025-02-06',
    }

    beforeEach(() => {
      resetStore()
      useApp.setState((state) => ({ ...state, pumps: [pumpWithSchedule] }))
    })

    it('resets scheduling fields and stage', () => {
      useApp.getState().clearForecastHint('clear-me')
      const pump = useApp.getState().pumps[0]

      expect(pump?.forecastStart).toBeUndefined()
      expect(pump?.forecastEnd).toBeUndefined()
      expect(pump?.stage).toBe('QUEUE')
      expect(pump?.last_update).toBeTruthy()
    })

    it('ignores unknown ids', () => {
      useApp.getState().clearForecastHint('unknown')
      expect(useApp.getState().pumps[0]?.stage).toBe('FABRICATION')
    })
  })
})
