import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'

import { AuthContext, initialAuthState } from '@/contexts/AuthContext/AuthContext'
import type { AuthAction, AuthState } from '@/reducers/authReducer'
import type { User } from '@/types/user'

import Login from './Login'

const testUser: User = {
  id: 'user-1',
  email: 'person@example.com',
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
}

const renderLogin = (
  auth: AuthState = initialAuthState,
  authDispatch = mock((_action: AuthAction) => {}),
) => ({
  ...render(
    <AuthContext.Provider value={{ auth, authDispatch }}>
      <Login />
    </AuthContext.Provider>,
  ),
  authDispatch,
})

afterEach(() => {
  cleanup()
  mock.restore()
})

describe('Login', () => {
  it('renders the email step by default', () => {
    renderLogin()

    expect(screen.queryByLabelText('Email')).not.toBeNull()
    expect(screen.queryByLabelText('Code')).toBeNull()
  })

  it('requests an OTP and advances to the code step on submit', async () => {
    const fetchSpy = (spyOn(globalThis, 'fetch') as any).mockImplementation(() => Promise.resolve(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    ))
    renderLogin()

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } })
    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: 'Send code' }).closest('form')!)
      await Bun.sleep(0)
    })

    expect(fetchSpy).toHaveBeenCalledWith('/api/auth/request-otp', expect.objectContaining({
      body: JSON.stringify({ email: 'a@b.com' }),
    }))
    expect(screen.queryByLabelText('Code')).not.toBeNull()
  })

  it('verifies the OTP on code submit', async () => {
    (spyOn(globalThis, 'fetch') as any)
      .mockImplementationOnce(() => Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })))
      .mockImplementationOnce(() => Promise.resolve(
        new Response(JSON.stringify({ user: testUser }), { status: 200 }),
      ))
    const { authDispatch } = renderLogin()

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } })
    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: 'Send code' }).closest('form')!)
      await Bun.sleep(0)
    })

    fireEvent.change(screen.getByLabelText('Code'), { target: { value: '123456' } })
    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: 'Verify' }).closest('form')!)
      await Bun.sleep(0)
    })

    expect(authDispatch).toHaveBeenCalledWith({ type: 'AUTH_SUCCESS', payload: { user: testUser } })
  })

  it('returns to the email step when Back is clicked', async () => {
    (spyOn(globalThis, 'fetch') as any).mockImplementation(() => Promise.resolve(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    ))
    renderLogin()

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } })
    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: 'Send code' }).closest('form')!)
      await Bun.sleep(0)
    })
    expect(screen.queryByLabelText('Code')).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))

    expect(screen.queryByLabelText('Email')).not.toBeNull()
    expect(screen.queryByLabelText('Code')).toBeNull()
  })

  it('renders an error message when present', () => {
    renderLogin({ user: null, status: 'unauthenticated', error: 'Invalid code' })

    expect(screen.getByRole('alert').textContent).toBe('Invalid code')
  })

  it('shows the signed-in state and logs out when authenticated', async () => {
    const fetchSpy = (spyOn(globalThis, 'fetch') as any).mockImplementation(() => Promise.resolve(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    ))
    const { authDispatch } = renderLogin({ user: testUser, status: 'authenticated', error: null })

    expect(screen.getByText(`Signed in as ${testUser.email}`)).not.toBeNull()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
      await Bun.sleep(0)
    })

    expect(fetchSpy).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' })
    expect(authDispatch).toHaveBeenCalledWith({ type: 'AUTH_LOGOUT' })
  })
})
