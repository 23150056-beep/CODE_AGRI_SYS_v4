import { useEffect, useMemo, useState } from 'react'
import { AUTH_STORAGE_KEY, AUTH_UPDATED_EVENT } from '../constants/auth'
import { loginWithCredentials, meRequest } from '../services/auth'
import { resolveActiveRole } from '../utils/auth'
import { AuthContext } from './authContextObject'

function getStoredAuth() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => getStoredAuth())

  useEffect(() => {
    function syncAuthState() {
      setAuthState(getStoredAuth())
    }

    window.addEventListener('storage', syncAuthState)
    window.addEventListener(AUTH_UPDATED_EVENT, syncAuthState)

    return () => {
      window.removeEventListener('storage', syncAuthState)
      window.removeEventListener(AUTH_UPDATED_EVENT, syncAuthState)
    }
  }, [])

  const value = useMemo(() => {
    return {
      user: authState?.user ?? null,
      token: authState?.accessToken ?? null,
      activeRole: authState?.activeRole ?? null,
      isAuthenticated: Boolean(authState?.accessToken),
      login: async ({ username, password }) => {
        const tokenPair = await loginWithCredentials({ username, password })
        const user = await meRequest(tokenPair.access)
        const activeRole = resolveActiveRole(user.roles)

        if (!activeRole) {
          throw new Error('No role is assigned to this account yet.')
        }

        const nextState = {
          accessToken: tokenPair.access,
          refreshToken: tokenPair.refresh,
          user,
          activeRole,
        }

        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextState))
        window.dispatchEvent(new Event(AUTH_UPDATED_EVENT))
        setAuthState(nextState)

        return nextState
      },
      logout: () => {
        localStorage.removeItem(AUTH_STORAGE_KEY)
        window.dispatchEvent(new Event(AUTH_UPDATED_EVENT))
        setAuthState(null)
      },
    }
  }, [authState])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
