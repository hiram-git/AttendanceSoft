import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useSession } from '../lib/auth-client.ts'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isPending && !session) {
      navigate({ to: '/login' })
    }
  }, [isPending, session, navigate])

  if (isPending) {
    return (
      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          minHeight: '100vh',
          background: 'var(--app-bg)',
          color: 'var(--app-muted)',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}
      >
        Cargando…
      </div>
    )
  }

  if (!session) return null

  return <>{children}</>
}
