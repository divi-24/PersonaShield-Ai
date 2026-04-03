import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAppState } from '@/context/AppStateContext'

export function RequireIdentityVault({ children }: { children: ReactNode }) {
  const { identities, loading } = useAppState()
  const location = useLocation()

  if (loading) return children

  const hasIdentity = identities.length > 0
  if (!hasIdentity) {
    return <Navigate to="/app/register" replace state={{ from: location.pathname }} />
  }

  return children
}

