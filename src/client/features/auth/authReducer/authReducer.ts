import type { User } from '@/shared/types/user'

export type AuthState = {
  user: User | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  error: string | null
}

export type AuthAction =
  | { type: 'AUTH_LOADING' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User } }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_ERROR'; payload: { error: string } }

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, status: 'loading', error: null }

    case 'AUTH_SUCCESS':
      return { user: action.payload.user, status: 'authenticated', error: null }

    case 'AUTH_LOGOUT':
      return { user: null, status: 'unauthenticated', error: null }

    case 'AUTH_ERROR':
      return { user: null, status: 'unauthenticated', error: action.payload.error }

    default:
      return state
  }
}
