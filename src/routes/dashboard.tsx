import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { AppShell } from '../components/AppShell.tsx'
import { NavIcon } from '../components/icons.tsx'
import { api } from '../lib/api.ts'
import type { Appointment } from '../db/schema.ts'

export const Route = createFileRoute('/dashboard')({ component: DashboardPage })

const TODAY = 2

const FALLBACK_APPTS_BY_DAY: Record<number, Array<{ t: string; l: string; k: number }>> = {
  1: [{ t: '09:00', l: 'Pérez · Consulta', k: 1 }, { t: '11:30', l: 'Soto · Limpieza', k: 2 }],
  2: [
    { t: '08:30', l: 'Méndez · Control', k: 1 },
    { t: '10:00', l: 'Vázquez · Eval.', k: 2 },
    { t: '13:00', l: 'Romero', k: 3 },
    { t: '16:00', l: 'Castro', k: 1 },
  ],
  4: [{ t: '09:00', l: 'Equipo A · Estudio', k: 3 }, { t: '14:00', l: 'Núñez', k: 1 }],
  5: [{ t: '08:00', l: 'Garza', k: 2 }, { t: '11:00', l: 'Salinas', k: 1 }, { t: '15:30', l: 'Vega', k: 1 }],
  6: [{ t: '10:00', l: 'Bloqueo · Mantenimiento', k: 4 }],
  7: [{ t: '09:30', l: 'Aguilar', k: 1 }, { t: '13:00', l: 'Reyes', k: 2 }, { t: '17:00', l: 'Morales', k: 3 }],
  8: [{ t: '08:30', l: 'Gómez', k: 1 }, { t: '12:00', l: 'Rivas', k: 2 }],
  11: [{ t: '09:00', l: 'Treviño', k: 1 }, { t: '11:30', l: 'Acuña', k: 1 }],
  12: [{ t: '10:00', l: 'Ortiz · Revisión', k: 2 }],
  13: [{ t: '09:00', l: 'Beltrán', k: 1 }, { t: '14:00', l: 'Cano', k: 3 }, { t: '16:30', l: 'Solís', k: 1 }],
  14: [{ t: '08:00', l: 'Quintero', k: 2 }, { t: '11:00', l: 'Lara', k: 1 }, { t: '15:00', l: 'Hidalgo', k: 4 }, { t: '17:30', l: 'Cuevas', k: 1 }],
  15: [{ t: '09:30', l: 'Velasco', k: 1 }],
  18: [{ t: '10:00', l: 'Moreno', k: 1 }, { t: '13:00', l: 'Paredes', k: 2 }],
  19: [{ t: '09:00', l: 'Casas', k: 1 }, { t: '12:30', l: 'Ramos', k: 1 }, { t: '15:00', l: 'Tovar', k: 2 }],
  20: [{ t: '08:30', l: 'Esparza', k: 3 }],
  21: [{ t: '09:00', l: 'Ibarra', k: 1 }, { t: '11:30', l: 'Lugo', k: 2 }, { t: '15:00', l: 'Peña', k: 1 }],
  22: [{ t: '10:00', l: 'Fuentes', k: 1 }, { t: '14:00', l: 'Barrios · Largo', k: 3 }],
  25: [{ t: '09:00', l: 'Cervantes', k: 1 }],
  26: [{ t: '08:00', l: 'Loera', k: 1 }, { t: '11:00', l: 'Sandoval', k: 2 }, { t: '14:00', l: 'Tapia', k: 1 }, { t: '16:30', l: 'Andrade', k: 1 }],
  27: [{ t: '09:30', l: 'Bustos', k: 2 }, { t: '13:00', l: 'Avilés', k: 1 }],
  28: [{ t: '10:00', l: 'Cordero', k: 4 }, { t: '15:00', l: 'Patiño', k: 1 }],
  29: [{ t: '09:00', l: 'Jaramillo', k: 1 }, { t: '11:00', l: 'Ávalos', k: 2 }, { t: '14:30', l: 'Pineda', k: 1 }],
}

const KIND_TO_NUM: Record<string, number> = {
  consulta: 1,
  seguimiento: 2,
  procedimiento: 3,
  bloqueo: 4,
}

