type Window = {
  count: number
  resetAt: number
}

const windows = new Map<string, Window>()

export type RateLimitResult = {
  allowed: boolean
  retryAfterMs: number
}

export function consumeRateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const existing = windows.get(key)

  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterMs: 0 }
  }

  if (existing.count >= max) {
    return { allowed: false, retryAfterMs: existing.resetAt - now }
  }

  existing.count += 1
  return { allowed: true, retryAfterMs: 0 }
}

/** Test-only: clears all rate-limit state between test cases. */
export function resetRateLimits(): void {
  windows.clear()
}

export type IpSource = {
  requestIP: (request: Request) => { address: string } | null
}

export function getClientIp(req: Request, server?: IpSource): string {
  return server?.requestIP(req)?.address ?? 'unknown'
}
