import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { act, cleanup, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'

import { AuthContext, initialAuthState } from '@/contexts/AuthContext/AuthContext'
import type { AuthAction, AuthState } from '@/reducers/authReducer'
import { hasAuthFlag, setAuthFlag } from '@/utils/authFlag'

import { useAuth } from './useAuth'

const renderUseAuth = (
  auth: AuthState = initialAuthState,
  authDispatch = mock((_action: AuthAction) => {}),
) => {
  const wrapper = ({ children }: PropsWithChildren) => (
    <AuthContext.Provider value={{ auth, authDispatch }}>
      {children}
    </AuthContext.Provider>
  )

  return { ...renderHook(() => useAuth(), { wrapper }), authDispatch }
}

afterEach(() => {
  cleanup()
  mock.restore()
  localStorage.clear()
})

describe('useAuth', () => {
  it('exposes user, status, and error from context', () => {
    const { result } = renderUseAuth({
      user: { id: 'user-1', email: 'a@b.com', createdAt: new Date(), updatedAt: new Date() },
      status: 'authenticated',
      error: null,
    })

    expect(result.current.user?.email).toBe('a@b.com')
    expect(result.current.status).toBe('authenticated')
  })

  it('requestOtp posts the email and returns true on success', async () => {
    const fetchSpy = (spyOn(globalThis, 'fetch') as any).mockImplementation(() => Promise.resolve(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    ))
    const { result } = renderUseAuth()

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.requestOtp('a@b.com')
    })

    expect(ok).toBe(true)
    expect(fetchSpy).toHaveBeenCalledWith('/api/auth/request-otp', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com' }),
    }))
  })

  it('requestOtp dispatches AUTH_ERROR and returns false on failure', async () => {
    (spyOn(globalThis, 'fetch') as any).mockImplementation(() => Promise.resolve(
      new Response(JSON.stringify({ error: 'Failed to send code' }), { status: 500 }),
    ))
    const { result, authDispatch } = renderUseAuth()

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.requestOtp('a@b.com')
    })

    expect(ok).toBe(false)
    expect(authDispatch).toHaveBeenCalledWith({
      type: 'AUTH_ERROR',
      payload: { error: 'Failed to send code' },
    })
  })

  it('verifyOtp dispatches AUTH_LOADING then AUTH_SUCCESS on success', async () => {
    const user = { id: 'user-1', email: 'a@b.com', createdAt: new Date(), updatedAt: new Date() };
    (spyOn(globalThis, 'fetch') as any).mockImplementation(() => Promise.resolve(
      new Response(JSON.stringify({ user }), { status: 200 }),
    ))
    const { result, authDispatch } = renderUseAuth()

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.verifyOtp('a@b.com', '123456')
    })

    expect(ok).toBe(true)
    expect(authDispatch).toHaveBeenCalledWith({ type: 'AUTH_LOADING' })
    expect(authDispatch).toHaveBeenCalledWith({ type: 'AUTH_SUCCESS', payload: { user } })
    expect(hasAuthFlag()).toBe(true)
  })

  it('verifyOtp dispatches AUTH_ERROR and returns false on an invalid code', async () => {
    (spyOn(globalThis, 'fetch') as any).mockImplementation(() => Promise.resolve(
      new Response(JSON.stringify({ error: 'Invalid code' }), { status: 400 }),
    ))
    const { result, authDispatch } = renderUseAuth()

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.verifyOtp('a@b.com', '000000')
    })

    expect(ok).toBe(false)
    expect(authDispatch).toHaveBeenCalledWith({
      type: 'AUTH_ERROR',
      payload: { error: 'Invalid code' },
    })
  })

  it('logout calls the logout endpoint, clears the auth flag, and dispatches AUTH_LOGOUT', async () => {
    setAuthFlag()
    const fetchSpy = (spyOn(globalThis, 'fetch') as any).mockImplementation(() => Promise.resolve(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    ))
    const { result, authDispatch } = renderUseAuth()

    await act(async () => {
      await result.current.logout()
    })

    expect(fetchSpy).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' })
    expect(authDispatch).toHaveBeenCalledWith({ type: 'AUTH_LOGOUT' })
    expect(hasAuthFlag()).toBe(false)
  })
})