function MonthCalendar({ todayAppts }: { todayAppts: Array<Appointment> | undefined }) {
  const apptsByDay: Record<number, Array<{ t: string; l: string; k: number }>> = {
    ...FALLBACK_APPTS_BY_DAY,
  }
  if (todayAppts && todayAppts.length > 0) {
    apptsByDay[TODAY] = todayAppts.map((a) => ({
      t: a.startTime.slice(0, 5),
      l: a.label,
      k: KIND_TO_NUM[a.kind] ?? 1,
    }))
  }

  const cells: Array<{
    key: string
    day: number
    muted: boolean
    items: Array<{ t: string; l: string; k: number }>
    isToday?: boolean
  }> = []
  ;[27, 28, 29, 30].forEach((d, i) =>
    cells.push({ key: `pre-${i}`, day: d, muted: true, items: [] }),
  )
  for (let d = 1; d <= 31; d++) {
    cells.push({
      key: `m-${d}`,
      day: d,
      muted: false,
      items: apptsByDay[d] ?? [],
      isToday: d === TODAY,
    })
  }
  const trail = 7 - (cells.length % 7)
  if (trail < 7) {
    for (let i = 1; i <= trail; i++) {
      cells.push({ key: `post-${i}`, day: i, muted: true, items: [] })
    }
  }

  const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  return (
    <div className="card cal-card">
      <div className="cal-head">
        <h2>Mayo <em>2026</em></h2>
        <div className="nav-mo">
          <button>‹</button>
          <span className="label">Mayo de 2026</span>
          <button>›</button>
        </div>
        <div className="spacer" />
        <div className="seg">
          <button>Día</button>
          <button>Semana</button>
          <button className="active">Mes</button>
          <button>Lista</button>
        </div>
        <button className="btn-soft">Hoy</button>
      </div>

      <div className="cal-weekdays">
        {weekdays.map((w) => <div key={w}>{w}</div>)}
      </div>

      <div className="cal-grid">
        {cells.map((c) => {
          const visible = c.items.slice(0, 3)
          const more = c.items.length - visible.length
          const density = Math.min(c.items.length, 3)
          return (
            <div
              key={c.key}
              className={'cal-day' + (c.muted ? ' muted' : '') + (c.isToday ? ' today' : '')}
            >
              <span className="num">{c.day}</span>
              {density > 0 && !c.muted && (
                <div className="density">
                  {Array.from({ length: density }).map((_, i) => (
                    <i key={i} className={i === 0 ? '' : i === 1 ? 'q2' : 'q3'} />
                  ))}
                </div>
              )}
              {visible.map((a, i) => (
                <div key={i} className={`appt kind-${a.k}`}>
                  <span className="t">{a.t}</span>
                  <span>{a.l}</span>
                </div>
              ))}
              {more > 0 && <span className="more">+ {more} más</span>}
            </div>
          )
        })}
      </div>

      <div className="legend">
        <span className="it"><i style={{ background: 'var(--accent)' }} /> Consulta</span>
        <span className="it"><i style={{ background: '#10a76b' }} /> Seguimiento</span>
        <span className="it"><i style={{ background: '#c2862c' }} /> Procedimiento</span>
        <span className="it"><i style={{ background: '#e0455a' }} /> Bloqueo</span>
        <span style={{ marginLeft: 'auto', color: 'var(--app-muted)' }}>156 citas este mes</span>
      </div>
    </div>
  )
}

function Spark({ pts, color = 'var(--accent)' }: { pts: string; color?: string }) {
  return (
    <svg width="60" height="22" viewBox="0 0 60 22" className="spark" fill="none">
      <polyline points={pts} stroke={color} strokeWidth="1.4" fill="none" />
    </svg>
  )
}

function MetricStrip({ todayCount }: { todayCount: number }) {
  return (
    <div className="metrics">
      <div className="metric">
        <div className="lbl">Citas hoy</div>
        <div className="val">{todayCount || 38}</div>
        <div className="delta up">↑ 12% vs. ayer</div>
        <Spark pts="0,16 8,14 16,15 24,10 32,12 40,7 48,8 60,4" />
      </div>
      <div className="metric">
        <div className="lbl">Ocupación</div>
        <div className="val">84<span style={{ fontSize: 16, color: 'var(--app-muted)' }}>%</span></div>
        <div className="delta up">↑ 3 pts</div>
        <Spark pts="0,12 10,13 20,9 30,11 40,8 50,6 60,7" color="#10a76b" />
      </div>
      <div className="metric">
        <div className="lbl">Cancelaciones</div>
        <div className="val">2</div>
        <div className="delta dn">↓ 1 vs. ayer</div>
        <Spark pts="0,10 10,12 20,11 30,14 40,12 50,15 60,16" color="#e0455a" />
      </div>
      <div className="metric">
        <div className="lbl">Ingreso del día</div>
        <div className="val">$48,210</div>
        <div className="delta up">↑ 18% vs. semana</div>
        <Spark pts="0,18 10,15 20,12 30,11 40,8 50,9 60,3" color="#c2862c" />
      </div>
    </div>
  )
}

