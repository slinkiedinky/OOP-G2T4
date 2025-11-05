'use client'

import { AuthProvider } from './AuthProvider'

export default function ClientAuthProvider({ children }) {
  return <AuthProvider>{children}</AuthProvider>
}

