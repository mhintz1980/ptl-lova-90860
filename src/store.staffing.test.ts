import { describe, it, expect, beforeEach } from 'vitest'
import { useApp } from './store'
import { getStageCapacity } from './lib/capacity'

describe('Department Staffing Logic', () => {
  beforeEach(() => {
    useApp.getState().resetCapacityDefaults()
  })

  it('should initialize with default values', () => {
    const { capacityConfig } = useApp.getState()
    const fab = capacityConfig.fabrication
    const ship = capacityConfig.ship

    // Constitution §2.1: Merged testing+shipping into ship
    expect(fab.employeeCount).toBe(4)
    expect(fab.efficiency).toBe(0.875)
    expect(fab.dailyManHours).toBe(28) // 4 * 8 * 0.875

    expect(ship.employeeCount).toBe(0.56) // Combined testing (0.28) + shipping (0.28)
    expect(ship.dailyManHours).toBe(4) // Combined 2 + 2
  })

  it('should update dailyManHours when employeeCount changes (decimal)', () => {
    const { updateDepartmentStaffing } = useApp.getState()

    updateDepartmentStaffing('fabrication', { employeeCount: 2.5 })

    const fab = useApp.getState().capacityConfig.fabrication
    expect(fab.employeeCount).toBe(2.5)
    expect(fab.dailyManHours).toBeCloseTo(2.5 * 8 * 0.875) // ~17.5
  })

  it('should update dailyManHours when employeeCount changes', () => {
    const { updateDepartmentStaffing } = useApp.getState()

    updateDepartmentStaffing('fabrication', { employeeCount: 10 })

    const fab = useApp.getState().capacityConfig.fabrication
    expect(fab.employeeCount).toBe(10)
    expect(fab.dailyManHours).toBeCloseTo(10 * 8 * 0.875) // 70
  })

  it('should update dailyManHours when efficiency changes', () => {
    const { updateDepartmentStaffing } = useApp.getState()

    updateDepartmentStaffing('fabrication', { efficiency: 1.0 })

    const fab = useApp.getState().capacityConfig.fabrication
    expect(fab.efficiency).toBe(1.0)
    expect(fab.dailyManHours).toBeCloseTo(4 * 8 * 1.0) // 32
  })

  it('should update efficiency when dailyManHours changes', () => {
    const { updateDepartmentStaffing } = useApp.getState()

    // Set man hours to 16 (which for 4 employees * 8 hours = 32 capacity, means 50% efficiency)
    updateDepartmentStaffing('fabrication', { dailyManHours: 16 })

    const fab = useApp.getState().capacityConfig.fabrication
    expect(fab.dailyManHours).toBe(16)
    expect(fab.efficiency).toBeCloseTo(0.5)
  })

  it('should calculate correct weekly capacity', () => {
    const { updateDepartmentStaffing } = useApp.getState()

    // Default: 4 employees * 8 hours * 0.85 eff = 27.2 daily man hours
    // Weekly man hours = 27.2 * 5 = 136
    // Man hours per pump (Fab) = 4 days * 8 hours = 32
    // Capacity = floor(136 / 32) = 4 pumps/week

    const config = useApp.getState().capacityConfig
    const cap = getStageCapacity('FABRICATION', config)
    expect(cap).toBe(4)

    // Increase employees to 8
    // Daily = 8 * 8 * 0.85 = 54.4
    // Weekly = 272
    // Capacity = floor(272 / 32) = 8.5 -> 8 pumps/week
    updateDepartmentStaffing('fabrication', { employeeCount: 8 })
    const config2 = useApp.getState().capacityConfig
    const cap2 = getStageCapacity('FABRICATION', config2)
    expect(cap2).toBe(8)
  })
})
