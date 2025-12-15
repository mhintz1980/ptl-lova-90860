import { describe, it, expect } from 'vitest';
import { STAGES, getNextStage, canTransition } from './Stage';

describe('Stage Value Object', () => {
    describe('STAGES constant', () => {
        it('should have 7 stages in the correct order', () => {
            expect(STAGES).toEqual([
                'QUEUE',
                'FABRICATION',
                'POWDER_COAT',
                'ASSEMBLY',
                'TESTING',
                'SHIPPING',
                'CLOSED',
            ]);
            expect(STAGES.length).toBe(7);
        });
    });

    describe('getNextStage', () => {
        it('should return FABRICATION as next stage after QUEUE', () => {
            expect(getNextStage('QUEUE')).toBe('FABRICATION');
        });

        it('should return POWDER_COAT as next stage after FABRICATION', () => {
            expect(getNextStage('FABRICATION')).toBe('POWDER_COAT');
        });

        it('should return ASSEMBLY as next stage after POWDER_COAT', () => {
            expect(getNextStage('POWDER_COAT')).toBe('ASSEMBLY');
        });

        it('should return TESTING as next stage after ASSEMBLY', () => {
            expect(getNextStage('ASSEMBLY')).toBe('TESTING');
        });

        it('should return SHIPPING as next stage after TESTING', () => {
            expect(getNextStage('TESTING')).toBe('SHIPPING');
        });

        it('should return CLOSED as next stage after SHIPPING', () => {
            expect(getNextStage('SHIPPING')).toBe('CLOSED');
        });

        it('should return null for CLOSED (terminal stage)', () => {
            expect(getNextStage('CLOSED')).toBeNull();
        });
    });

    describe('canTransition', () => {
        // Blueprint-required test assertions
        it('should allow transition from QUEUE to FABRICATION', () => {
            expect(canTransition('QUEUE', 'FABRICATION')).toBe(true);
        });

        it('should NOT allow skipping stages (QUEUE to TESTING)', () => {
            expect(canTransition('QUEUE', 'TESTING')).toBe(false);
        });

        it('should NOT allow transition from CLOSED (terminal)', () => {
            expect(canTransition('CLOSED', 'QUEUE')).toBe(false);
        });

        // Additional coverage for all valid transitions
        it('should allow all valid sequential transitions', () => {
            expect(canTransition('FABRICATION', 'POWDER_COAT')).toBe(true);
            expect(canTransition('POWDER_COAT', 'ASSEMBLY')).toBe(true);
            expect(canTransition('ASSEMBLY', 'TESTING')).toBe(true);
            expect(canTransition('TESTING', 'SHIPPING')).toBe(true);
            expect(canTransition('SHIPPING', 'CLOSED')).toBe(true);
        });

        // Additional coverage for invalid transitions
        it('should NOT allow backward transitions', () => {
            expect(canTransition('FABRICATION', 'QUEUE')).toBe(false);
            expect(canTransition('CLOSED', 'SHIPPING')).toBe(false);
        });

        it('should NOT allow skipping multiple stages', () => {
            expect(canTransition('QUEUE', 'ASSEMBLY')).toBe(false);
            expect(canTransition('FABRICATION', 'TESTING')).toBe(false);
        });

        it('should NOT allow staying in the same stage', () => {
            expect(canTransition('QUEUE', 'QUEUE')).toBe(false);
            expect(canTransition('TESTING', 'TESTING')).toBe(false);
        });
    });
});
