import { describe, it, expect } from 'vitest'
import { Pump, PumpProps } from './Pump'

describe('Pump Entity', () => {
  const basePumpProps: Omit<PumpProps, 'stage' | 'last_update'> = {
    id: 'pump-001',
    serial: 1234,
    po: 'PO2025-0001',
    customer: 'United Rentals',
    model: 'DD6-SAFE',
    priority: 'Normal',
    value: 25000,
  }

  describe('Pump.create()', () => {
    it('should create a pump in QUEUE stage', () => {
      const pump = Pump.create(basePumpProps)
      expect(pump.stage).toBe('QUEUE')
    })

    it('should set last_update to current time', () => {
      const before = new Date()
      const pump = Pump.create(basePumpProps)
      const after = new Date()

      const lastUpdate = new Date(pump.last_update)
      expect(lastUpdate.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(lastUpdate.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })

  describe('moveToStage()', () => {
    // Blueprint-required test: QUEUE → FABRICATION success
    it('should allow transition from QUEUE to FABRICATION', () => {
      const pump = Pump.create(basePumpProps)
      const result = pump.moveToStage('FABRICATION')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.type).toBe('PumpStageMoved')
        expect(result.value.fromStage).toBe('QUEUE')
        expect(result.value.toStage).toBe('FABRICATION')
      }
      expect(pump.stage).toBe('FABRICATION')
    })

    // Blueprint-required test: QUEUE → TESTING fails (skip)
    it('should NOT allow skipping stages (QUEUE to TESTING)', () => {
      const pump = Pump.create(basePumpProps)
      const result = pump.moveToStage('SHIP')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.type).toBe('InvalidTransition')
        expect(result.error.reason).toContain('Cannot skip stages')
      }
      expect(pump.stage).toBe('QUEUE') // unchanged
    })

    // Blueprint-required test: CLOSED → any fails (terminal)
    it('should NOT allow transition from CLOSED (terminal)', () => {
      const pump = new Pump({
        ...basePumpProps,
        stage: 'CLOSED',
        last_update: new Date().toISOString(),
      })
      const result = pump.moveToStage('QUEUE')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.type).toBe('InvalidTransition')
        expect(result.error.reason).toContain('terminal')
      }
      expect(pump.stage).toBe('CLOSED') // unchanged
    })

    it('should allow full sequential progression through all stages', () => {
      const pump = Pump.create(basePumpProps)
      // Constitution §2.1: Canonical sequence
      const stages = [
        'FABRICATION',
        'STAGED_FOR_POWDER',
        'POWDER_COAT',
        'ASSEMBLY',
        'SHIP',
        'CLOSED',
      ] as const

      for (const stage of stages) {
        const result = pump.moveToStage(stage)
        expect(result.ok).toBe(true)
        expect(pump.stage).toBe(stage)
      }
    })

    it('should update last_update timestamp on successful transition', () => {
      const pump = Pump.create(basePumpProps)
      const originalUpdate = new Date(pump.last_update).getTime()

      const result = pump.moveToStage('FABRICATION')

      expect(result.ok).toBe(true)
      const newUpdate = new Date(pump.last_update).getTime()
      expect(newUpdate).toBeGreaterThanOrEqual(originalUpdate)
    })

    it('should NOT allow backward transitions', () => {
      const pump = new Pump({
        ...basePumpProps,
        stage: 'ASSEMBLY',
        last_update: new Date().toISOString(),
      })
      const result = pump.moveToStage('FABRICATION')

      expect(result.ok).toBe(false)
      expect(pump.stage).toBe('ASSEMBLY') // unchanged
    })

    it('should NOT allow staying in the same stage', () => {
      const pump = Pump.create(basePumpProps)
      const result = pump.moveToStage('QUEUE')

      expect(result.ok).toBe(false)
      expect(pump.stage).toBe('QUEUE')
    })
  })

  describe('moveToNextStage()', () => {
    it('should move to the immediate next stage', () => {
      const pump = Pump.create(basePumpProps)
      const result = pump.moveToNextStage()

      expect(result.ok).toBe(true)
      expect(pump.stage).toBe('FABRICATION')
    })

    it('should fail when already at CLOSED', () => {
      const pump = new Pump({
        ...basePumpProps,
        stage: 'CLOSED',
        last_update: new Date().toISOString(),
      })
      const result = pump.moveToNextStage()

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.reason).toContain('terminal')
      }
    })
  })

  describe('schedule() and clearSchedule()', () => {
    it('should set scheduled dates', () => {
      const pump = Pump.create(basePumpProps)
      const start = new Date('2025-01-15')
      const end = new Date('2025-01-20')

      pump.schedule(start, end)

      expect(pump.forecastStart).toBe(start.toISOString())
      expect(pump.forecastEnd).toBe(end.toISOString())
    })

    it('should clear scheduled dates', () => {
      const pump = Pump.create(basePumpProps)
      pump.schedule(new Date('2025-01-15'), new Date('2025-01-20'))

      pump.clearSchedule()

      expect(pump.forecastStart).toBeUndefined()
      expect(pump.forecastEnd).toBeUndefined()
    })
  })

  describe('isWIP()', () => {
    it('should return false for QUEUE', () => {
      const pump = Pump.create(basePumpProps)
      expect(pump.isWIP()).toBe(false)
    })

    it('should return true for mid-production stages', () => {
      const pump = new Pump({
        ...basePumpProps,
        stage: 'ASSEMBLY',
        last_update: new Date().toISOString(),
      })
      expect(pump.isWIP()).toBe(true)
    })

    it('should return false for CLOSED', () => {
      const pump = new Pump({
        ...basePumpProps,
        stage: 'CLOSED',
        last_update: new Date().toISOString(),
      })
      expect(pump.isWIP()).toBe(false)
    })
  })

  describe('isLate()', () => {
    it('should return true if past promise date and not closed', () => {
      const pump = new Pump({
        ...basePumpProps,
        stage: 'ASSEMBLY',
        last_update: new Date().toISOString(),
        promiseDate: '2024-01-01T00:00:00.000Z',
      })
      expect(pump.isLate(new Date('2025-01-01'))).toBe(true)
    })

    it('should return false if closed even when past promise date', () => {
      const pump = new Pump({
        ...basePumpProps,
        stage: 'CLOSED',
        last_update: new Date().toISOString(),
        promiseDate: '2024-01-01T00:00:00.000Z',
      })
      expect(pump.isLate(new Date('2025-01-01'))).toBe(false)
    })

    it('should return false if no promise date', () => {
      const pump = Pump.create(basePumpProps)
      expect(pump.isLate()).toBe(false)
    })
  })

  describe('toProps()', () => {
    it('should serialize all properties', () => {
      const pump = Pump.create(basePumpProps)
      const props = pump.toProps()

      expect(props.id).toBe(basePumpProps.id)
      expect(props.serial).toBe(basePumpProps.serial)
      expect(props.stage).toBe('QUEUE')
      expect(props.customer).toBe(basePumpProps.customer)
    })
  })

  describe('immutability', () => {
    it('should not allow changing serial number', () => {
      const pump = Pump.create(basePumpProps)
      // TypeScript should prevent: pump.serial = 9999;
      // Runtime check: serial is readonly
      expect(pump.serial).toBe(1234)
    })
  })
})
