import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useSession } from '../lib/auth-client.ts'

const API_BASE =
  import.meta.env.PUBLIC_API_URL ??
  import.meta.env.VITE_API_URL ??
  'http://localhost:3001'

type RoleFromSession = 'staff' | 'client' | string | null | undefined

interface Props {
  children: ReactNode
  /**
   * If set, the session.user.role must match exactly. Otherwise the
   * authenticated user gets a "wrong area" card with a link to the
   * area that does fit their role.
   */
  requiredRole?: 'staff' | 'client'
}

export function RequireAuth({ children, requiredRole }: Props) {
  const { data: session, isPending, error } = useSession()
  const navigate = useNavigate()

  const role: RoleFromSession =
    (session?.user as { role?: string } | undefined)?.role

  useEffect(() => {
    // Only redirect when we got a clean answer with no session.
    if (!isPending && !session && !error) {
      navigate({ to: '/login' })
    }
  }, [isPending, session, error, navigate])

  if (isPending) {
    return (
      <div className="auth-fallback" role="status">
        Cargando…
      </div>
    )
  }

  if (error) {
    return (
      <div className="auth-fallback" role="alert">
        <div className="auth-fallback-card">
          <div className="auth-fallback-tag">API NO RESPONDE</div>
          <h2>No pudimos contactar al servidor.</h2>
          <p>
            El frontend intentó hablar con <code>{API_BASE}</code> pero la
            llamada falló. Suele pasar cuando solo está corriendo la base de
            datos y olvidaste levantar el API.
          </p>
          <pre>bun run dev</pre>
          <p className="auth-fallback-hint">
            Levanta web y API en paralelo. Si ya están corriendo, revisa la
            consola del API y los DevTools del navegador (Network) para ver
            el error exacto.
          </p>
          <button
            type="button"
            className="btn-soft"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!session) return null

  if (requiredRole && role !== requiredRole) {
    const target = role === 'staff' ? '/dashboard' : '/portal'
    const label = role === 'staff' ? 'el panel del operador' : 'tu portal'
    return (
      <div className="auth-fallback" role="alert">
        <div className="auth-fallback-card">
          <div className="auth-fallback-tag">SECCIÓN INCORRECTA</div>
          <h2>Esta área no es para tu cuenta.</h2>
          <p>
            Estás autenticado como{' '}
            <strong style={{ color: 'var(--app-heading)' }}>{role ?? 'desconocido'}</strong>
            {', '}pero esta sección requiere{' '}
            <strong style={{ color: 'var(--app-heading)' }}>{requiredRole}</strong>.
          </p>
          <p className="auth-fallback-hint">
            Te llevamos a {label}.
          </p>
          <Link to={target} className="btn-grad" style={{ alignSelf: 'flex-start' }}>
            Ir a {target}
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
