import { eq } from 'drizzle-orm'

import { db } from '@/db/client'
import { sessions, users } from '@/db/schema'
import type { User } from '@/types/user'

import { sha256Hex } from './hash'

export const SESSION_COOKIE_NAME = 'pokedoro_session'
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

function generateSessionToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)

  return Buffer.from(bytes).toString('base64url')
}

export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken()
  const now = new Date()

  await db.insert(sessions).values({
    id: crypto.randomUUID(),
    tokenHash: sha256Hex(token),
    userId,
    expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
    createdAt: now,
  })

  return token
}

export async function getSessionUser(token: string | null): Promise<User | null> {
  if (!token) return null

  const [row] = await db
    .select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.tokenHash, sha256Hex(token)))
    .limit(1)

  if (!row) return null

  if (row.expiresAt.getTime() < Date.now()) {
    await destroySession(token)
    return null
  }

  return row.user
}

export async function destroySession(token: string | null): Promise<void> {
  if (!token) return

  await db.delete(sessions).where(eq(sessions.tokenHash, sha256Hex(token)))
}

export function parseSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null

  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`))

  return match ? match.slice(SESSION_COOKIE_NAME.length + 1) : null
}

function cookieFlags(): string {
  const flags = ['Path=/', 'HttpOnly', 'SameSite=Lax']
  if (process.env.NODE_ENV === 'production') flags.push('Secure')

  return flags.join('; ')
}

export function buildSessionCookie(token: string): string {
  return `${SESSION_COOKIE_NAME}=${token}; ${cookieFlags()}; Max-Age=${SESSION_TTL_MS / 1000}`
}

export function buildClearedSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; ${cookieFlags()}; Max-Age=0`
}
