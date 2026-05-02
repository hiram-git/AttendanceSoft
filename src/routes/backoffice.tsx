import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { AppShell } from '../components/AppShell.tsx'
import { NavIcon } from '../components/icons.tsx'
import { api } from '../lib/api.ts'
import type { Staff } from '../db/schema.ts'

export const Route = createFileRoute('/backoffice')({ component: BackofficePage })

const FALLBACK_STAFF: Array<Staff> = [
  { id: '1', name: 'Andrea Méndez', role: 'Médica general', initials: 'AM', avatarGradient: 'linear-gradient(135deg,#c5d2ff,#dfe6ff)', rooms: ['SALA 1', 'SALA 2'] },
  { id: '2', name: 'Diego Vázquez', role: 'Especialista', initials: 'DV', avatarGradient: 'linear-gradient(135deg,#ffd5ee,#ffe6f4)', rooms: ['SALA 3'] },
  { id: '3', name: 'Lucía Romero', role: 'Procedimientos', initials: 'LR', avatarGradient: 'linear-gradient(135deg,#fde2c5,#ffeed8)', rooms: ['QUIRÓFANO'] },
  { id: '4', name: 'Tomás Castro', role: 'Consultas', initials: 'TC', avatarGradient: 'linear-gradient(135deg,#c4f0d8,#dff5e8)', rooms: ['SALA 2'] },
  { id: '5', name: 'Sofía Aguilar', role: 'Médica general', initials: 'SA', avatarGradient: 'linear-gradient(135deg,#ffd1c5,#ffe2da)', rooms: ['SALA 1'] },
  { id: '6', name: 'Joaquín Núñez', role: 'Diagnóstico', initials: 'JN', avatarGradient: 'linear-gradient(135deg,#e2d4ff,#efe5ff)', rooms: ['SALA 4'] },
]

const SCHEDULE: Array<Array<{ off?: boolean; items?: Array<{ t: string; l: string; k: number }> }>> = [
  [
    { items: [{ t: '08:30', l: 'Méndez control', k: 1 }, { t: '10:00', l: 'Vázquez eval.', k: 2 }] },
    { items: [{ t: '09:00', l: 'Treviño', k: 1 }, { t: '11:30', l: 'Acuña', k: 1 }, { t: '15:00', l: 'Block · admin', k: 0 }] },
    { items: [{ t: '10:00', l: 'Ortiz revisión', k: 2 }] },
    { items: [{ t: '09:00', l: 'Beltrán', k: 1 }, { t: '14:00', l: 'Cano proc.', k: 3 }] },
    { items: [{ t: '08:00', l: 'Quintero', k: 2 }, { t: '11:00', l: 'Lara', k: 1 }] },
    { off: true },
    { off: true },
  ],
  [
    { items: [{ t: '13:00', l: 'Romero', k: 3 }, { t: '16:00', l: 'Castro', k: 1 }] },
    { items: [{ t: '14:00', l: 'Núñez', k: 1 }] },
    { items: [{ t: '09:00', l: 'Capacitación', k: 0 }, { t: '14:00', l: 'Sesión equipo', k: 0 }] },
    { items: [{ t: '16:30', l: 'Solís', k: 1 }] },
    { items: [{ t: '15:00', l: 'Hidalgo', k: 4 }, { t: '17:30', l: 'Cuevas', k: 1 }] },
    { items: [{ t: '10:00', l: 'Velasco', k: 1 }] },
    { off: true },
  ],
  [
    { off: true },
    { items: [{ t: '09:00', l: 'Equipo A · Estudio', k: 3 }] },
    { items: [{ t: '08:00', l: 'Garza', k: 2 }, { t: '11:00', l: 'Salinas', k: 1 }, { t: '15:30', l: 'Vega', k: 1 }] },
    { items: [{ t: '10:00', l: 'Mantenimiento', k: 4 }] },
    { items: [{ t: '09:30', l: 'Aguilar', k: 1 }, { t: '13:00', l: 'Reyes', k: 2 }, { t: '17:00', l: 'Morales', k: 3 }] },
    { items: [{ t: '08:30', l: 'Gómez', k: 1 }, { t: '12:00', l: 'Rivas', k: 2 }] },
    { off: true },
  ],
  [
    { items: [{ t: '11:30', l: 'Soto limpieza', k: 2 }] },
    { off: true },
    { items: [{ t: '13:00', l: 'Romero', k: 3 }, { t: '16:30', l: 'Solís', k: 1 }] },
    { items: [{ t: '14:00', l: 'Cano', k: 3 }] },
    { items: [{ t: '11:00', l: 'Lara', k: 1 }, { t: '17:30', l: 'Cuevas', k: 1 }] },
    { items: [{ t: '09:30', l: 'Velasco', k: 1 }] },
    { off: true },
  ],
  [
    { items: [{ t: '09:00', l: 'Pérez consulta', k: 1 }] },
    { items: [{ t: '08:30', l: 'Méndez', k: 1 }, { t: '13:00', l: 'Romero', k: 3 }] },
    { items: [{ t: '12:00', l: 'Almuerzo equipo', k: 0 }] },
    { items: [{ t: '09:00', l: 'Beltrán', k: 1 }, { t: '14:00', l: 'Cano', k: 3 }, { t: '16:30', l: 'Solís', k: 1 }] },
    { items: [{ t: '08:00', l: 'Quintero', k: 2 }, { t: '15:00', l: 'Hidalgo', k: 4 }] },
    { items: [{ t: '12:00', l: 'Rivas', k: 2 }] },
    { off: true },
  ],
  [
    { off: true },
    { items: [{ t: '10:00', l: 'Estudio dx', k: 3 }] },
    { items: [{ t: '11:00', l: 'Salinas', k: 1 }] },
    { items: [{ t: '10:00', l: 'Bloqueo', k: 4 }] },
    { items: [{ t: '13:00', l: 'Reyes', k: 2 }] },
    { off: true },
    { items: [{ t: '10:00', l: 'Guardia', k: 0 }] },
  ],
]

