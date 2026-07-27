import { isTrustedOrigin } from '@/server/lib/csrf'
import { buildClearedSessionCookie, destroySession, parseSessionCookie } from '@/server/lib/session'

export async function logout(req: Request): Promise<Response> {
  if (!isTrustedOrigin(req)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const token = parseSessionCookie(req.headers.get('cookie'))
  await destroySession(token)

  return Response.json({ ok: true }, { headers: { 'Set-Cookie': buildClearedSessionCookie() } })
}
