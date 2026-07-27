export type RateLimitResult = {
  allowed: boolean
  retryAfterMs: number
}

/**
 * The seam this app is most likely to need to swap: the moment it runs more
 * than one server instance, an implementation backed by a shared store
 * (e.g. Redis) has to replace InMemoryRateLimiter below.
 */
export interface RateLimiter {
  consume(key: string, max: number, windowMs: number): RateLimitResult
}

type Window = {
  count: number
  resetAt: number
}

/** In-process rate limiter. State is per-instance and lost on restart. */
export class InMemoryRateLimiter implements RateLimiter {
  private windows: Map<string, Window>

  constructor() {
    this.windows = new Map()
  }

  consume(key: string, max: number, windowMs: number): RateLimitResult {
    const now = Date.now()
    const existing = this.windows.get(key)

    if (!existing || existing.resetAt <= now) {
      this.windows.set(key, { count: 1, resetAt: now + windowMs })
      return { allowed: true, retryAfterMs: 0 }
    }

    if (existing.count >= max) {
      return { allowed: false, retryAfterMs: existing.resetAt - now }
    }

    existing.count += 1
    return { allowed: true, retryAfterMs: 0 }
  }

  reset(): void {
    this.windows.clear()
  }
}

const rateLimiter: InMemoryRateLimiter = new InMemoryRateLimiter()

export function consumeRateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  return rateLimiter.consume(key, max, windowMs)
}

/** Test-only: clears all rate-limit state between test cases. */
export function resetRateLimits(): void {
  rateLimiter.reset()
}

export type IpSource = {
  requestIP: (request: Request) => { address: string } | null
}

export function getClientIp(req: Request, server?: IpSource): string {
  return server?.requestIP(req)?.address ?? 'unknown'
}