const WEEK_DAYS = [
  { wd: 'LUN', dn: '28', util: '64%', utilN: 64, off: false, today: false },
  { wd: 'MAR', dn: '29', util: '78%', utilN: 78, off: false, today: false },
  { wd: 'MIÉ', dn: '30', util: '52%', utilN: 52, off: false, today: false },
  { wd: 'JUE', dn: '01', util: '81%', utilN: 81, off: false, today: false },
  { wd: 'VIE', dn: '02', util: '92%', utilN: 92, off: false, today: true },
  { wd: 'SÁB', dn: '03', util: '34%', utilN: 34, off: false, today: false },
  { wd: 'DOM', dn: '04', util: '—', utilN: 0, off: true, today: false },
]

function StaffScheduler({ staff }: { staff: Array<Staff> }) {
  return (
    <div className="sched-wrap">
      <div className="bo-filters">
        <span className="chip on">Equipo · Todos</span>
        <span className="chip">Sala</span>
        <span className="chip">Servicio</span>
        <span className="chip">Estado</span>
        <div style={{ flex: 1 }} />
        <button className="btn-soft">‹</button>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--app-heading)', minWidth: 200, textAlign: 'center' }}>
          28 Abr — 04 May, 2026
        </span>
        <button className="btn-soft">›</button>
        <div className="seg">
          <button>Día</button>
          <button className="active">Semana</button>
          <button>Mes</button>
        </div>
      </div>

      <div className="sched">
        <div className="sched-inner">
          <div className="sched-week-head">
            <div className="corner">Equipo · {staff.length} personas</div>
            {WEEK_DAYS.map((d, i) => (
              <div key={i} className={'sched-day-h' + (d.today ? ' today' : '')}>
                <span className="wd">{d.wd}</span>
                <span className="dn">{d.dn}</span>
                {d.off ? (
                  <span className="util">— Cerrado —</span>
                ) : (
                  <>
                    <span className="util">{d.util} ocupación</span>
                    <span className="bar"><i style={{ width: `${d.utilN}%` }} /></span>
                  </>
                )}
              </div>
            ))}
          </div>

          {staff.slice(0, 6).map((p, ri) => (
            <div className="sched-row" key={p.id}>
              <div className="sched-staff">
                <span className="av" style={{ background: p.avatarGradient }}>{p.initials}</span>
                <div className="meta">
                  <span className="nm">{p.name}</span>
                  <span className="ro">{p.role}</span>
                  <span className="tags">
                    {p.rooms.map((t) => <span className="tag" key={t}>{t}</span>)}
                  </span>
                </div>
              </div>
              {(SCHEDULE[ri] ?? []).map((cell, ci) => (
                <div key={ci} className={'sched-cell' + (cell.off ? ' off' : '')}>
                  {cell.items?.slice(0, 3).map((it, ii) => (
                    <div key={ii} className={'slot' + (it.k === 0 ? ' block' : ` k${it.k}`)}>
                      <span className="t">{it.t}</span>
                      <span>{it.l}</span>
                    </div>
                  ))}
                  {cell.items && cell.items.length > 3 && (
                    <span style={{ fontSize: 11, color: 'var(--app-muted)', fontWeight: 500, paddingLeft: 4 }}>
                      + {cell.items.length - 3} más
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const STAFF_LOAD: Array<{ pc: number; warn: boolean }> = [
  { pc: 92, warn: false },
  { pc: 78, warn: false },
  { pc: 96, warn: true },
  { pc: 64, warn: false },
  { pc: 71, warn: false },
  { pc: 38, warn: false },
]

function StaffStats({ staff }: { staff: Array<Staff> }) {
  return (
    <div className="card">
      <div className="card-head">
        <h3>Carga del equipo</h3>
        <span className="sub">Esta semana</span>
      </div>
      <div style={{ padding: '4px 18px 14px' }}>
        {staff.slice(0, 6).map((s, i) => {
          const load = STAFF_LOAD[i] ?? { pc: 50, warn: false }
          return (
            <div key={s.id} className="staff-stat-row">
              <span className="av" style={{ background: s.avatarGradient }}>{s.initials}</span>
              <span className="nm">{s.name}</span>
              <span className="bar"><i style={{ width: `${load.pc}%` }} /></span>
              <span className={'pc' + (load.warn ? ' warn' : '')}>{load.pc}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Alerts() {
  const items = [
    { tone: 'warn', ti: 'Lucía Romero al 96%', ms: 'Considera redistribuir 2 procedimientos del jueves.', tm: 'hace 12m' },
    { tone: 'danger', ti: 'Conflicto de sala', ms: 'Sala 2 reservada dos veces · 14:00 jueves.', tm: 'hace 24m' },
    { tone: '', ti: 'Solicitud pendiente', ms: 'Diego pidió permiso para el viernes 09 de mayo.', tm: 'hace 1h' },
    { tone: '', ti: 'Cobertura de domingo', ms: 'Sin cobertura asignada para 11 de mayo.', tm: 'hace 2h' },
  ]
  return (
    <div className="card">
      <div className="card-head">
        <h3>Alertas y solicitudes</h3>
        <button className="badge accent" style={{ marginLeft: 'auto' }}>4 nuevas</button>
      </div>
      <div style={{ padding: '4px 18px 14px' }}>
        {items.map((it, i) => (
          <div key={i} className={'alert-row' + (it.tone ? ' ' + it.tone : '')}>
            <span className="dot" />
            <div style={{ minWidth: 0 }}>
              <div className="ti">{it.ti}</div>
              <div className="ms">{it.ms}</div>
            </div>
            <span className="tm">{it.tm}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BackofficePage() {
  const staffQuery = useQuery({ queryKey: ['staff'], queryFn: () => api.staff() })
  const staff = staffQuery.data && staffQuery.data.length > 0 ? staffQuery.data : FALLBACK_STAFF

  return (
    <AppShell
      active="staff"
      here="Equipo y disponibilidad"
      crumbPath={['Backoffice', 'Equipo y disponibilidad']}
    >
      <div className="page-head">
        <div>
          <h1>Equipo y disponibilidad</h1>
          <div className="subtitle">Gestiona horarios, salas y carga semanal del equipo.</div>
        </div>
        <div className="page-head-actions">
          <button className="btn-soft">Importar</button>
          <button className="btn-soft">Plantillas</button>
          <button className="btn-grad">{NavIcon.plus} Nuevo turno</button>
        </div>
      </div>

      <div className="bo-head-row">
        <div className="seg">
          <button className="active">
            Disponibilidad <span style={{ marginLeft: 6, color: 'var(--app-muted)' }}>·{staff.length}</span>
          </button>
          <button>Personas <span style={{ marginLeft: 6, color: 'var(--app-muted)' }}>·12</span></button>
          <button>Salas <span style={{ marginLeft: 6, color: 'var(--app-muted)' }}>·4</span></button>
          <button>Reglas</button>
          <button>Permisos</button>
        </div>
      </div>

      <div className="bo-grid">
        <StaffScheduler staff={staff} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <StaffStats staff={staff} />
          <Alerts />
        </div>
      </div>
    </AppShell>
  )
}
