import { Resend } from 'resend'

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  const from = process.env.OTP_FROM_EMAIL ?? 'Pokedoro <onboarding@resend.dev>'

  if (!process.env.RESEND_API_KEY) {
    console.log(`[dev] OTP for ${email}: ${code}`)
    return
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  const res = await resend.emails.send({
    from,
    to: email,
    subject: 'Your Pokedoro sign-in code',
    html: `<p>Your sign-in code is <strong>${code}</strong>. It expires in 10 minutes.</p>`,
  })

  if (res.error) {
    console.error(`Failed to send OTP email to ${email}:`, res.error)
    throw new Error(`Failed to send OTP email to ${email}`)
  }
}
