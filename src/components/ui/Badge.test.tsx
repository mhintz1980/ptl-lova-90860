// src/components/ui/Badge.test.tsx
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Badge } from './Badge'

describe('Badge', () => {
  it('renders with the default variant', () => {
    const { container } = render(<Badge>Default</Badge>)
    expect(container.firstChild).toHaveClass(
      'bg-primary text-primary-foreground'
    )
  })

  it('renders with the secondary variant', () => {
    const { container } = render(<Badge variant="secondary">Secondary</Badge>)
    expect(container.firstChild).toHaveClass(
      'bg-secondary text-secondary-foreground'
    )
  })

  it('renders with the destructive variant', () => {
    const { container } = render(<Badge variant="destructive">Destructive</Badge>)
    expect(container.firstChild).toHaveClass(
      'bg-destructive text-destructive-foreground'
    )
  })

  it('renders with the outline variant', () => {
    const { container } = render(<Badge variant="outline">Outline</Badge>)
    expect(container.firstChild).toHaveClass('text-foreground')
  })

  it('renders with the success variant', () => {
    const { container } = render(<Badge variant="success">Success</Badge>)
    expect(container.firstChild).toHaveClass('bg-green-100 text-green-800')
  })

  it('renders with the warning variant', () => {
    const { container } = render(<Badge variant="warning">Warning</Badge>)
    expect(container.firstChild).toHaveClass('bg-yellow-100 text-yellow-800')
  })

  it('renders with the error variant', () => {
    const { container } = render(<Badge variant="error">Error</Badge>)
    expect(container.firstChild).toHaveClass('bg-red-100 text-red-800')
  })

  it('renders with the info variant', () => {
    const { container } = render(<Badge variant="info">Info</Badge>)
    expect(container.firstChild).toHaveClass('bg-blue-100 text-blue-800')
  })
})
