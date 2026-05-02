import type { ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { RequireAuth } from './RequireAuth.tsx'
import { NavIcon } from './icons.tsx'
import { signOut, useSession } from '../lib/auth-client.ts'
import { useTheme } from '../lib/useTheme.ts'

const NAV: Array<{ id: string; label: string; to: string }> = [
  { id: 'home', label: 'Inicio', to: '/portal' },
  { id: 'book', label: 'Reservar', to: '/portal/book' },
  { id: 'history', label: 'Mis citas', to: '/portal/appointments' },
  { id: 'profile', label: 'Perfil', to: '/portal/profile' },
]

function initialsOf(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

interface Props {
  active?: string
  children: ReactNode
}

export function PortalShell({ active = 'home', children }: Props) {
  const { appDark, toggleApp } = useTheme()
  const { data: session } = useSession()
  const navigate = useNavigate()
  const userName = session?.user.name ?? 'Cliente'

  async function handleLogout() {
    await signOut()
    navigate({ to: '/login' })
  }

  return (
    <RequireAuth requiredRole="client">
      <div className="portal" data-theme={appDark ? 'dark' : 'light'}>
        <header className="portal-nav">
          <Link to="/portal" className="portal-brand">
            Attendance<span className="dot">·</span>Soft
          </Link>
          <nav className="portal-nav-links">
            {NAV.map((it) => (
              <Link
                key={it.id}
                to={it.to}
                className={'portal-nav-link' + (active === it.id ? ' active' : '')}
              >
                {it.label}
              </Link>
            ))}
          </nav>
          <div className="portal-nav-actions">
            <button
              className="icon-btn"
              onClick={toggleApp}
              aria-label="Cambiar tema"
              title="Cambiar tema"
            >
              {appDark ? NavIcon.sun : NavIcon.moon}
            </button>
            <div className="portal-user">
              <span className="portal-user-avatar">{initialsOf(userName)}</span>
              <span className="portal-user-name">{userName}</span>
            </div>
            <button
              type="button"
              className="btn-soft"
              onClick={handleLogout}
              title="Cerrar sesión"
            >
              Salir
            </button>
          </div>
        </header>
        <main className="portal-main app-scroll">{children}</main>
      </div>
    </RequireAuth>
  )
}
