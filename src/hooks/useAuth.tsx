import { useCallback } from "react"

import { useAuthContext } from "@/contexts/AuthContext"
import { reviveUser } from "@/lib/reviveUser"
import { clearAuthFlag, setAuthFlag } from "@/utils/authFlag"

export const useAuth = () => {
  const { auth: { user, status, error }, authDispatch } = useAuthContext()

  const requestOtp = useCallback(async (email: string) => {
    const res = await fetch('/api/auth/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Failed to send code' }))
      authDispatch({ type: 'AUTH_ERROR', payload: { error } })
      return false
    }

    return true
  }, [authDispatch])

  const verifyOtp = useCallback(async (email: string, code: string) => {
    authDispatch({ type: 'AUTH_LOADING' })

    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    })

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Invalid code' }))
      authDispatch({ type: 'AUTH_ERROR', payload: { error } })
      return false
    }

    const { user } = await res.json()
    authDispatch({ type: 'AUTH_SUCCESS', payload: { user: reviveUser(user) } })
    setAuthFlag()
    return true
  }, [authDispatch])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    clearAuthFlag()
    authDispatch({ type: 'AUTH_LOGOUT' })
  }, [authDispatch])

  return {
    user,
    status,
    error,
    requestOtp,
    verifyOtp,
    logout,
  }
}
