import { describe, expect, it } from 'bun:test'

import { reviveUser } from './reviveUser'

describe('reviveUser', () => {
  it('parses createdAt/updatedAt strings into Date instances', () => {
    const user = reviveUser({
      id: 'user-1',
      email: 'a@b.com',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-02T00:00:00.000Z',
    })

    expect(user.createdAt).toBeInstanceOf(Date)
    expect(user.updatedAt).toBeInstanceOf(Date)
    expect(user.createdAt.toISOString()).toBe('2025-01-01T00:00:00.000Z')
    expect(user.updatedAt.toISOString()).toBe('2025-01-02T00:00:00.000Z')
  })

  it('preserves id and email', () => {
    const user = reviveUser({
      id: 'user-1',
      email: 'a@b.com',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    })

    expect(user.id).toBe('user-1')
    expect(user.email).toBe('a@b.com')
  })
})
