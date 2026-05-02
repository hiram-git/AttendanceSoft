import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { AppShell } from '../components/AppShell.tsx'
import { NewAppointmentDialog } from '../components/NewAppointmentDialog.tsx'
import { NavIcon } from '../components/icons.tsx'
import { api } from '../lib/api.ts'
import type { Appointment } from '../db/schema.ts'

export const Route = createFileRoute('/dashboard')({ component: DashboardPage })

const MONTH_FROM = '2026-05-01'
const MONTH_TO = '2026-05-31'
const TODAY_DATE = '2026-05-02'
const TODAY_DAY = 2

const KIND_TO_NUM: Record<string, number> = {
  consulta: 1,
  seguimiento: 2,
  procedimiento: 3,
  bloqueo: 4,
}

type CalItem = { t: string; l: string; k: number }

function groupByDay(appts: Array<Appointment>): Record<number, Array<CalItem>> {
  const out: Record<number, Array<CalItem>> = {}
  for (const a of appts) {
    const day = parseInt(a.date.slice(8, 10), 10)
    const bucket = out[day] ?? (out[day] = [])
    bucket.push({
      t: a.startTime.slice(0, 5),
      l: a.label,
      k: KIND_TO_NUM[a.kind] ?? 1,
    })
  }
  for (const day of Object.keys(out)) {
    out[Number(day)].sort((a, b) => a.t.localeCompare(b.t))
  }
  return out
}

