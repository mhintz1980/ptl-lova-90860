import {
  addBusinessDays,
  differenceInCalendarDays,
  startOfDay,
  addDays,
} from 'date-fns'
import type { Pump, Stage, CapacityConfig } from '../types'
import { PRODUCTION_STAGES } from './stage-constants'
import { getModelWorkHours } from './seed'

// Constitution §2.1: Canonical stage keys for duration lookup
type StageKey = 'fabrication' | 'powder_coat' | 'assembly' | 'ship'

export interface StageDurations {
  fabrication: number
  powder_coat: number
  assembly: number
  ship: number // Constitution §2.1: Merged testing+shipping
  total_days?: number
}

export interface StageBlock {
  stage: Stage
  start: Date
  end: Date
  days: number
  pump: Pump
}

export interface CalendarStageEvent {
  id: string
  pumpId: string
  stage: Stage
  title: string
  subtitle: string
  customer?: string
  priority?: Pump['priority']
  idleDays?: number
  week: number
  startDay: number
  span: number
  row: number
  startDate: Date
  endDate: Date
  shipDate?: Date // Final job ship date for tooltip
}

export interface BuildCalendarEventsOptions {
  pumps: Pump[]
  viewStart: Date
  days: number
  leadTimeLookup: (model: string) => StageDurations | undefined
  capacityConfig?: CapacityConfig
}

// Reserved for future use in projection engine\nconst _STAGE_TO_KEY: Record<\n  Exclude<Stage, 'QUEUE' | 'STAGED_FOR_POWDER' | 'CLOSED'>,\n  StageKey\n> = {\n  FABRICATION: 'fabrication',\n  POWDER_COAT: 'powder_coat',\n  ASSEMBLY: 'assembly',\n  SHIP: 'ship', // Constitution §2.1: merged testing+shipping\n}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

const normalizeDays = (value?: number) => Math.max(1, Math.ceil(value ?? 0))

export interface ScheduleWindow {
  startISO: string
  endISO: string
}

export function isValidScheduleDate(
  date: Date,
  today: Date = startOfDay(new Date())
): boolean {
  if (Number.isNaN(date.getTime())) {
    return false
  }
  return differenceInCalendarDays(date, today) >= 0
}

// Constitution \u00a72.1: deriveShippingDays removed - ship duration is now direct from StageDurations

function sanitizeDurations(raw: StageDurations) {
  // Constitution §2.1: Canonical stages from Fabrication to Ship
  const stageKeys: Array<{
    stage: Exclude<Stage, 'QUEUE' | 'STAGED_FOR_POWDER' | 'CLOSED'>
    key: StageKey
  }> = [
    { stage: 'FABRICATION', key: 'fabrication' },
    { stage: 'POWDER_COAT', key: 'powder_coat' },
    { stage: 'ASSEMBLY', key: 'assembly' },
    { stage: 'SHIP', key: 'ship' },
  ]

  return stageKeys.map(({ stage, key }) => ({
    stage,
    days: normalizeDays(
      (raw as Record<StageKey, number | undefined>)[key] as number | undefined
    ),
  }))
}

function resolveScheduleStart(pump: Pump, totalDays: number): Date {
  if (pump.scheduledStart) {
    return startOfDay(new Date(pump.scheduledStart))
  }

  if (pump.scheduledEnd) {
    return startOfDay(addBusinessDays(new Date(pump.scheduledEnd), -totalDays))
  }

  return startOfDay(new Date())
}

export function buildStageTimeline(
  pump: Pump,
  leadTimes: StageDurations,
  options?: { startDate?: Date; capacityConfig?: CapacityConfig }
): StageBlock[] {
  // Helper to round to nearest hour (1/24 of a day)
  const roundToHour = (value: number) => Math.round(value * 24) / 24

  // If capacity config and work hours are present, recalculate durations
  let durations = sanitizeDurations(leadTimes)

  if (options?.capacityConfig) {
    const { capacityConfig } = options
    // Use catalog work_hours, not pump.work_hours (pump may have stale data)
    const work_hours = getModelWorkHours(pump.model)

    if (work_hours) {
      durations = durations.map((d) => {
        let days = d.days

        // Calculate days based on man-hours and capacity - use fractional days
        if (d.stage === 'FABRICATION' && work_hours.fabrication) {
          days = roundToHour(
            work_hours.fabrication / capacityConfig.fabrication.dailyManHours
          )
        } else if (d.stage === 'ASSEMBLY' && work_hours.assembly) {
          days = roundToHour(
            work_hours.assembly / capacityConfig.assembly.dailyManHours
          )
        } else if (d.stage === 'SHIP' && work_hours.ship) {
          // Constitution §2.1: ship replaces testing+shipping
          days = roundToHour(
            work_hours.ship / capacityConfig.ship.dailyManHours
          )
        }
        // Powder Coat remains fixed as it's a vendor lead time

        return { ...d, days: Math.max(0.25, days) }
      })
    }
  }

  if (durations.length === 0) {
    return []
  }

  // For in-production pumps, filter to only show current stage and future stages
  const currentStage = pump.stage
  const isInProduction = currentStage !== 'QUEUE' && currentStage !== 'CLOSED'

  let filteredDurations = durations
  if (isInProduction) {
    const currentStageIndex = PRODUCTION_STAGES.indexOf(currentStage)
    if (currentStageIndex >= 0) {
      // Filter to only include current stage and stages after it
      filteredDurations = durations.filter((d) => {
        const stageIndex = PRODUCTION_STAGES.indexOf(d.stage)
        return stageIndex >= currentStageIndex
      })
    }
  }

  if (filteredDurations.length === 0) {
    return []
  }

  const totalDays = filteredDurations.reduce(
    (sum, entry) => sum + entry.days,
    0
  )
  const timelineStart = startOfDay(
    options?.startDate ?? resolveScheduleStart(pump, totalDays)
  )

  // Helper for fractional days (date-fns addDays truncates decimals)
  const MS_PER_DAY = 24 * 60 * 60 * 1000
  const addFractionalDays = (date: Date, days: number): Date => {
    return new Date(date.getTime() + days * MS_PER_DAY)
  }

  let cursor = timelineStart
  return filteredDurations.map((entry) => {
    const start = cursor
    const end = addFractionalDays(start, entry.days)
    cursor = end
    return { stage: entry.stage, start, end, days: entry.days, pump }
  })
}

