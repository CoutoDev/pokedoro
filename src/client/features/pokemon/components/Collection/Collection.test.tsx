import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { act, cleanup, render, screen } from '@testing-library/react'

import { AuthContext } from '@/client/features/auth/AuthContext/AuthContext'
import type { AuthState } from '@/client/features/auth/authReducer'

import Collection from './Collection'

const flush = () => act(async () => {
  await Bun.sleep(0)
})

const renderCollection = (auth: AuthState) => render(
  <AuthContext.Provider value={{ auth, authDispatch: () => {} }}>
    <Collection />
  </AuthContext.Provider>,
)

afterEach(() => {
  cleanup()
  mock.restore()
})

describe('Collection', () => {
  it('shows a sign-in prompt for an unauthenticated user and does not fetch', () => {
    const fetchSpy = spyOn(globalThis, 'fetch')

    renderCollection({ user: null, status: 'unauthenticated', error: null })

    expect(screen.getByText(/sign in to see your collection/i)).not.toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('shows a loading state while fetching', () => {
    (spyOn(globalThis, 'fetch') as any).mockImplementation(() => new Promise(() => {}))

    renderCollection({
      user: { id: 'u1', email: 'a@b.com', createdAt: new Date(), updatedAt: new Date() },
      status: 'authenticated',
      error: null,
    })

    expect(screen.getByText(/loading your collection/i)).not.toBeNull()
  })

  it('renders the grid with the fetched catches once loaded', async () => {
    (spyOn(globalThis, 'fetch') as any).mockImplementation(() => Promise.resolve(
      new Response(JSON.stringify([{ speciesId: 25, count: 2, lastCaughtAt: '2026-01-01T00:00:00.000Z' }]), { status: 200 }),
    ))

    renderCollection({
      user: { id: 'u1', email: 'a@b.com', createdAt: new Date(), updatedAt: new Date() },
      status: 'authenticated',
      error: null,
    })
    await flush()

    expect(screen.getByText('Pikachu')).not.toBeNull()
    expect(screen.getByText('2')).not.toBeNull()
  })

  it('shows an error message when the fetch fails', async () => {
    (spyOn(globalThis, 'fetch') as any).mockImplementation(() => Promise.reject(new Error('network error')))

    renderCollection({
      user: { id: 'u1', email: 'a@b.com', createdAt: new Date(), updatedAt: new Date() },
      status: 'authenticated',
      error: null,
    })
    await flush()

    expect(screen.getByText(/couldn't load your collection/i)).not.toBeNull()
  })

  it('shows an error message when the response is a non-OK status', async () => {
    (spyOn(globalThis, 'fetch') as any).mockImplementation(() => Promise.resolve(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    ))

    renderCollection({
      user: { id: 'u1', email: 'a@b.com', createdAt: new Date(), updatedAt: new Date() },
      status: 'authenticated',
      error: null,
    })
    await flush()

    expect(screen.getByText(/couldn't load your collection/i)).not.toBeNull()
  })

  it('refetches when auth transitions from unauthenticated to authenticated', async () => {
    const fetchSpy = (spyOn(globalThis, 'fetch') as any).mockImplementation(() => Promise.resolve(
      new Response(JSON.stringify([]), { status: 200 }),
    ))

    const { rerender } = render(
      <AuthContext.Provider value={{ auth: { user: null, status: 'unauthenticated', error: null }, authDispatch: () => {} }}>
        <Collection />
      </AuthContext.Provider>,
    )
    expect(fetchSpy).not.toHaveBeenCalled()

    rerender(
      <AuthContext.Provider
        value={{
          auth: {
            user: { id: 'u1', email: 'a@b.com', createdAt: new Date(), updatedAt: new Date() },
            status: 'authenticated',
            error: null,
          },
          authDispatch: () => {},
        }}
      >
        <Collection />
      </AuthContext.Provider>,
    )
    await flush()

    expect(fetchSpy).toHaveBeenCalledWith('/api/pokemon-catches', expect.objectContaining({ credentials: 'include' }))
  })
})
