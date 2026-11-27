import { describe, expect, it } from 'bun:test'

import { formatDuration } from './formatDuration'

describe('formatDuration', () => {
  it('formats seconds, minutes, and hours', () => {
    expect(formatDuration(45)).toBe('45s')
    expect(formatDuration(720)).toBe('12m')
    expect(formatDuration(7500)).toBe('2h 05m')
  })

  it('clamps negatives to zero', () => {
    expect(formatDuration(-5)).toBe('0s')
  })
})
