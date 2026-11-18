import { join, normalize, sep } from 'node:path'

const CLICKJACKING_DIRECTIVE = "frame-ancestors 'none'"

/** Extracts the CSP from the page's own <meta> tag so there is a single source of truth. */
export function extractCsp(html: string): string {
  return html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/)?.[1] ?? ''
}

export function securityHeaders(html: string): Record<string, string> {
  const csp = [extractCsp(html), CLICKJACKING_DIRECTIVE].filter(Boolean).join('; ')
  return {
    'Content-Security-Policy': csp,
    'X-Frame-Options': 'DENY', // legacy browsers that ignore frame-ancestors
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin',
  }
}

/**
 * Serves the built SPA from `distDir`. Real files are returned as-is; every
 * other path falls back to index.html, which is sent with the security headers
 * (a <meta> CSP cannot express frame-ancestors, so it must be a real header).
 */
export function createStaticHandler(distDir: string) {
  const root = normalize(distDir)

  return async function handle(req: Request): Promise<Response> {
    const pathname = decodeURIComponent(new URL(req.url).pathname)
    const candidate = normalize(join(root, pathname))
    const insideRoot = candidate === root || candidate.startsWith(root + sep)

    if (insideRoot && pathname !== '/') {
      const file = Bun.file(candidate)
      if ((await file.exists()) && !candidate.endsWith(`${sep}index.html`)) {
        return new Response(await file.arrayBuffer(), {
          headers: { 'Content-Type': file.type, 'X-Content-Type-Options': 'nosniff' },
        })
      }
    }

    const indexFile = Bun.file(join(root, 'index.html'))
    if (!(await indexFile.exists())) {
      return new Response('Build output missing — run `bun run build`.', { status: 500 })
    }
    const html = await indexFile.text()
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8', ...securityHeaders(html) },
    })
  }
}
