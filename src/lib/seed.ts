// src/lib/seed.ts
import { Pump, Stage, Priority } from '../types'
import { nanoid } from 'nanoid'
import catalogData from '../data/pumptracker-data.json'

// Type definitions for catalog data
interface CatalogModel {
  model: string
  description: string
  price: number | null
  bom: {
    engine: string | null
    gearbox: string | null
    control_panel: string | null
  }
  lead_times: {
    fabrication: number
    powder_coat: number
    assembly: number
    testing: number
    total_days: number
  }
  work_hours?: {
    fabrication: number
    assembly: number
    testing: number
    shipping: number
  }
}

interface CatalogData {
  models: CatalogModel[]
  customers: string[]
  productionStages: string[]
}

// Constitution §2.1: Transform legacy lead_times to canonical format
export function getModelLeadTimes(
  modelCode: string
):
  | { fabrication: number; powder_coat: number; assembly: number; ship: number }
  | undefined {
  const model = CATALOG_MODELS.find((m) => m.model === modelCode)
  if (!model) return undefined
  return {
    fabrication: model.lead_times.fabrication,
    powder_coat: model.lead_times.powder_coat,
    assembly: model.lead_times.assembly,
    ship: model.lead_times.testing, // testing is the primary duration
  }
}

// Constitution §2.1: Transform legacy work_hours to canonical format
export function getModelWorkHours(
  modelCode: string
): { fabrication: number; assembly: number; ship: number } | undefined {
  const model = CATALOG_MODELS.find((m) => m.model === modelCode)
  if (!model?.work_hours) return undefined
  return {
    fabrication: model.work_hours.fabrication,
    assembly: model.work_hours.assembly,
    ship: (model.work_hours.testing ?? 0) + (model.work_hours.shipping ?? 0),
  }
}

// Stage name conversion: Title Case → Canonical IDs
function convertStageName(stageName: string): Stage {
  const stageMap: Record<string, Stage> = {
    'Not Started': 'QUEUE',
    Fabrication: 'FABRICATION',
    'Powder Coat': 'POWDER_COAT', // Constitution §2.2: underscore
    Assembly: 'ASSEMBLY',
    Testing: 'SHIP', // Constitution §2.2: merged
    Shipping: 'SHIP', // Constitution §2.2: merged
    CLOSED: 'CLOSED',
  }
  return stageMap[stageName] || 'QUEUE'
}

// Get production stages from catalog and add CLOSED
const CATALOG_STAGES: Stage[] = [
  ...(catalogData as CatalogData).productionStages.map(convertStageName),
  'CLOSED',
]

// Customers from catalog
const CUSTOMERS = (catalogData as CatalogData).customers

// Models from catalog
const CATALOG_MODELS = (catalogData as CatalogData).models

// Colors for powder coating
const COLORS = [
  'Red',
  'Blue',
  'Green',
  'Yellow',
  'Black',
  'White',
  'Orange',
  'Gray',
]

// Price fallback logic
function getEffectivePrice(basePrice: number | null, model: string): number {
  if (basePrice !== null) return basePrice

  // Fallback prices for models with null prices
  if (model.includes('SAFE')) return model.includes('4') ? 32000 : 52000
  if (model.includes('RL')) return 48000 // Rotary Lobe
  if (model.includes('HC')) return 38000 // High Capacity

  // Default fallback
  return 28000
}

// BOM component fallback logic
function getBomComponent(
  component: string | null,
  type: string
): string | null {
  if (component !== null) return component

  // Standard fallbacks
  const fallbacks: Record<string, string> = {
    engine: 'STANDARD ENGINE',
    gearbox: 'STANDARD GEARBOX',
    control_panel: 'STANDARD CONTROL',
  }

  return fallbacks[type] || null
}

// Serial number management
const usedSerials = new Set<number>()
let nextSerial = 1000

function genSerial(): number {
  let serial: number
  do {
    serial = nextSerial++
  } while (usedSerials.has(serial))
  usedSerials.add(serial)
  return serial
}

// Business day calculation (excludes weekends)
function addBusinessDays(startDate: Date, days: number): Date {
  const result = new Date(startDate)
  let businessDays = 0

  while (businessDays < days) {
    result.setDate(result.getDate() + 1)
    const dayOfWeek = result.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Not Saturday (6) or Sunday (0)
      businessDays++
    }
  }
  return result
}

// PO number generation
let poCounter = 1
function genPONumber(): string {
  return `PO2025-${String(poCounter++).padStart(4, '0')}`
}

// Priority assignment logic
function assignPriority(model: CatalogModel): Priority {
  if (model.model.includes('SAFE')) return 'High'
  if (model.model.includes('HP')) return 'Normal'
  if (model.model.includes('RL')) return 'Normal'
  return 'Normal' // Default priority
}

