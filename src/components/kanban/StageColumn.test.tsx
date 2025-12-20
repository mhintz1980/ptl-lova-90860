import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { StageColumn } from './StageColumn'
import { useApp } from '../../store'
import type { Pump } from '../../types'

vi.mock('@dnd-kit/core', () => ({
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
}))

const basePump: Pump = {
  id: 'pump-1',
  serial: 1001,
  po: 'PO-001',
  customer: 'Customer A',
  model: 'Model X',
  stage: 'FABRICATION',
  priority: 'Normal',
  last_update: new Date().toISOString(),
  value: 5000,
}

const resetStore = () => {
  useApp.setState((state) => ({
    collapsedStages: {
      QUEUE: false,
      FABRICATION: false,
      STAGED_FOR_POWDER: false,
      POWDER_COAT: false,
      ASSEMBLY: false,
      SHIP: false,
      CLOSED: false,
    },
    wipLimits: {
      ...state.wipLimits,
      FABRICATION: 2,
    },
  }))
}

describe('StageColumn', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-10T00:00:00.000Z'))
    resetStore()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows count vs wip limit', () => {
    const pumps: Pump[] = [0, 1, 2].map((offset) => ({
      ...basePump,
      id: `pump-${offset}`,
      last_update: new Date(Date.UTC(2024, 0, 7 + offset)).toISOString(),
    }))

    render(<StageColumn stage="FABRICATION" pumps={pumps} collapsed={false} />)

    // Verify count vs WIP limit is displayed
    expect(screen.getByText('3 / 2')).toBeTruthy()
  })

  it('marks the header as overloaded when count exceeds limit', () => {
    const pumps: Pump[] = [
      basePump,
      { ...basePump, id: 'pump-2' },
      { ...basePump, id: 'pump-3' },
    ]

    const { container } = render(
      <StageColumn stage="FABRICATION" pumps={pumps} collapsed={false} />
    )

    const header = container.querySelector('[data-stage-header="FABRICATION"]')
    expect(header).not.toBeNull()
    expect(header?.getAttribute('data-over-limit')).toBe('true')
  })
})
