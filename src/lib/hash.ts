export function sha256Hex(input: string): string {
  return new Bun.CryptoHasher('sha256').update(input).digest('hex')
}