function buildEventSegments(
  pump: Pump,
  block: StageBlock,
  viewStart: Date,
  totalDays: number
): CalendarStageEvent[] {
  const segments: CalendarStageEvent[] = []

  // Use fractional day offsets (hours / 24)
  const MS_PER_DAY = 24 * 60 * 60 * 1000
  const differenceInFractionalDays = (a: Date, b: Date) =>
    (a.getTime() - b.getTime()) / MS_PER_DAY

  const startOffset = differenceInFractionalDays(block.start, viewStart)
  const endOffset = differenceInFractionalDays(block.end, viewStart)
  const idleDays = pump.last_update
    ? Math.max(
        0,
        differenceInCalendarDays(
          startOfDay(new Date()),
          new Date(pump.last_update)
        )
      )
    : 0

  if (endOffset <= 0 || startOffset >= totalDays) {
    return segments
  }

  // Calculate the clamped span (minimum 0.25 days = quarter day)
  const clampedStart = clamp(startOffset, 0, totalDays)
  const clampedEnd = clamp(endOffset, 0, totalDays)
  const span = Math.max(0.25, clampedEnd - clampedStart)

  // For fractional days, we create a single segment (no week-wrapping for simplicity)
  const startDay = clampedStart % 7
  const week = Math.floor(clampedStart / 7)

  segments.push({
    id: `${pump.id}-${block.stage}-0`,
    pumpId: pump.id,
    stage: block.stage,
    title: pump.model,
    subtitle: pump.po,
    customer: pump.customer,
    priority: pump.priority,
    idleDays,
    week,
    startDay,
    span,
    row: week,
    startDate: block.start,
    endDate: block.end,
  })

  return segments
}

export function buildCalendarEvents({
  pumps,
  viewStart,
  days,
  leadTimeLookup,
  capacityConfig,
}: BuildCalendarEventsOptions): CalendarStageEvent[] {
  const viewStartDay = startOfDay(viewStart)

  return pumps.flatMap((pump) => {
    const leadTimes = leadTimeLookup(pump.model)
    if (!leadTimes) {
      return []
    }
    const timeline = buildStageTimeline(pump, leadTimes, { capacityConfig })
    return timeline.flatMap((block) =>
      buildEventSegments(pump, block, viewStartDay, days)
    )
  })
}

export function getScheduleWindow(blocks: StageBlock[]): ScheduleWindow | null {
  if (!blocks.length) {
    return null
  }

  const startISO = blocks[0].start.toISOString()
  const endISO = blocks[blocks.length - 1].end.toISOString()
  return { startISO, endISO }
}

export function deriveScheduleWindow(
  pump: Pump,
  leadTimes: StageDurations,
  dropDate: Date,
  capacityConfig?: CapacityConfig
): { timeline: StageBlock[]; window: ScheduleWindow } | null {
  const start = startOfDay(dropDate)
  const timeline = buildStageTimeline(pump, leadTimes, {
    startDate: start,
    capacityConfig,
  })
  const window = getScheduleWindow(timeline)
  if (!window) {
    return null
  }
  return { timeline, window }
}

export interface StageSegment {
  stage: Stage
  startDate: Date
  endDate: Date
  durationDays: number
}

export interface WeekSegment {
  stage: Stage
  startDate: Date
  endDate: Date
  startCol: number
  span: number
}

export function buildStageSegments(
  pump: Pump,
  leadTimes: StageDurations,
  options?: { startDate?: Date; capacityConfig?: CapacityConfig }
): StageSegment[] {
  const timeline = buildStageTimeline(pump, leadTimes, options)
  return timeline.map((block) => ({
    stage: block.stage,
    startDate: block.start,
    endDate: block.end,
    durationDays: Math.max(1, differenceInCalendarDays(block.end, block.start)),
  }))
}

export function projectSegmentsToWeek(
  blocks: StageBlock[],
  weekStart: Date,
  daysInWeek = 7
): WeekSegment[] {
  const weekEnd = addDays(weekStart, daysInWeek)
  const segments: WeekSegment[] = []

  for (const block of blocks) {
    if (block.end <= weekStart || block.start >= weekEnd) {
      continue
    }
    const clampedStart = block.start < weekStart ? weekStart : block.start
    const clampedEnd = block.end > weekEnd ? weekEnd : block.end
    const startCol = differenceInCalendarDays(clampedStart, weekStart)
    const endCol = differenceInCalendarDays(clampedEnd, weekStart)
    const span = Math.max(1, endCol - startCol)

    segments.push({
      stage: block.stage,
      startDate: clampedStart,
      endDate: clampedEnd,
      startCol,
      span,
    })
  }

  return segments
}
