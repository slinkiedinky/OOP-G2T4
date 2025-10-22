"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getToken } from '../../lib/api'

export default function RequireAuth({ children }){
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const t = getToken()
    if(!t){ router.replace('/auth') }
    else setChecked(true)
  }, [])

  if(!checked) return null
  return children
}
