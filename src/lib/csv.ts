// src/lib/csv.ts
import Papa from 'papaparse'
import { Pump, Stage, Priority } from '../types'

// Helper to convert various date formats to ISO string
const toIso = (v?: string | number): string | undefined => {
  if (!v) return undefined
  try {
    // Attempt to parse as a number (e.g., Excel date serial)
    if (typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v)))) {
      // Excel date serials start from Jan 1, 1900.
      // This is a rough conversion and might need a more robust library for production.
      const excelDate = Number(v)
      if (excelDate > 1000) {
        // Simple check to avoid small numbers
        const date = new Date(Date.UTC(0, 0, excelDate - 1))
        return date.toISOString()
      }
    }
    // Attempt to parse as a standard date string
    const date = new Date(v)
    if (!isNaN(date.getTime())) {
      return date.toISOString()
    }
  } catch (error) {
    console.error('Date parsing error:', error)
  }
  return undefined
}

interface RawPumpRow {
  id?: string
  serial?: number
  po?: string
  customer?: string
  model?: string
  stage?: string
  priority?: string
  powder_color?: string
  color?: string
  last_update?: string | number
  value?: number
  scheduledEnd?: string | number
  scheduled_end?: string | number
}

// Helper to validate and normalize a single row into a Pump object
function normalizeRow(r: RawPumpRow): Pump | null {
  // Required fields check
  if (!r.id && !r.serial) return null
  if (!r.po || !r.customer || !r.model || !r.stage) return null

  const stage = r.stage.toUpperCase() as Stage
  const priority = (r.priority || 'Normal') as Priority

  // Constitution §2.1: Canonical stage validation
  const validStages: Stage[] = [
    'QUEUE',
    'FABRICATION',
    'STAGED_FOR_POWDER',
    'POWDER_COAT',
    'ASSEMBLY',
    'SHIP',
    'CLOSED',
  ]
  const validPriorities: Priority[] = [
    'Low',
    'Normal',
    'High',
    'Rush',
    'Urgent',
  ]

  if (!validStages.includes(stage)) return null
  if (!validPriorities.includes(priority)) return null

  return {
    id: r.id || crypto.randomUUID(),
    serial: Number(r.serial) || 0, // Should be unique, but we'll trust the input for now
    po: r.po,
    customer: r.customer,
    model: r.model,
    stage: stage,
    priority: priority,
    powder_color: r.powder_color || r.color,
    last_update: toIso(r.last_update) || new Date().toISOString(),
    value: Number(r.value ?? 0),
    scheduledEnd: toIso(r.scheduledEnd || r.scheduled_end),
  }
}

// Main function to parse CSV/JSON file
export function parseFile(
  file: File
): Promise<{ pumps: Pump[]; invalidRows: RawPumpRow[] }> {
  return new Promise((resolve, reject) => {
    const isJson = file.name.toLowerCase().endsWith('.json')

    if (isJson) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const rawData = JSON.parse(event.target?.result as string)
          const rows = Array.isArray(rawData) ? rawData : [rawData]
          const { pumps, invalidRows } = rows.reduce(
            (acc, r) => {
              const pump = normalizeRow(r)
              if (pump) {
                acc.pumps.push(pump)
              } else {
                acc.invalidRows.push(r)
              }
              return acc
            },
            { pumps: [] as Pump[], invalidRows: [] as RawPumpRow[] }
          )
          resolve({ pumps, invalidRows })
        } catch (error) {
          console.error('JSON parsing error:', error)
          reject(new Error('Failed to parse JSON file.'))
        }
      }
      reader.onerror = reject
      reader.readAsText(file)
    } else {
      // Assume CSV or other delimited format for PapaParse
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: ({ data }: { data: RawPumpRow[] }) => {
          const { pumps, invalidRows } = (data as RawPumpRow[]).reduce(
            (acc, r) => {
              const pump = normalizeRow(r)
              if (pump) {
                acc.pumps.push(pump)
              } else {
                acc.invalidRows.push(r)
              }
              return acc
            },
            { pumps: [] as Pump[], invalidRows: [] as RawPumpRow[] }
          )

          resolve({ pumps, invalidRows })
        },
        error: reject,
      })
    }
  })
}
