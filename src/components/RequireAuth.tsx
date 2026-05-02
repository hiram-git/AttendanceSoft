import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useSession } from '../lib/auth-client.ts'

const API_BASE =
  import.meta.env.PUBLIC_API_URL ??
  import.meta.env.VITE_API_URL ??
  'http://localhost:3001'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { data: session, isPending, error } = useSession()
  const navigate = useNavigate()

  useEffect(() => {
    // Only redirect when we got a clean answer with no session.
    // If there was an error talking to the API we want to surface it
    // instead of bouncing the user to /login (which would also fail).
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

  return <>{children}</>
}
