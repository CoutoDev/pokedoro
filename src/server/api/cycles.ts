import { db } from '@/server/db/client'
import { pomodoroCycles } from '@/server/db/schema'
import { isTrustedOrigin } from '@/server/lib/csrf'
import { getSessionUser, parseSessionCookie } from '@/server/lib/session'
import { cyclePayloadSchema } from '@/shared/schemas/pomodoroCycle'

export async function createCycle(req: Request): Promise<Response> {
  if (!isTrustedOrigin(req)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const token = parseSessionCookie(req.headers.get('cookie'))
  const user = await getSessionUser(token)

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = cyclePayloadSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  const now = new Date()

  await db.insert(pomodoroCycles).values({
    id: crypto.randomUUID(),
    userId: user.id,
    ...parsed.data,
    completedAt: now,
    createdAt: now,
  })

  return Response.json({ ok: true }, { status: 201 })
}
