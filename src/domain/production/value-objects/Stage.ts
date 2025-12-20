/**
 * Stage Value Object - Defines production workflow stages.
 *
 * Constitution v1.2 §2.1: Canonical sequence
 * QUEUE → FABRICATION → STAGED_FOR_POWDER → POWDER_COAT → ASSEMBLY → SHIP → CLOSED
 *
 * Transitions must follow this exact order with no skipping.
 */

// Constitution §2.1: Canonical Stage IDs
export const STAGES = [
  'QUEUE',
  'FABRICATION',
  'STAGED_FOR_POWDER',
  'POWDER_COAT',
  'ASSEMBLY',
  'SHIP',
  'CLOSED',
] as const

export type Stage = (typeof STAGES)[number]

/**
 * Returns the next stage in the production sequence.
 * @param current - The current stage
 * @returns The next stage, or null if current is CLOSED (terminal)
 */
export function getNextStage(current: Stage): Stage | null {
  const currentIndex = STAGES.indexOf(current)
  if (currentIndex === -1 || currentIndex === STAGES.length - 1) {
    return null
  }
  return STAGES[currentIndex + 1]
}

/**
 * Validates whether a stage transition is allowed.
 * Only sequential forward transitions are permitted.
 *
 * @param from - The source stage
 * @param to - The target stage
 * @returns true if transition is valid (to is immediately after from)
 */
export function canTransition(from: Stage, to: Stage): boolean {
  const fromIndex = STAGES.indexOf(from)
  const toIndex = STAGES.indexOf(to)

  // Invalid stages
  if (fromIndex === -1 || toIndex === -1) {
    return false
  }

  // CLOSED is terminal - cannot transition from it
  if (from === 'CLOSED') {
    return false
  }

  // Only allow moving to the immediate next stage
  return toIndex === fromIndex + 1
}
