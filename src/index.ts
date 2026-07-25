import { serve } from 'bun'

import { logout } from '@/api/auth/logout'
import { me } from '@/api/auth/me'
import { requestOtp } from '@/api/auth/requestOtp'
import { verifyOtp } from '@/api/auth/verifyOtp'
import { createCycle } from '@/api/cycles'

import index from './index.html'

const server = serve({
  routes: {
    '/api/auth/request-otp': { POST: requestOtp },
    '/api/auth/verify-otp': { POST: verifyOtp },
    '/api/auth/me': { GET: me },
    '/api/auth/logout': { POST: logout },
    '/api/cycles': { POST: createCycle },

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
