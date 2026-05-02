import { Link, useNavigate } from '@tanstack/react-router'
import { NavIcon } from './icons.tsx'
import { signOut, useSession } from '../lib/auth-client.ts'

const SECTIONS = [
  {
    label: 'Operación',
    items: [
      { id: 'home', label: 'Inicio', icon: NavIcon.home, to: '/dashboard' },
      { id: 'cal', label: 'Agenda', icon: NavIcon.cal, to: '/dashboard', badge: 12 },
      { id: 'ppl', label: 'Clientes', icon: NavIcon.ppl, to: '/backoffice/clients' },
      { id: 'svc', label: 'Servicios', icon: NavIcon.svc, to: '/dashboard' },
    ],
  },
  {
    label: 'Backoffice',
    items: [
      { id: 'staff', label: 'Equipo y disponibilidad', icon: NavIcon.staff, to: '/backoffice' },
      { id: 'rep', label: 'Reportes', icon: NavIcon.rep, to: '/backoffice' },
      { id: 'set', label: 'Ajustes', icon: NavIcon.set, to: '/backoffice' },
    ],
  },
] as const

function initialsOf(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function Sidebar({ active = 'home' }: { active?: string }) {
  const { data: session } = useSession()
  const navigate = useNavigate()
  const userName = session?.user.name ?? 'Usuario'
  const userEmail = session?.user.email ?? ''
  const userInitials = initialsOf(userName)

  async function handleLogout() {
    await signOut()
    navigate({ to: '/login' })
  }

  return (
    <aside className="sb">
      <Link to="/" className="sb-brand">
        <span className="glyph">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 9h18M8 3v4M16 3v4" />
          </svg>
        </span>
        <span className="name-wrap">Attendance·Soft</span>
      </Link>

      {SECTIONS.map((section) => (
        <div className="sb-section" key={section.label}>
          <div className="sb-section-label">{section.label}</div>
          {section.items.map((it) => (
            <Link
              key={it.id}
              to={it.to}
              className={'sb-link' + (active === it.id ? ' active' : '')}
            >
              {it.icon}
              <span className="label">{it.label}</span>
              {'badge' in it ? <span className="badge">{it.badge}</span> : null}
            </Link>
          ))}
        </div>
      ))}

      <div className="sb-spacer" />

      <div className="sb-user">
        <div className="sb-avatar">{userInitials}</div>
        <div className="sb-user-info">
          <span className="nm">{userName}</span>
          <span className="ml">{userEmail}</span>
        </div>
        <button
          type="button"
          className="icon-btn"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          onClick={handleLogout}
          style={{ marginLeft: 'auto' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
