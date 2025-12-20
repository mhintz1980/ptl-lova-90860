// src/lib/stage-constants.ts
// Constitution v1.2 §2: Canonical Stage IDs + UI Labels

import type { Stage } from '../types'

/**
 * Canonical stage sequence per Constitution §2.1
 */
export const STAGE_SEQUENCE: Stage[] = [
  'QUEUE',
  'FABRICATION',
  'STAGED_FOR_POWDER',
  'POWDER_COAT',
  'ASSEMBLY',
  'SHIP',
  'CLOSED',
]

/**
 * Production stages (excludes QUEUE)
 */
export const PRODUCTION_STAGES: Stage[] = [
  'FABRICATION',
  'STAGED_FOR_POWDER',
  'POWDER_COAT',
  'ASSEMBLY',
  'SHIP',
  'CLOSED',
]

/**
 * Work stages that consume man-hours and have WIP limits
 * Constitution §3.3, §5.1
 */
export const WORK_STAGES: Stage[] = ['FABRICATION', 'ASSEMBLY', 'SHIP']

/**
 * Stage ID → UI Label mapping
 */
export const STAGE_LABELS: Record<Stage, string> = {
  QUEUE: 'Queue',
  FABRICATION: 'Fabrication',
  STAGED_FOR_POWDER: 'Staged for Powder',
  POWDER_COAT: 'Powder Coat',
  ASSEMBLY: 'Assembly',
  SHIP: 'Ship',
  CLOSED: 'Closed',
}

/**
 * Stage CSS classes for styling
 */
export const STAGE_COLORS: Record<Stage, string> = {
  QUEUE: 'stage-color stage-color-queue',
  FABRICATION: 'stage-color stage-color-fabrication',
  STAGED_FOR_POWDER: 'stage-color stage-color-staged',
  POWDER_COAT: 'stage-color stage-color-powder',
  ASSEMBLY: 'stage-color stage-color-assembly',
  SHIP: 'stage-color stage-color-ship',
  CLOSED: 'stage-color stage-color-closed',
}

/**
 * Legacy stage alias mapping
 * Constitution §2.2: Convert once, enforce canonical everywhere
 */
const LEGACY_STAGE_MAP: Record<string, Stage> = {
  'POWDER COAT': 'POWDER_COAT',
  TESTING: 'SHIP',
  SHIPPING: 'SHIP',
}

/**
 * Migrate legacy stage value to canonical ID
 */
export function migrateLegacyStage(stage: string): Stage {
  // Check legacy mapping first
  const mapped = LEGACY_STAGE_MAP[stage]
  if (mapped) {
    return mapped
  }

  // Already canonical or unknown
  if (STAGE_SEQUENCE.includes(stage as Stage)) {
    return stage as Stage
  }

  console.warn(`Unknown stage "${stage}", defaulting to QUEUE`)
  return 'QUEUE'
}

/**
 * Check if a stage is a work stage (has WIP limits)
 */
export function isWorkStage(stage: Stage): boolean {
  return WORK_STAGES.includes(stage)
}

/**
 * Get display label for a stage
 */
export function getStageLabel(stage: Stage): string {
  return STAGE_LABELS[stage] ?? stage
}