// Generate deterministic pump from catalog model
function generatePumpFromCatalog(
  model: CatalogModel,
  customer: string,
  poBase: string,
  quantity: number,
  startIndex: number
): Pump[] {
  const pumps: Pump[] = []
  const basePrice = getEffectivePrice(model.price, model.model)
  const priority = assignPriority(model)
  const hasColor = Math.random() > 0.3 // 70% have powder coat

  for (let i = 0; i < quantity; i++) {
    const serial = genSerial()
    const po = `${poBase}-${String(startIndex + i + 1).padStart(2, '0')}`

    // Generate realistic schedule based on lead times
    // Spread POs across past 60 days to ensure variety in stages
    const now = new Date()
    const daysBack = Math.floor(Math.random() * 60) // 0-60 days ago
    const poDate = addBusinessDays(now, -daysBack)
    const fabricationStart = addBusinessDays(
      poDate,
      Math.floor(Math.random() * 5)
    ) // Start within 5 days
    const fabricationEnd = addBusinessDays(
      fabricationStart,
      model.lead_times.fabrication
    )
    const powderCoatEnd = addBusinessDays(
      fabricationEnd,
      model.lead_times.powder_coat
    )
    const assemblyEnd = addBusinessDays(
      powderCoatEnd,
      model.lead_times.assembly
    )
    const testingEnd = addBusinessDays(assemblyEnd, model.lead_times.testing)

    // Generate promise date (2-7 days before scheduled end)
    // Some pumps (20%) will have promise dates in the past to create "late orders"
    const promiseDaysBefore = Math.floor(Math.random() * 6) + 2 // 2-7 days
    const isIntentionallyLate = Math.random() < 0.2 // 20% chance
    const promiseDate = isIntentionallyLate
      ? addBusinessDays(now, -Math.floor(Math.random() * 10) - 1) // 1-10 days ago
      : addBusinessDays(testingEnd, -promiseDaysBefore)

    // Determine current stage based on dates
    let currentStage: Stage = 'QUEUE'
    let lastUpdate = poDate.toISOString()
    const forecastEnd = testingEnd.toISOString()

    const nowTime = now.getTime()
    if (nowTime >= testingEnd.getTime()) {
      currentStage = Math.random() > 0.6 ? 'CLOSED' : 'SHIP' // 40% CLOSED, 60% SHIP
      lastUpdate = testingEnd.toISOString()
    } else if (nowTime >= assemblyEnd.getTime()) {
      currentStage = 'SHIP' // Constitution §2.1: merged testing+shipping
      lastUpdate = assemblyEnd.toISOString()
    } else if (nowTime >= powderCoatEnd.getTime()) {
      currentStage = 'ASSEMBLY'
      lastUpdate = powderCoatEnd.toISOString()
    } else if (nowTime >= fabricationEnd.getTime()) {
      currentStage = 'POWDER_COAT' // Constitution §2.2: underscore
      lastUpdate = fabricationEnd.toISOString()
    } else if (nowTime >= fabricationStart.getTime()) {
      currentStage = 'FABRICATION'
      lastUpdate = fabricationStart.toISOString()
    } else {
      currentStage = 'QUEUE'
      lastUpdate = poDate.toISOString()
    }

    pumps.push({
      id: nanoid(),
      serial,
      po,
      customer,
      model: model.model,
      stage: currentStage,
      priority,
      powder_color: hasColor
        ? COLORS[Math.floor(Math.random() * COLORS.length)]
        : undefined,
      last_update: lastUpdate,
      value: basePrice,
      forecastEnd,
      promiseDate: promiseDate.toISOString(),
      // BOM details (for future UI visibility)
      engine_model: getBomComponent(model.bom.engine, 'engine'),
      gearbox_model: getBomComponent(model.bom.gearbox, 'gearbox'),
      control_panel_model: getBomComponent(
        model.bom.control_panel,
        'control_panel'
      ),
      // Additional metadata
      description: model.description,
      total_lead_days: model.lead_times.total_days,
      work_hours: model.work_hours,
    } as Pump & {
      engine_model?: string | null
      gearbox_model?: string | null
      control_panel_model?: string | null
      description?: string
      total_lead_days?: number
    })
  }

  return pumps
}

// Main seed function
export function seed(count: number = 80): Pump[] {
  // Reset state for deterministic results
  usedSerials.clear()
  nextSerial = 1000
  poCounter = 1

  const pumps: Pump[] = []

  // Create realistic orders based on catalog models
  let generated = 0

  // Generate orders for each model
  for (const model of CATALOG_MODELS) {
    if (generated >= count) break

    // Determine order quantity (1-5 pumps per order)
    const orderQuantity = Math.min(
      Math.floor(Math.random() * 5) + 1,
      count - generated
    )
    const customer = CUSTOMERS[generated % CUSTOMERS.length]
    const poBase = genPONumber()

    const modelPumps = generatePumpFromCatalog(
      model,
      customer,
      poBase,
      orderQuantity,
      0
    )

    pumps.push(...modelPumps)
    generated += orderQuantity
  }

  // If we still need more pumps, create additional orders
  while (generated < count) {
    const model = CATALOG_MODELS[generated % CATALOG_MODELS.length]
    const customer = CUSTOMERS[generated % CUSTOMERS.length]
    const poBase = genPONumber()
    const remainingQuantity = Math.min(3, count - generated) // Small batches

    const additionalPumps = generatePumpFromCatalog(
      model,
      customer,
      poBase,
      remainingQuantity,
      0
    )

    pumps.push(...additionalPumps)
    generated += remainingQuantity
  }

  // Ensure we have exactly the requested count
  const finalPumps = pumps.slice(0, count)

  // POST-PROCESSING: Ensure some unscheduled QUEUE pumps (without forecastStart)
  const unscheduledCount = finalPumps.filter(
    (p) => p.stage === 'QUEUE' && !p.forecastStart
  ).length
  if (unscheduledCount < 5) {
    // Force at least 5 unscheduled QUEUE pumps
    const queuePumps = finalPumps.filter((p) => p.stage === 'QUEUE')
    const needed = Math.min(5 - unscheduledCount, queuePumps.length)

    for (let i = 0; i < needed; i++) {
      const pump = queuePumps[i]
      if (pump) {
        pump.forecastStart = undefined
        pump.forecastEnd = undefined
      }
    }
  }

  return finalPumps
}

// Export catalog data for store integration
export function getCatalogData() {
  return catalogData as CatalogData
}

// Export production stages for UI components
export function getProductionStages(): Stage[] {
  return CATALOG_STAGES
}
