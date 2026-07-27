import { afterEach, describe, expect, it } from 'bun:test'

import { clearAuthFlag, hasAuthFlag, setAuthFlag } from './authFlag'

afterEach(() => {
  localStorage.clear()
})

describe('authFlag', () => {
  it('returns false when nothing is stored', () => {
    expect(hasAuthFlag()).toBe(false)
  })

  it('returns true after setAuthFlag is called', () => {
    setAuthFlag()

    expect(hasAuthFlag()).toBe(true)
  })

  it('returns false after clearAuthFlag is called', () => {
    setAuthFlag()
    clearAuthFlag()

    expect(hasAuthFlag()).toBe(false)
  })
})
