import { describe, it, expect } from 'vitest'
import { STAGES, getNextStage, canTransition } from './Stage'

describe('Stage Value Object', () => {
  describe('STAGES constant', () => {
    // Constitution §2.1: Canonical Stage IDs
    it('should have 7 canonical stages in the correct order', () => {
      expect(STAGES).toEqual([
        'QUEUE',
        'FABRICATION',
        'STAGED_FOR_POWDER',
        'POWDER_COAT',
        'ASSEMBLY',
        'SHIP',
        'CLOSED',
      ])
      expect(STAGES.length).toBe(7)
    })
  })

  describe('getNextStage', () => {
    it('should return FABRICATION as next stage after QUEUE', () => {
      expect(getNextStage('QUEUE')).toBe('FABRICATION')
    })

    it('should return STAGED_FOR_POWDER as next stage after FABRICATION', () => {
      expect(getNextStage('FABRICATION')).toBe('STAGED_FOR_POWDER')
    })

    it('should return POWDER_COAT as next stage after STAGED_FOR_POWDER', () => {
      expect(getNextStage('STAGED_FOR_POWDER')).toBe('POWDER_COAT')
    })

    it('should return ASSEMBLY as next stage after POWDER_COAT', () => {
      expect(getNextStage('POWDER_COAT')).toBe('ASSEMBLY')
    })

    it('should return SHIP as next stage after ASSEMBLY', () => {
      expect(getNextStage('ASSEMBLY')).toBe('SHIP')
    })

    it('should return CLOSED as next stage after SHIP', () => {
      expect(getNextStage('SHIP')).toBe('CLOSED')
    })

    it('should return null for CLOSED (terminal stage)', () => {
      expect(getNextStage('CLOSED')).toBeNull()
    })
  })

  describe('canTransition', () => {
    // Blueprint-required test assertions
    it('should allow transition from QUEUE to FABRICATION', () => {
      expect(canTransition('QUEUE', 'FABRICATION')).toBe(true)
    })

    it('should NOT allow skipping stages (QUEUE to SHIP)', () => {
      expect(canTransition('QUEUE', 'SHIP')).toBe(false)
    })

    it('should NOT allow transition from CLOSED (terminal)', () => {
      expect(canTransition('CLOSED', 'QUEUE')).toBe(false)
    })

    // Constitution §2.1: All valid sequential transitions
    it('should allow all valid sequential transitions', () => {
      expect(canTransition('QUEUE', 'FABRICATION')).toBe(true)
      expect(canTransition('FABRICATION', 'STAGED_FOR_POWDER')).toBe(true)
      expect(canTransition('STAGED_FOR_POWDER', 'POWDER_COAT')).toBe(true)
      expect(canTransition('POWDER_COAT', 'ASSEMBLY')).toBe(true)
      expect(canTransition('ASSEMBLY', 'SHIP')).toBe(true)
      expect(canTransition('SHIP', 'CLOSED')).toBe(true)
    })

    // Additional coverage for invalid transitions
    it('should NOT allow backward transitions', () => {
      expect(canTransition('FABRICATION', 'QUEUE')).toBe(false)
      expect(canTransition('CLOSED', 'SHIP')).toBe(false)
    })

    it('should NOT allow skipping multiple stages', () => {
      expect(canTransition('QUEUE', 'ASSEMBLY')).toBe(false)
      expect(canTransition('FABRICATION', 'SHIP')).toBe(false)
    })

    it('should NOT allow staying in the same stage', () => {
      expect(canTransition('QUEUE', 'QUEUE')).toBe(false)
      expect(canTransition('SHIP', 'SHIP')).toBe(false)
    })
  })
})
