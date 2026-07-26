import { afterEach, describe, expect, it } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'

import { Card } from './Card'

afterEach(() => {
  cleanup()
})

describe('Card', () => {
  it('renders its children', () => {
    render(<Card>Content</Card>)

    expect(screen.getByText('Content')).not.toBeNull()
  })

  it('merges a custom className with the base styles', () => {
    render(<Card className="extra-class">Content</Card>)

    const el = screen.getByText('Content')
    expect(el.className).toContain('extra-class')
    expect(el.className).toContain('rounded-3xl')
  })
})
