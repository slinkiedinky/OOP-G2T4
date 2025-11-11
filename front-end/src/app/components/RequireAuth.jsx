"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'
import { Box, CircularProgress } from '@mui/material'

/**
 * RequireAuth
 *
 * Client-side wrapper that ensures the user is authenticated before
 * rendering children. Redirects to the login page while the auth state
 * is initialized or if the user is not authenticated.
 */
export default function RequireAuth({ children }){
  const router = useRouter()
  const { isInitialized, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace('/auth/login')
    }
  }, [isInitialized, isAuthenticated, router])

  // Show loading while auth is initializing
  if (!isInitialized) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  // Redirect if not authenticated (handled by useEffect, but guard render too)
  if (!isAuthenticated) {
    return null
  }

  return children
}