function MonthCalendar({ apptsByDay, total }: { apptsByDay: Record<number, Array<CalItem>>; total: number }) {
  const cells: Array<{
    key: string
    day: number
    muted: boolean
    items: Array<CalItem>
    isToday?: boolean
  }> = []

  const apriLead = [27, 28, 29, 30]
  apriLead.forEach((d, i) => cells.push({ key: `pre-${i}`, day: d, muted: true, items: [] }))
  for (let d = 1; d <= 31; d++) {
    cells.push({
      key: `m-${d}`,
      day: d,
      muted: false,
      items: apptsByDay[d] ?? [],
      isToday: d === TODAY_DAY,
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
        <span style={{ marginLeft: 'auto', color: 'var(--app-muted)' }}>{total} citas este mes</span>
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

interface Metrics {
  todayCount: number
  yesterdayCount: number
  cancellationsToday: number
  occupancyPct: number
}

const DAY_CAPACITY = 12 // approx max slots / day used to derive occupancy

function MetricStrip({ m }: { m: Metrics }) {
  const todayDelta = m.todayCount - m.yesterdayCount
  const todayPct = m.yesterdayCount > 0
    ? Math.round((todayDelta / m.yesterdayCount) * 100)
    : null

  return (
    <div className="metrics">
      <div className="metric">
        <div className="lbl">Citas hoy</div>
        <div className="val">{m.todayCount}</div>
        <div className={'delta ' + (todayDelta >= 0 ? 'up' : 'dn')}>
          {todayDelta >= 0 ? '↑' : '↓'} {todayPct === null ? `${Math.abs(todayDelta)} vs. ayer` : `${Math.abs(todayPct)}% vs. ayer`}
        </div>
        <Spark pts="0,16 8,14 16,15 24,10 32,12 40,7 48,8 60,4" />
      </div>
      <div className="metric">
        <div className="lbl">Ocupación</div>
        <div className="val">
          {m.occupancyPct}<span style={{ fontSize: 16, color: 'var(--app-muted)' }}>%</span>
        </div>
        <div className="delta up">{m.occupancyPct >= 70 ? 'Alta carga' : 'Cómoda'}</div>
        <Spark pts="0,12 10,13 20,9 30,11 40,8 50,6 60,7" color="#10a76b" />
      </div>
      <div className="metric">
        <div className="lbl">Cancelaciones</div>
        <div className="val">{m.cancellationsToday}</div>
        <div className="delta dn">
          {m.cancellationsToday === 0 ? 'Sin cancelaciones' : 'Revisa con el equipo'}
        </div>
        <Spark pts="0,10 10,12 20,11 30,14 40,12 50,15 60,16" color="#e0455a" />
      </div>
      <div className="metric">
        <div className="lbl">Ingreso del día</div>
        <div className="val">${(m.todayCount * 1270).toLocaleString('es-MX')}</div>
        <div className="delta up">≈ ${1270}/cita prom.</div>
        <Spark pts="0,18 10,15 20,12 30,11 40,8 50,9 60,3" color="#c2862c" />
      </div>
    </div>
  )
}

function MiniCal({ apptsByDay }: { apptsByDay: Record<number, Array<CalItem>> }) {
  const days = [
    ['', '', '', '', '1', '2', '3'],
    ['4', '5', '6', '7', '8', '9', '10'],
    ['11', '12', '13', '14', '15', '16', '17'],
    ['18', '19', '20', '21', '22', '23', '24'],
    ['25', '26', '27', '28', '29', '30', '31'],
  ]
  const has = new Set(
    Object.entries(apptsByDay)
      .filter(([, items]) => items.length > 0)
      .map(([d]) => Number(d)),
  )
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
              <div
                key={i}
                className={'d' + (n === TODAY_DAY ? ' today' : '') + (has.has(n) ? ' has' : '')}
              >
                {d}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#c5d2ff,#dfe6ff)',
  'linear-gradient(135deg,#ffd5ee,#ffe6f4)',
  'linear-gradient(135deg,#fde2c5,#ffeed8)',
  'linear-gradient(135deg,#c4f0d8,#dff5e8)',
  'linear-gradient(135deg,#ffd1c5,#ffe2da)',
  'linear-gradient(135deg,#e2d4ff,#efe5ff)',
]

function initialsFromName(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function UpcomingList({ todayAppts }: { todayAppts: Array<Appointment> }) {
  if (todayAppts.length === 0) {
    return (
      <div className="card aside-card">
        <div className="card-head">
          <h3>Hoy · 00 citas</h3>
          <span className="sub">Mar 02 May</span>
        </div>
        <div className="card-body" style={{ padding: '24px 18px', color: 'var(--app-muted)', fontSize: 13 }}>
          No hay citas para hoy. Aprovecha y crea una con el botón "Nueva cita".
        </div>
      </div>
    )
  }

  const items = [...todayAppts]
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map((a, i) => {
      const [name, ...rest] = a.label.split(' · ')
      return {
        id: a.id,
        t: a.startTime.slice(0, 5),
        e: a.endTime.slice(0, 5),
        n: name,
        s: (rest.length ? rest.join(' · ') : a.label) + (a.room ? ` · ${a.room}` : ''),
        av: initialsFromName(name),
        col: AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length],
        status: a.status,
      }
    })

  return (
    <div className="card aside-card">
      <div className="card-head">
        <h3>Hoy · {String(items.length).padStart(2, '0')} citas</h3>
        <span className="sub">Mar 02 May</span>
        <button className="icon-btn" style={{ marginLeft: 'auto' }}>›</button>
      </div>
      <div className="card-body" style={{ padding: '0 14px 8px' }}>
        {items.map((it) => (
          <div className="upcoming-row" key={it.id}>
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
            <span
              className={
                'badge ' +
                (it.status === 'confirmada' ? 'accent'
                : it.status === 'cancelada' ? 'danger'
                : 'warning')
              }
            >
              <span className="dot" />
              {it.status === 'confirmada' ? 'Confirmada'
                : it.status === 'cancelada' ? 'Cancelada'
                : 'Pendiente'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DashboardPage() {
  const [dialogOpen, setDialogOpen] = useState(false)

  const monthAppts = useQuery({
    queryKey: ['appointments', 'range', MONTH_FROM, MONTH_TO],
    queryFn: () => api.appointments({ from: MONTH_FROM, to: MONTH_TO }),
  })

  const data = monthAppts.data ?? []

  const apptsByDay = useMemo(() => groupByDay(data), [data])

  const todayAppts = useMemo(
    () => data.filter((a) => a.date === TODAY_DATE),
    [data],
  )

  const yesterdayAppts = useMemo(
    () => data.filter((a) => a.date === '2026-05-01'),
    [data],
  )

  const metrics: Metrics = useMemo(() => {
    const todayActive = todayAppts.filter((a) => a.status !== 'cancelada')
    return {
      todayCount: todayActive.length,
      yesterdayCount: yesterdayAppts.filter((a) => a.status !== 'cancelada').length,
      cancellationsToday: todayAppts.filter((a) => a.status === 'cancelada').length,
      occupancyPct: Math.min(100, Math.round((todayActive.length / DAY_CAPACITY) * 100)),
    }
  }, [todayAppts, yesterdayAppts])

  return (
    <AppShell
      active="home"
      here="Inicio"
      crumbPath={['Operación', 'Inicio']}
      onNewAppointment={() => setDialogOpen(true)}
    >
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
          <button className="btn-grad" onClick={() => setDialogOpen(true)}>
            {NavIcon.plus} Nueva cita
          </button>
        </div>
      </div>

      <MetricStrip m={metrics} />

      <div className="dash-grid">
        <MonthCalendar apptsByDay={apptsByDay} total={data.length} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <UpcomingList todayAppts={todayAppts} />
          <MiniCal apptsByDay={apptsByDay} />
        </div>
      </div>

      <NewAppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultDate={TODAY_DATE}
      />
    </AppShell>
  )
}
