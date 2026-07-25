import { z } from 'zod'

import { db } from '@/db/client'
import { pomodoroCycles } from '@/db/schema'
import { getSessionUser, parseSessionCookie } from '@/lib/session'

const bodySchema = z.object({
  phase: z.enum(['FOCUS', 'SHORT_BREAK', 'LONG_BREAK', 'DONE']),
  focusDuration: z.number(),
  shortBreakDuration: z.number(),
  longBreakDuration: z.number(),
})

export async function createCycle(req: Request): Promise<Response> {
  const token = parseSessionCookie(req.headers.get('cookie'))
  const user = await getSessionUser(token)

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
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
