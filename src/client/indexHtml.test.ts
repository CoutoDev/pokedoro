import { describe, expect, it } from 'bun:test'

const html = await Bun.file(new URL('./index.html', import.meta.url)).text()
const csp = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/)?.[1] ?? ''
const directive = (name: string) => csp.split(';').map((d) => d.trim()).find((d) => d.startsWith(`${name} `))

describe('index.html Content-Security-Policy', () => {
  it('is present and defaults to same-origin', () => {
    expect(directive('default-src')).toBe("default-src 'self'")
  })

  it('allows images only from self and the PokeAPI sprite host', () => {
    expect(directive('img-src')).toBe("img-src 'self' https://raw.githubusercontent.com")
  })

  it('blocks inline/remote scripts and plugins', () => {
    expect(directive('script-src')).toBe("script-src 'self'")
    expect(directive('object-src')).toBe("object-src 'none'")
  })
})
