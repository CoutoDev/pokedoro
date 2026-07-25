import { createContext, useContext, useEffect, useReducer, type Dispatch, type PropsWithChildren } from "react"

import { reviveUser } from "@/lib/reviveUser"
import { authReducer, type AuthAction, type AuthState } from "@/reducers/authReducer"
import { clearAuthFlag, hasAuthFlag } from "@/utils/authFlag"

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

    fetch('/api/auth/me')
      .then(async (res) => {
        if (cancelled) return

        if (!res.ok) {
          clearAuthFlag()
          authDispatch({ type: 'AUTH_LOGOUT' })
          return
        }

        const { user } = await res.json()
        authDispatch({ type: 'AUTH_SUCCESS', payload: { user: reviveUser(user) } })
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