function MiniCal() {
  const days = [
    ['', '', '', '', '1', '2', '3'],
    ['4', '5', '6', '7', '8', '9', '10'],
    ['11', '12', '13', '14', '15', '16', '17'],
    ['18', '19', '20', '21', '22', '23', '24'],
    ['25', '26', '27', '28', '29', '30', '31'],
  ]
  const has = new Set([1, 2, 4, 5, 7, 8, 11, 13, 14, 15, 18, 19, 21, 22, 26, 27, 28, 29])
  return (
    <div className="card aside-card">
      <div className="card-head">
        <h3>Vista del mes</h3>
        <span className="sub">Mayo 2026</span>
      </div>
      <div className="mini-cal">
        <div className="mini-cal-grid">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((w, i) => (
            <div key={i} className="wd">{w}</div>
          ))}
          {days.flat().map((d, i) => {
            if (!d) return <div key={i} className="d muted"> </div>
            const n = parseInt(d, 10)
            return (
              <div key={i} className={'d' + (n === TODAY ? ' today' : '') + (has.has(n) ? ' has' : '')}>
                {d}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const FALLBACK_TODAY = [
  { t: '08:30', e: '09:00', n: 'Andrea Méndez', s: 'Control trimestral · Sala 2', av: 'AM', col: 'linear-gradient(135deg,#c5d2ff,#dfe6ff)' },
  { t: '10:00', e: '10:45', n: 'Diego Vázquez', s: 'Evaluación inicial · Sala 1', av: 'DV', col: 'linear-gradient(135deg,#ffd5ee,#ffe6f4)' },
  { t: '13:00', e: '13:30', n: 'Lucía Romero', s: 'Procedimiento · Sala 3', av: 'LR', col: 'linear-gradient(135deg,#fde2c5,#ffeed8)' },
  { t: '16:00', e: '16:45', n: 'Tomás Castro', s: 'Consulta · Sala 2', av: 'TC', col: 'linear-gradient(135deg,#c4f0d8,#dff5e8)' },
]

function UpcomingList({ todayAppts }: { todayAppts: Array<Appointment> | undefined }) {
  const items =
    todayAppts && todayAppts.length > 0
      ? todayAppts.map((a) => {
          const [name] = a.label.split(' · ')
          const initials = name
            .split(' ')
            .map((p) => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()
          return {
            t: a.startTime.slice(0, 5),
            e: a.endTime.slice(0, 5),
            n: name,
            s: a.label.includes(' · ') ? a.label.split(' · ').slice(1).join(' · ') : a.label,
            av: initials,
            col: 'linear-gradient(135deg,#c5d2ff,#dfe6ff)',
          }
        })
      : FALLBACK_TODAY

  return (
    <div className="card aside-card">
      <div className="card-head">
        <h3>Hoy · {String(items.length).padStart(2, '0')} citas</h3>
        <span className="sub">Mar 02 May</span>
        <button className="icon-btn" style={{ marginLeft: 'auto' }}>›</button>
      </div>
      <div className="card-body" style={{ padding: '0 14px 8px' }}>
        {items.map((it, i) => (
          <div className="upcoming-row" key={i}>
            <div className="upcoming-time">
              <span>{it.t}</span>
              <span className="end">— {it.e}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <span className="av" style={{ background: it.col }}>{it.av}</span>
              <div className="upcoming-info" style={{ minWidth: 0 }}>
                <div className="nm">{it.n}</div>
                <div className="sv">{it.s}</div>
              </div>
            </div>
            <span className="badge accent"><span className="dot" />Confirmada</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DashboardPage() {
  const todayAppts = useQuery({
    queryKey: ['appointments', '2026-05-02'],
    queryFn: () => api.appointments('2026-05-02'),
  })

  return (
    <AppShell active="home" here="Inicio" crumbPath={['Operación', 'Inicio']}>
      <div className="page-head">
        <div>
          <h1>Hola, Camila</h1>
          <div className="subtitle">
            Esto es lo que ocurre hoy en <strong>Clínica Vértice</strong> · Martes 02 de mayo
          </div>
        </div>
        <div className="page-head-actions">
          <button className="btn-soft">Exportar</button>
          <button className="btn-soft">Compartir</button>
          <button className="btn-grad">{NavIcon.plus} Nueva cita</button>
        </div>
      </div>

      <MetricStrip todayCount={todayAppts.data?.length ?? 0} />

      <div className="dash-grid">
        <MonthCalendar todayAppts={todayAppts.data} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <UpcomingList todayAppts={todayAppts.data} />
          <MiniCal />
        </div>
      </div>
    </AppShell>
  )
}
