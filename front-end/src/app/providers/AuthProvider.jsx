'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { getToken, getUserFromToken, isTokenExpired, removeToken } from '../../lib/api'

const AuthContext = createContext({
  isInitialized: false,
  token: null,
  user: null,
  isAuthenticated: false,
  isAdmin: false
})


/**
 * Hook to access authentication context.
 *
 * Returns the current authentication state and user information.
 * - isInitialized: whether auth has been initialized on the client
 * - token: raw auth token string or null
 * - user: decoded user object from token or null
 * - isAuthenticated: boolean flag
 * - isAdmin: boolean flag indicating ADMIN role
 *
 * Throws an error when used outside an AuthProvider.
 * @returns {{isInitialized: boolean, token: string|null, user: object|null, isAuthenticated: boolean, isAdmin: boolean}}
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * React context provider for authentication state.
 *
 * Wrap your application with <AuthProvider> to expose auth state via the
 * `useAuth()` hook. This provider initializes state from localStorage and
 * listens for cross-tab updates.
 *
 * @param {{children: import('react').ReactNode}} props
 * @returns {JSX.Element}
 */
export function AuthProvider({ children }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Initialize auth synchronously on mount
    const initAuth = () => {
      try {
        const storedToken = getToken()
        
        if (storedToken && !isTokenExpired()) {
          const userData = getUserFromToken()
          
          setToken(storedToken)
          setUser(userData)
          setIsAuthenticated(true)
          setIsAdmin(userData?.role === 'ADMIN')
        } else {
          // Token expired or doesn't exist
          setToken(null)
          setUser(null)
          setIsAuthenticated(false)
          setIsAdmin(false)
          if (storedToken) { // If token existed but was expired, remove it
            removeToken()
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        setToken(null)
        setUser(null)
        setIsAuthenticated(false)
        setIsAdmin(false)
      } finally {
        setIsInitialized(true)
      }
    }

    // For client-side navigation, initialize immediately
    // For SSR, wait for mount
    if (typeof window !== 'undefined') {
      // Initialize immediately - localStorage should be available synchronously
      initAuth()
    } else {
      setIsInitialized(true)
    }
  }, [])

  // Listen for storage changes (token updates)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = (event) => {
      if (event.key === 'aqms_token' || event.key === null) { // null for clear storage
        const storedToken = getToken()
        if (storedToken && !isTokenExpired()) {
          const userData = getUserFromToken()
          setToken(storedToken)
          setUser(userData)
          setIsAuthenticated(true)
          setIsAdmin(userData?.role === 'ADMIN')
        } else {
          setToken(null)
          setUser(null)
          setIsAuthenticated(false)
          setIsAdmin(false)
          if (storedToken) {
            removeToken()
          }
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('focus', handleStorageChange) // Also check on tab focus

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleStorageChange)
    }
  }, [])

  const value = {
    isInitialized,
    token,
    user,
    isAuthenticated,
    isAdmin
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

