import { describe, expect, it } from 'bun:test'

import type { User } from '@/shared/types/user'

import { authReducer, type AuthState } from './authReducer'

const initialState: AuthState = {
  user: null,
  status: 'loading',
  error: null,
}

const testUser: User = {
  id: 'user-1',
  email: 'person@example.com',
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
}

describe('authReducer', () => {
  it('AUTH_LOADING sets status to loading and clears error', () => {
    const state: AuthState = { user: null, status: 'unauthenticated', error: 'boom' }
    const next = authReducer(state, { type: 'AUTH_LOADING' })

    expect(next).toEqual({ user: null, status: 'loading', error: null })
  })

  it('AUTH_SUCCESS sets the user and marks authenticated', () => {
    const next = authReducer(initialState, { type: 'AUTH_SUCCESS', payload: { user: testUser } })

    expect(next).toEqual({ user: testUser, status: 'authenticated', error: null })
  })

  it('AUTH_LOGOUT clears the user and marks unauthenticated', () => {
    const state: AuthState = { user: testUser, status: 'authenticated', error: null }
    const next = authReducer(state, { type: 'AUTH_LOGOUT' })

    expect(next).toEqual({ user: null, status: 'unauthenticated', error: null })
  })

  it('AUTH_ERROR clears the user, marks unauthenticated, and sets the error', () => {
    const state: AuthState = { user: testUser, status: 'authenticated', error: null }
    const next = authReducer(state, { type: 'AUTH_ERROR', payload: { error: 'Invalid code' } })

    expect(next).toEqual({ user: null, status: 'unauthenticated', error: 'Invalid code' })
  })

  it('returns state unchanged for an unhandled action', () => {
    // @ts-expect-error exercising the default branch with an invalid action type
    const next = authReducer(initialState, { type: 'UNKNOWN' })

    expect(next).toBe(initialState)
  })
})
