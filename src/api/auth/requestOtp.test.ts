import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { eq } from 'drizzle-orm'

import { db } from '@/db/client'
import { otpCodes } from '@/db/schema'

import { requestOtp } from './requestOtp'

function postRequest(body: unknown) {
  return new Request('http://localhost/api/auth/request-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

afterEach(() => {
  mock.restore()
})

describe('requestOtp', () => {
  it('returns 400 for an invalid email', async () => {
    spyOn(console, 'log').mockImplementation(() => {})

    const res = await requestOtp(postRequest({ email: 'not-an-email' }))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid email' })
  })

  it('returns 400 when the request body is not valid JSON', async () => {
    const res = await requestOtp(postRequest('not json'))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid email' })
  })

  it('stores a hashed OTP code for the lowercased email and emails it', async () => {
    const logSpy = spyOn(console, 'log').mockImplementation(() => {})

    const res = await requestOtp(postRequest({ email: 'RequestOtp-User@Example.com' }))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })

    const [row] = await db
      .select()
      .from(otpCodes)
      .where(eq(otpCodes.email, 'requestotp-user@example.com'))

    expect(row).toBeDefined()
    expect(row!.consumedAt).toBeNull()
    expect(row!.attempts).toBe(0)
    expect(row!.codeHash).not.toBe('')
    expect(row!.expiresAt.getTime()).toBeGreaterThan(Date.now())
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('requestotp-user@example.com'))
  })

  it('consumes any previous unconsumed OTP code for the same email on a new request', async () => {
    spyOn(console, 'log').mockImplementation(() => {})
    const email = 'repeat-requestotp-user@example.com'

    await requestOtp(postRequest({ email }))
    const [firstRow] = await db.select().from(otpCodes).where(eq(otpCodes.email, email))

    await requestOtp(postRequest({ email }))

    const rows = await db.select().from(otpCodes).where(eq(otpCodes.email, email))
    const stillFirst = rows.find((r) => r.id === firstRow!.id)

    expect(stillFirst?.consumedAt).not.toBeNull()
    expect(rows.filter((r) => r.consumedAt === null)).toHaveLength(1)
  })
})
