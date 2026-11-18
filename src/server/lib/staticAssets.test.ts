import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createStaticHandler, extractCsp, securityHeaders } from './staticAssets'

const HTML = `<html><head><meta http-equiv="Content-Security-Policy"
  content="default-src 'self'; img-src 'self'" /></head><body>app</body></html>`

let dir: string
let handle: (req: Request) => Promise<Response>

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'dist-'))
  writeFileSync(join(dir, 'index.html'), HTML)
  writeFileSync(join(dir, 'app.js'), 'console.log(1)')
  handle = createStaticHandler(dir)
})
afterAll(() => rmSync(dir, { recursive: true, force: true }))

const get = (path: string) => handle(new Request(`http://x${path}`))

describe('staticAssets', () => {
  it('extracts the meta CSP', () => {
    expect(extractCsp(HTML)).toBe("default-src 'self'; img-src 'self'")
    expect(extractCsp('<html></html>')).toBe('')
  })

  it('adds frame-ancestors and X-Frame-Options to the HTML shell', async () => {
    for (const path of ['/', '/some/spa/route', '/index.html']) {
      const res = await get(path)
      expect(res.headers.get('Content-Security-Policy')).toBe("default-src 'self'; img-src 'self'; frame-ancestors 'none'")
      expect(res.headers.get('X-Frame-Options')).toBe('DENY')
      expect(res.headers.get('Content-Type')).toContain('text/html')
    }
  })

  it('omits an empty CSP rather than emitting a bare directive list', () => {
    expect(securityHeaders('<html></html>')['Content-Security-Policy']).toBe("frame-ancestors 'none'")
  })

  it('serves real files with nosniff', async () => {
    const res = await get('/app.js')
    expect(await res.text()).toBe('console.log(1)')
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
  })

  it('does not escape the dist directory', async () => {
    const res = await get('/..%2F..%2Fetc%2Fpasswd')
    expect(res.headers.get('Content-Type')).toContain('text/html')
  })

  it('returns 500 when the build output is missing', async () => {
    const res = await createStaticHandler(join(dir, 'nope'))(new Request('http://x/'))
    expect(res.status).toBe(500)
  })
})
