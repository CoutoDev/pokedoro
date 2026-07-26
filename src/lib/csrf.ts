// Defense-in-depth on top of the session cookie's SameSite=Lax attribute
// (which already excludes the cookie from cross-site POST/PUT requests in
// modern browsers): reject a mutating request outright if the browser tells
// us, via Origin or Sec-Fetch-Site, that it did not originate same-site.
// Requests carrying neither header (non-browser clients, and this app's own
// test requests) are allowed through — there's no CSRF signal to check.
export function isTrustedOrigin(req: Request): boolean {
  const origin = req.headers.get('origin')
  if (origin !== null) {
    return origin === new URL(req.url).origin
  }

  const fetchSite = req.headers.get('sec-fetch-site')
  if (fetchSite !== null) {
    return fetchSite === 'same-origin' || fetchSite === 'none'
  }

  return true
}
