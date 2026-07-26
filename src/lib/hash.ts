import { timingSafeEqual } from 'node:crypto'

export function sha256Hex(input: string): string {
  return new Bun.CryptoHasher('sha256').update(input).digest('hex')
}

export function hmacSha256Hex(key: string, input: string): string {
  return new Bun.CryptoHasher('sha256', key).update(input).digest('hex')
}

/** Constant-time equality check for two hex digests, to avoid timing side channels on comparison. */
export function hashesEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false

  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}
