import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { eq } from 'drizzle-orm'

import { db } from '@/db/client'
import { otpCodes, sessions, users } from '@/db/schema'
import { hashOtp, OTP_MAX_ATTEMPTS } from '@/lib/otp'
import { resetRateLimits } from '@/lib/rateLimit'

import { verifyOtp } from './verifyOtp'

const CODE = '123456'

async function insertOtp(email: string, overrides: Partial<typeof otpCodes.$inferInsert> = {}) {
  const now = new Date()

  await db.insert(otpCodes).values({
    id: crypto.randomUUID(),
    email,
    codeHash: hashOtp(CODE),
    attempts: 0,
    consumedAt: null,
    expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
    createdAt: now,
    ...overrides,
  })
}

afterEach(() => {
  mock.restore()
  resetRateLimits()
})

function postRequest(body: unknown) {
  return new Request('http://localhost/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

describe('verifyOtp', () => {
  it('returns 400 when the request body fails validation', async () => {
    const res = await verifyOtp(postRequest({ email: 'not-an-email', code: CODE }))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid request' })
  })

  it('returns 400 when the request body is not valid JSON', async () => {
    const res = await verifyOtp(postRequest('not json'))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid request' })
  })

  it('returns 400 when there is no matching OTP code for the email', async () => {
    const res = await verifyOtp(postRequest({ email: 'no-otp@example.com', code: CODE }))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Code expired or not found' })
  })

  it('returns 400 when the OTP code has expired', async () => {
    const email = 'expired-otp@example.com'
    await insertOtp(email, { expiresAt: new Date(Date.now() - 1000) })

    const res = await verifyOtp(postRequest({ email, code: CODE }))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Code expired or not found' })
  })

  it('returns 429 once the OTP code has reached the max attempts', async () => {
    const email = 'too-many-attempts@example.com'
    await insertOtp(email, { attempts: OTP_MAX_ATTEMPTS })

    const res = await verifyOtp(postRequest({ email, code: CODE }))

    expect(res.status).toBe(429)
    expect(await res.json()).toEqual({ error: 'Too many attempts' })
  })

  it('returns 400 and increments attempts on a wrong code', async () => {
    const email = 'wrong-code@example.com'
    await insertOtp(email)

    const res = await verifyOtp(postRequest({ email, code: '000000' }))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid code' })

    const [row] = await db.select().from(otpCodes).where(eq(otpCodes.email, email))
    expect(row?.attempts).toBe(1)
  })

  it('creates a new user and a session on a correct code (first sign-in)', async () => {
    const email = 'new-user@example.com'
    await insertOtp(email)
    // happy-dom drops Set-Cookie from the constructed Response entirely, so
    // this spy captures the init object Response.json() was actually called
    // with, before that stripping happens.
    const jsonSpy = spyOn(Response, 'json')

    const res = await verifyOtp(postRequest({ email, code: CODE }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.user.email).toBe(email)
    expect(jsonSpy).toHaveBeenCalledWith(
      { user: expect.objectContaining({ email }) },
      { headers: { 'Set-Cookie': expect.stringContaining('HttpOnly') } },
    )

    const [sessionRow] = await db.select().from(sessions).where(eq(sessions.userId, body.user.id))
    expect(sessionRow).toBeDefined()
    expect(sessionRow!.expiresAt.getTime()).toBeGreaterThan(Date.now())

    const [otpRow] = await db.select().from(otpCodes).where(eq(otpCodes.email, email))
    expect(otpRow?.consumedAt).not.toBeNull()
  })

  it('returns 500 when the newly inserted user cannot be read back', async () => {
    const email = 'insert-fails@example.com'
    await insertOtp(email)
    spyOn(db, 'insert').mockReturnValue({
      values: () => ({ returning: async () => [] }),
    } as unknown as ReturnType<typeof db.insert>)

    const res = await verifyOtp(postRequest({ email, code: CODE }))

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Could not create user' })
  })

  it('reuses the existing user on a correct code (returning sign-in)', async () => {
    const email = 'existing-user@example.com'
    const existingId = crypto.randomUUID()
    const now = new Date()
    await db.insert(users).values({ id: existingId, email, createdAt: now, updatedAt: now })
    await insertOtp(email)

    const res = await verifyOtp(postRequest({ email, code: CODE }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.user.id).toBe(existingId)
  })

  it('returns 429 once a client IP exceeds its verify rate limit', async () => {
    const server = { requestIP: () => ({ address: '203.0.113.7' }) }

    for (let i = 0; i < 30; i++) {
      await verifyOtp(postRequest({ email: 'no-otp@example.com', code: CODE }), server)
    }
    const res = await verifyOtp(postRequest({ email: 'no-otp@example.com', code: CODE }), server)

    expect(res.status).toBe(429)
    expect(await res.json()).toEqual({ error: 'Too many requests, please try again later' })
  })
})
