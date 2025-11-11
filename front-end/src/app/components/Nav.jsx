"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getToken, removeToken } from '../../lib/api'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'

/**
 * Nav
 *
 * Small navigation component used in contexts where a compact set of
 * links is needed. Reads token on client to decide whether to show
 * login or logout actions.
 */
export default function Nav(){
  // Start with unknown token on first render so server and client match.
  const [token, setToken] = useState(null)

  useEffect(() => {
    // Read token on client after mount to avoid SSR/client mismatch
    setToken(getToken())
  }, [])

  function logout(){
    removeToken()
    // reload so any protected data and nav state refresh
    location.reload()
  }

  return (
    <nav className="nav">
      <Stack direction="row" spacing={1} alignItems="center">
        <Link href="/clinics">Clinics</Link>
        <Link href="/appointments">Appointments</Link>
        {token ? (
          <Button color="primary" variant="text" onClick={logout}>Logout</Button>
        ) : (
          <Link href="/auth/login"><Button color="primary" variant="outlined">Login</Button></Link>
        )}
      </Stack>
    </nav>
  )
}
