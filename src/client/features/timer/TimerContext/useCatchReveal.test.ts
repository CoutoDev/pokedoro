import { describe, expect, it } from 'bun:test'
import { act, renderHook } from '@testing-library/react'

import { useCatchReveal } from './useCatchReveal'

describe('useCatchReveal', () => {
  it('initializes with no caught Pokemon, no login nudge, and no error', () => {
    const { result } = renderHook(() => useCatchReveal())

    expect(result.current.caughtPokemon).toBeNull()
    expect(result.current.showLoginNudge).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('setCaughtPokemon updates the caught Pokemon state', () => {
    const { result } = renderHook(() => useCatchReveal())

    act(() => {
      result.current.setCaughtPokemon({ speciesId: 25, caughtAt: '2026-01-01T00:00:00.000Z' })
    })

    expect(result.current.caughtPokemon).toEqual({ speciesId: 25, caughtAt: '2026-01-01T00:00:00.000Z' })
  })

  it('setShowLoginNudge toggles the login nudge state', () => {
    const { result } = renderHook(() => useCatchReveal())

    act(() => {
      result.current.setShowLoginNudge(true)
    })

    expect(result.current.showLoginNudge).toBe(true)
  })

  it('setError updates the error state', () => {
    const { result } = renderHook(() => useCatchReveal())

    act(() => {
      result.current.setError("Couldn't catch it — try again")
    })

    expect(result.current.error).toBe("Couldn't catch it — try again")
  })

  it('dismiss clears caughtPokemon, showLoginNudge, and error together', () => {
    const { result } = renderHook(() => useCatchReveal())

    act(() => {
      result.current.setCaughtPokemon({ speciesId: 25, caughtAt: '2026-01-01T00:00:00.000Z' })
      result.current.setShowLoginNudge(true)
      result.current.setError('some error')
    })

    act(() => {
      result.current.dismiss()
    })

    expect(result.current.caughtPokemon).toBeNull()
    expect(result.current.showLoginNudge).toBe(false)
    expect(result.current.error).toBeNull()
  })
})
