"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'
import { Box, CircularProgress } from '@mui/material'

export default function RequireAuth({ children }){
  const router = useRouter()
  const { isInitialized, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace('/auth')
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
