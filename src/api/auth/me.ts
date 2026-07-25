import { getSessionUser, parseSessionCookie } from '@/lib/session'

export async function me(req: Request): Promise<Response> {
  const token = parseSessionCookie(req.headers.get('cookie'))
  const user = await getSessionUser(token)

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return Response.json({ user })
}
