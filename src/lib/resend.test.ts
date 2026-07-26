import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { Resend } from 'resend'

import { sendOtpEmail } from './resend'

const originalApiKey = process.env.RESEND_API_KEY
const originalFrom = process.env.OTP_FROM_EMAIL
const originalNodeEnv = process.env.NODE_ENV

/**
 * Spies on the shared `Emails.prototype.send` method (the `Emails` class
 * itself isn't exported by the `resend` package) so `sendOtpEmail`'s real
 * `new Resend(...).emails.send(...)` call is intercepted before any network
 * request goes out, regardless of what `RESEND_API_KEY` is set to.
 */
function mockEmailsSend(impl: () => Promise<{ data: unknown; error: unknown }>) {
  const probe = new Resend('probe-key')

  return spyOn(Object.getPrototypeOf(probe.emails), 'send').mockImplementation(impl)
}

afterEach(() => {
  process.env.RESEND_API_KEY = originalApiKey
  process.env.OTP_FROM_EMAIL = originalFrom
  process.env.NODE_ENV = originalNodeEnv
  mock.restore()
})

describe('sendOtpEmail', () => {
  it('logs the code to the console and never calls Resend when RESEND_API_KEY is unset', async () => {
    delete process.env.RESEND_API_KEY
    const sendSpy = mockEmailsSend(async () => ({ data: { id: 'email-1' }, error: null }))
    const logSpy = spyOn(console, 'log').mockImplementation(() => {})

    await sendOtpEmail('a@b.com', '123456')

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('123456'))
    expect(sendSpy).not.toHaveBeenCalled()
  })

  it('throws instead of logging the code when RESEND_API_KEY is unset in production', async () => {
    delete process.env.RESEND_API_KEY
    process.env.NODE_ENV = 'production'
    const sendSpy = mockEmailsSend(async () => ({ data: { id: 'email-1' }, error: null }))
    const logSpy = spyOn(console, 'log').mockImplementation(() => {})

    await expect(sendOtpEmail('a@b.com', '123456')).rejects.toThrow(
      'RESEND_API_KEY must be set in production',
    )
    expect(logSpy).not.toHaveBeenCalled()
    expect(sendSpy).not.toHaveBeenCalled()
  })

  it('sends the OTP email via Resend when RESEND_API_KEY is set', async () => {
    process.env.RESEND_API_KEY = 'test-key'
    process.env.OTP_FROM_EMAIL = 'Test <test@example.com>'
    const sendSpy = mockEmailsSend(async () => ({ data: { id: 'email-1' }, error: null }))

    await sendOtpEmail('a@b.com', '123456')

    expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
      from: 'Test <test@example.com>',
      to: 'a@b.com',
      subject: 'Your Pokedoro sign-in code',
      html: expect.stringContaining('123456'),
    }))
  })

  it('defaults the from-address when OTP_FROM_EMAIL is unset', async () => {
    process.env.RESEND_API_KEY = 'test-key'
    delete process.env.OTP_FROM_EMAIL
    const sendSpy = mockEmailsSend(async () => ({ data: { id: 'email-1' }, error: null }))

    await sendOtpEmail('a@b.com', '123456')

    expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
      from: 'Pokedoro <onboarding@resend.dev>',
    }))
  })

  it('throws when Resend returns an error', async () => {
    process.env.RESEND_API_KEY = 'test-key'
    mockEmailsSend(async () => ({ data: null, error: { message: 'boom' } }))
    const errorSpy = spyOn(console, 'error').mockImplementation(() => {})

    await expect(sendOtpEmail('a@b.com', '123456')).rejects.toThrow('Failed to send OTP email to a@b.com')
    expect(errorSpy).toHaveBeenCalled()
  })
})
