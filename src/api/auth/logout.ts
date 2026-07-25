import { buildClearedSessionCookie, destroySession, parseSessionCookie } from '@/lib/session'

export async function logout(req: Request): Promise<Response> {
  const token = parseSessionCookie(req.headers.get('cookie'))
  await destroySession(token)

  return Response.json({ ok: true }, { headers: { 'Set-Cookie': buildClearedSessionCookie() } })
}
