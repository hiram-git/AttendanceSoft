import { Link } from 'react-router-dom'
import { NavIcon } from './icons.jsx'

const SECTIONS = [
  {
    label: 'Operación',
    items: [
      { id: 'home', label: 'Inicio', icon: NavIcon.home, to: '/dashboard' },
      { id: 'cal', label: 'Agenda', icon: NavIcon.cal, to: '/dashboard', badge: 12 },
      { id: 'ppl', label: 'Clientes', icon: NavIcon.ppl, to: '/dashboard' },
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
]

export default function Sidebar({ active = 'home' }) {
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
              {it.badge ? <span className="badge">{it.badge}</span> : null}
            </Link>
          ))}
        </div>
      ))}

      <div className="sb-spacer" />

      <div className="sb-user">
        <div className="sb-avatar">CR</div>
        <div className="sb-user-info">
          <span className="nm">Camila R.</span>
          <span className="ml">camila@vertice.mx</span>
        </div>
      </div>
    </aside>
  )
}
