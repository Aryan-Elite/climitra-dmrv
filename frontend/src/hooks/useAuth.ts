'use client'
import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  role: 'field_worker' | 'reviewer'
  name: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  function saveAuth(token: string, user: User) {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
  }

  function clearAuth() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return { user, saveAuth, clearAuth }
}
