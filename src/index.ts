import { serve } from 'bun'

import { logout } from '@/api/auth/logout'
import { me } from '@/api/auth/me'
import { requestOtp } from '@/api/auth/requestOtp'
import { verifyOtp } from '@/api/auth/verifyOtp'
import { createCycle } from '@/api/cycles'
import { getTimerState, saveTimerState } from '@/api/timerState'
import { purgeExpiredAuthRecords } from '@/lib/cleanup'

import index from './index.html'

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
    '/api/timer-state': { GET: getTimerState, PUT: saveTimerState },

    // Serve index.html for all unmatched routes.
    '/*': index,
  },

  development: process.env.NODE_ENV !== 'production' && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
})

console.log(`🚀 Server running at ${server.url}`)
