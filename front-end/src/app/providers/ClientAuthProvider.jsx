'use client'

import { AuthProvider } from './AuthProvider'

/**
 * ClientAuthProvider
 *
 * Client-side wrapper around the AuthProvider. Ensures the provider is
 * only used on the client and re-exports the same API for the app tree.
 */
export default function ClientAuthProvider({ children }) {
  return <AuthProvider>{children}</AuthProvider>
}

