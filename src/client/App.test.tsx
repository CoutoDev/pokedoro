import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'

import { setAuthFlag } from '@/client/features/auth/authFlag'
import * as calculateRemainingModule from '@/client/features/timer/calculateRemaining'
import type { User } from '@/shared/types/user'

import App from './App'

const testUser: User = {
  id: 'user-1',
  email: 'person@example.com',
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
}

const flush = () => act(async () => {
  await Bun.sleep(0)
})

/**
 * Routes every fetch call made across the app (auth, timer-state, cycles,
 * pokemon-catches) by URL/method, so a single App-level render can exercise
 * the full authenticated flow without mocking each hook in isolation.
 */
function mockFetchRouter(overrides: {
  catch?: { speciesId: number; caughtAt: string } | null
  catchStatus?: number
  catches?: Array<{ speciesId: number; count: number; lastCaughtAt: string }>
} = {}) {
  return (spyOn(globalThis, 'fetch') as any).mockImplementation((url: string, init?: RequestInit) => {
    if (url === '/api/auth/me') {
      return Promise.resolve(new Response(JSON.stringify({ user: testUser }), { status: 200 }))
    }
    if (url === '/api/timer-state' && (!init || init.method === undefined)) {
      return Promise.resolve(new Response(JSON.stringify({ state: null }), { status: 200 }))
    }
    if (url === '/api/timer-state' && init?.method === 'PUT') {
      return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    }
    if (url === '/api/cycles') {
      const status = overrides.catchStatus ?? 201
      const body = overrides.catch === null
        ? { ok: false, error: 'boom' }
        : { ok: true, catch: overrides.catch ?? { speciesId: 25, caughtAt: '2026-01-01T00:00:00.000Z' } }
      return Promise.resolve(new Response(JSON.stringify(body), { status }))
    }
    if (url === '/api/pokemon-catches') {
      return Promise.resolve(new Response(JSON.stringify(overrides.catches ?? []), { status: 200 }))
    }

    return Promise.resolve(new Response('{}', { status: 200 }))
  })
}

function mockIntervalTimers() {
  let intervalCallback: (() => void) | null = null

  ;(spyOn(globalThis, 'setInterval') as any).mockImplementation((callback: () => void) => {
    intervalCallback = callback
    return 1
  })
  ;(spyOn(globalThis, 'clearInterval') as any).mockImplementation(() => {})

  return {
    tick: () => act(() => {
      intervalCallback?.()
    }),
  }
}

afterEach(() => {
  cleanup()
  mock.restore()
  localStorage.clear()
})

describe('App', () => {
  it('renders the timer view by default', () => {
    render(<App />)

    expect(document.querySelector('.pomodoro-timer')).not.toBeNull()
  })

  it('toggles between the timer and collection views', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /collection/i }))
    expect(document.querySelector('.pomodoro-timer')).toBeNull()
    expect(screen.getByText(/sign in to see your collection/i)).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /timer/i }))
    expect(document.querySelector('.pomodoro-timer')).not.toBeNull()
  })

  it('preserves timer state (status, remaining) across a view toggle', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(screen.getByRole('button', { name: 'Pause' })).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /collection/i }))
    fireEvent.click(screen.getByRole('button', { name: /timer/i }))

    expect(screen.getByRole('button', { name: 'Pause' })).not.toBeNull()
  })

  it('completes the authenticated flow: phase completion shows the catch modal, dismissing it updates the collection', async () => {
    setAuthFlag()
    mockFetchRouter({ catch: { speciesId: 25, caughtAt: '2026-01-01T00:00:00.000Z' } })
    const { tick } = mockIntervalTimers()
    const calculateRemainingSpy = spyOn(calculateRemainingModule, 'calculateRemaining')
    calculateRemainingSpy.mockReturnValue(0)

    render(<App />)
    await flush()

    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    tick()
    await flush()

    expect(screen.getByRole('dialog')).not.toBeNull()
    expect(screen.getByText('Pikachu')).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /got it/i }))
    expect(screen.queryByRole('dialog')).toBeNull()

    calculateRemainingSpy.mockRestore()
  })

  it('accumulates catches across multiple completed phases in the collection view', async () => {
    setAuthFlag()
    mockFetchRouter({
      catch: { speciesId: 25, caughtAt: '2026-01-01T00:00:00.000Z' },
      catches: [
        { speciesId: 25, count: 2, lastCaughtAt: '2026-01-01T00:00:00.000Z' },
        { speciesId: 1, count: 1, lastCaughtAt: '2026-01-01T00:00:00.000Z' },
      ],
    })
    const { tick } = mockIntervalTimers()
    const calculateRemainingSpy = spyOn(calculateRemainingModule, 'calculateRemaining')
    calculateRemainingSpy.mockReturnValue(0)

    render(<App />)
    await flush()

    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    tick()
    await flush()
    fireEvent.click(screen.getByRole('button', { name: /got it/i }))

    fireEvent.click(screen.getByRole('button', { name: /collection/i }))
    await flush()

    expect(screen.getAllByText('Pikachu')).toHaveLength(1)
    expect(screen.getByText('2')).not.toBeNull()
    expect(screen.getByText('Bulbasaur')).not.toBeNull()

    calculateRemainingSpy.mockRestore()
  })

  it('shows a login nudge instead of the catch modal for a guest completing a phase', () => {
    const { tick } = mockIntervalTimers()
    const calculateRemainingSpy = spyOn(calculateRemainingModule, 'calculateRemaining')
    calculateRemainingSpy.mockReturnValue(0)

    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    tick()

    expect(screen.getByText(/sign in to catch pokémon/i)).not.toBeNull()

    calculateRemainingSpy.mockRestore()
  })

  it('shows an error modal when the catch request fails, but still resets the timer for a retry', async () => {
    setAuthFlag()
    mockFetchRouter({ catch: null })
    const { tick } = mockIntervalTimers()
    const calculateRemainingSpy = spyOn(calculateRemainingModule, 'calculateRemaining')
    calculateRemainingSpy.mockReturnValue(0)

    render(<App />)
    await flush()

    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    tick()
    await flush()

    expect(screen.getByRole('heading', { name: "Couldn't catch it" })).not.toBeNull()
    // Timer reset proceeds regardless of catch failure — back to the IDLE "Start" control.
    expect(screen.getByRole('button', { name: 'Start' })).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(screen.queryByRole('dialog')).toBeNull()

    // User can retry on the next phase completion.
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    tick()
    await flush()
    expect(screen.getByRole('heading', { name: "Couldn't catch it" })).not.toBeNull()

    calculateRemainingSpy.mockRestore()
  })
})
