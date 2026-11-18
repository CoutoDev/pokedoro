import { serve } from 'bun'

import { logout } from '@/server/api/auth/logout'
import { me } from '@/server/api/auth/me'
import { requestOtp } from '@/server/api/auth/requestOtp'
import { verifyOtp } from '@/server/api/auth/verifyOtp'
import { createCycle } from '@/server/api/cycles'
import { getPokemonCatches } from '@/server/api/pokemonCatches'
import { getTimerState, saveTimerState } from '@/server/api/timerState'
import { purgeExpiredAuthRecords } from '@/server/lib/cleanup'

import { createStaticHandler } from '@/server/lib/staticAssets'

const isProduction = process.env.NODE_ENV === 'production'

// Dev: Bun's HTML import gives HMR. Production: serve the built dist/ ourselves so
// the HTML can carry real security headers (frame-ancestors can't be set via <meta>).
const appRoute = isProduction
  ? createStaticHandler(new URL('../../dist', import.meta.url).pathname)
  : (await import('../client/index.html')).default

const PURGE_INTERVAL_MS = 15 * 60 * 1000

function purgeExpiredAuthRecordsSafely(): void {
  purgeExpiredAuthRecords().catch((err) => console.error('Failed to purge expired auth records:', err))
}

purgeExpiredAuthRecordsSafely()
setInterval(purgeExpiredAuthRecordsSafely, PURGE_INTERVAL_MS)

const server = serve({
  // Every request body on this API is a handful of small JSON fields; capping
  // this well below Bun's 128MB default keeps unauthenticated endpoints
  // (request-otp, verify-otp) from being used as a memory-exhaustion vector.
  maxRequestBodySize: 64 * 1024,

  routes: {
    '/api/auth/request-otp': { POST: requestOtp },
    '/api/auth/verify-otp': { POST: verifyOtp },
    '/api/auth/me': { GET: me },
    '/api/auth/logout': { POST: logout },
    '/api/cycles': { POST: createCycle },
    '/api/pokemon-catches': { GET: getPokemonCatches },
    '/api/timer-state': { GET: getTimerState, PUT: saveTimerState },

    // Serve the SPA (and its assets) for all unmatched routes.
    '/*': appRoute,
  },

  development: !isProduction && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
})

console.log(`🚀 Server running at ${server.url}`)
