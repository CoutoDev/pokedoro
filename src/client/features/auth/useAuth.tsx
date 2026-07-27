import { useCallback } from "react"

import * as api from "@/client/api"
import { useAuthContext } from "@/client/features/auth/AuthContext"
import { reviveUser } from "@/shared/reviveUser"
import { clearAuthFlag, setAuthFlag } from "@/client/features/auth/authFlag"

export const useAuth = () => {
  const { auth: { user, status, error }, authDispatch } = useAuthContext()

  const requestOtp = useCallback(async (email: string) => {
    authDispatch({ type: 'AUTH_LOADING' })

    const result = await api.requestOtp(email)
    if (!result.ok) {
      authDispatch({ type: 'AUTH_ERROR', payload: { error: result.error } })
      return false
    }

    return true
  }, [authDispatch])

  const verifyOtp = useCallback(async (email: string, code: string) => {
    authDispatch({ type: 'AUTH_LOADING' })

    const result = await api.verifyOtp(email, code)
    if (!result.ok) {
      authDispatch({ type: 'AUTH_ERROR', payload: { error: result.error } })
      return false
    }

    authDispatch({ type: 'AUTH_SUCCESS', payload: { user: reviveUser(result.data) } })
    setAuthFlag()
    return true
  }, [authDispatch])

  const logout = useCallback(async () => {
    await api.logout()
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
