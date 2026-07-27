import { describe, expect, it } from 'bun:test'

import { getRingMetrics } from './progressRing'

describe('getRingMetrics', () => {
  it('is a full ring at the start of a phase', () => {
    const { circumference, offset } = getRingMetrics(1500, 1500, 104)

    expect(offset).toBeCloseTo(circumference)
  })

  it('is an empty ring when remaining is 0', () => {
    const { offset } = getRingMetrics(0, 1500, 104)

    expect(offset).toBeCloseTo(0)
  })

  it('clamps negative remaining to a fully complete ring', () => {
    const { offset } = getRingMetrics(-10, 1500, 104)

    expect(offset).toBeGreaterThanOrEqual(0)
  })

  it('clamps remaining greater than total to a fresh ring', () => {
    const { circumference, offset } = getRingMetrics(7200, 1500, 104)

    expect(offset).toBeCloseTo(circumference)
  })

  it('does not divide by zero when total is 0', () => {
    const { offset, circumference } = getRingMetrics(0, 0, 104)

    expect(Number.isNaN(offset)).toBe(false)
    expect(offset).toBeCloseTo(circumference)
  })
})
