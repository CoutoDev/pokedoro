import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { useContext } from 'react'
import { act, cleanup, render, screen } from '@testing-library/react'

import type { User } from '@/shared/types/user'
import { setAuthFlag } from '@/client/features/auth/authFlag'

import { AuthContext, AuthContextProvider, initialAuthState, useAuthContext } from './AuthContext'

const testUser: User = {
  id: 'user-1',
  email: 'person@example.com',
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
}

function StateProbe() {
  const { auth } = useContext(AuthContext)

  return (
    <div>
      <span data-testid="status">{auth.status}</span>
      <span data-testid="email">{auth.user?.email ?? ''}</span>
      <span data-testid="error">{auth.error ?? ''}</span>
    </div>
  )
}

function HookProbe() {
  const { auth, authDispatch } = useAuthContext()

  return (
    <div>
      <span data-testid="hook-status">{auth.status}</span>
      <button onClick={() => authDispatch({ type: 'AUTH_LOGOUT' })}>Dispatch</button>
    </div>
  )
}

const renderWithProvider = (child: React.ReactElement) => render(
  <AuthContextProvider>
    {child}
  </AuthContextProvider>,
)

const flush = () => act(async () => {
  await Bun.sleep(0)
})

afterEach(() => {
  cleanup()
  mock.restore()
  localStorage.clear()
})

describe('AuthContextProvider', () => {
  it('skips /api/auth/me and marks unauthenticated immediately when no auth flag is present', async () => {
    const fetchSpy = (spyOn(globalThis, 'fetch') as any).mockImplementation(() => Promise.resolve(
      new Response(JSON.stringify({ user: testUser }), { status: 200 }),
    ))

    renderWithProvider(<StateProbe />)
    await flush()

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(screen.getByTestId('status').textContent).toBe('unauthenticated')
  })

  it('starts in a loading state before /api/auth/me resolves', () => {
    setAuthFlag();
    (spyOn(globalThis, 'fetch') as any).mockImplementation(() => new Promise(() => {}))

    renderWithProvider(<StateProbe />)

    expect(screen.getByTestId('status').textContent).toBe('loading')
  })

  it('hydrates the authenticated user when /api/auth/me returns ok', async () => {
    setAuthFlag();
    (spyOn(globalThis, 'fetch') as any).mockImplementation(() => Promise.resolve(
      new Response(JSON.stringify({ user: testUser }), { status: 200 }),
    ))

    renderWithProvider(<StateProbe />)
    await flush()

    expect(screen.getByTestId('status').textContent).toBe('authenticated')
    expect(screen.getByTestId('email').textContent).toBe(testUser.email)
  })

  it('marks unauthenticated when /api/auth/me returns a non-ok response', async () => {
    setAuthFlag();
    (spyOn(globalThis, 'fetch') as any).mockImplementation(() => Promise.resolve(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    ))

    renderWithProvider(<StateProbe />)
    await flush()

    expect(screen.getByTestId('status').textContent).toBe('unauthenticated')
  })

  it('marks unauthenticated when the /api/auth/me request rejects', async () => {
    setAuthFlag();
    (spyOn(globalThis, 'fetch') as any).mockImplementation(() => Promise.reject(new Error('network down')))

    renderWithProvider(<StateProbe />)
    await flush()

    expect(screen.getByTestId('status').textContent).toBe('unauthenticated')
  })
})

describe('useAuthContext', () => {
  it('returns the provider value when used inside AuthContextProvider', async () => {
    (spyOn(globalThis, 'fetch') as any).mockImplementation(() => Promise.resolve(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    ))

    render(
      <AuthContextProvider>
        <HookProbe />
      </AuthContextProvider>,
    )
    await flush()

    expect(screen.getByTestId('hook-status').textContent).toBe('unauthenticated')
  })

  it('returns the default context value when used outside a provider', () => {
    render(<HookProbe />)

    expect(screen.getByTestId('hook-status').textContent).toBe(initialAuthState.status)
  })

  it('the default context dispatch outside a provider is a callable no-op', () => {
    render(<HookProbe />)

    expect(() => screen.getByRole('button', { name: 'Dispatch' }).click()).not.toThrow()
    expect(screen.getByTestId('hook-status').textContent).toBe(initialAuthState.status)
  })
})
