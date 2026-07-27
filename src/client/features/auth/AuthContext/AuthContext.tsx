import { createContext, useContext, useEffect, useReducer, type Dispatch, type PropsWithChildren } from "react"

import { getMe } from "@/client/api"
import { reviveUser } from "@/shared/reviveUser"
import { authReducer, type AuthAction, type AuthState } from "@/client/features/auth/authReducer"
import { clearAuthFlag, hasAuthFlag } from "@/client/features/auth/authFlag"

export const initialAuthState: AuthState = {
  user: null,
  status: 'loading',
  error: null,
}

type AuthContextValue = {
  auth: AuthState
  authDispatch: Dispatch<AuthAction>
}

const defaultAuthContextValue: AuthContextValue = {
  auth: initialAuthState,
  authDispatch: () => {},
}

export const AuthContext = createContext<AuthContextValue>(defaultAuthContextValue)

export function AuthContextProvider({ children }: PropsWithChildren) {
  const [auth, authDispatch] = useReducer(authReducer, initialAuthState)

  useEffect(() => {
    if (!hasAuthFlag()) {
      authDispatch({ type: 'AUTH_LOGOUT' })
      return
    }

    let cancelled = false

    authDispatch({ type: 'AUTH_LOADING' })

    getMe()
      .then((result) => {
        if (cancelled) return

        if (!result.ok) {
          clearAuthFlag()
          authDispatch({ type: 'AUTH_LOGOUT' })
          return
        }

        authDispatch({ type: 'AUTH_SUCCESS', payload: { user: reviveUser(result.user) } })
      })
      .catch(() => {
        if (!cancelled) {
          clearAuthFlag()
          authDispatch({ type: 'AUTH_LOGOUT' })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AuthContext.Provider value={{ auth, authDispatch }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  return useContext(AuthContext) ?? defaultAuthContextValue
}
