import { useMemo } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { PortalShell } from '../components/PortalShell.tsx'
import { NavIcon } from '../components/icons.tsx'
import { api } from '../lib/api.ts'
import type { Appointment } from '../db/schema.ts'

export const Route = createFileRoute('/portal/')({ component: PortalHome })

const KIND_LABEL: Record<Appointment['kind'], string> = {
  consulta: 'Consulta',
  seguimiento: 'Seguimiento',
  procedimiento: 'Procedimiento',
  bloqueo: 'Bloqueo',
}

const STATUS_BADGE: Record<Appointment['status'], string> = {
  confirmada: 'accent',
  pendiente: 'warning',
  cancelada: 'danger',
}

const STATUS_LABEL: Record<Appointment['status'], string> = {
  confirmada: 'Confirmada',
  pendiente: 'Pendiente',
  cancelada: 'Cancelada',
}

function isoToday() {
  // Match the seeded data window so the demo shows real upcoming rows
  // even when the system clock differs from the dataset.
  return '2026-05-02'
}

function PortalHome() {
  const meQuery = useQuery({
    queryKey: ['portal', 'me'],
    queryFn: () => api.portalMe(),
  })
  const apptsQuery = useQuery({
    queryKey: ['portal', 'appointments'],
    queryFn: () => api.portalAppointments(),
  })

  const today = isoToday()

  const { upcoming, past } = useMemo(() => {
    const all = apptsQuery.data ?? []
    const futureOpen = all
      .filter((a) => a.date >= today && a.status !== 'cancelada')
      .sort((a, b) =>
        a.date === b.date
          ? a.startTime.localeCompare(b.startTime)
          : a.date.localeCompare(b.date),
      )
    const history = all
      .filter((a) => a.date < today)
      .sort((a, b) => b.date.localeCompare(a.date))
    return { upcoming: futureOpen, past: history }
  }, [apptsQuery.data, today])

  const firstName = (meQuery.data?.user.name ?? '').split(' ')[0]

  const next = upcoming.at(0)
  const formatDate = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('es-MX', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    })

  return (
    <PortalShell active="home">
      <section className="portal-hero">
        <h1>Hola{firstName ? `, ${firstName}` : ''}.</h1>
        <p>Esto es lo que tienes agendado y la opción para reservar más.</p>
      </section>

      <div className="portal-grid">
        <div className="portal-cta-card">
          <h2>Reserva una cita en menos de un minuto.</h2>
          <p>
            Elige un servicio, una persona y un horario disponible. Te enviamos la
            confirmación al correo y la guardamos en tu historial.
          </p>
          <Link to="/portal/book" className="btn-min">
            {NavIcon.plus} Reservar nueva cita
          </Link>
        </div>

        <div className="portal-stat-card">
          <span className="lbl">Próxima cita</span>
          {next ? (
            <>
              <span className="val">{next.startTime.slice(0, 5)}</span>
              <span className="sub">
                {formatDate(next.date)} · {KIND_LABEL[next.kind]}
                {next.room ? ` · ${next.room}` : ''}
              </span>
            </>
          ) : (
            <>
              <span className="val">—</span>
              <span className="sub">No tienes citas próximas.</span>
            </>
          )}
        </div>
      </div>

      <div className="portal-list">
        <div className="portal-list-head">
          <h3>Próximas citas</h3>
          <span className="sub">{upcoming.length} programadas</span>
        </div>
        {apptsQuery.isPending ? (
          <div className="portal-empty">Cargando…</div>
        ) : upcoming.length === 0 ? (
          <div className="portal-empty">
            No tienes citas próximas. Empieza por{' '}
            <Link to="/portal/book" style={{ color: 'var(--accent)' }}>
              reservar una
            </Link>
            .
          </div>
        ) : (
          upcoming.map((a) => (
            <div key={a.id} className="portal-list-row">
              <div className="when">
                {a.startTime.slice(0, 5)}
                <small>{formatDate(a.date)}</small>
              </div>
              <div className="what">
                <div className="nm">{a.label}</div>
                <div className="meta">
                  {KIND_LABEL[a.kind]}
                  {a.room ? ` · ${a.room}` : ''}
                </div>
              </div>
              <span className={`badge ${STATUS_BADGE[a.status]}`}>
                <span className="dot" />
                {STATUS_LABEL[a.status]}
              </span>
            </div>
          ))
        )}
      </div>

      {past.length > 0 && (
        <div className="portal-list">
          <div className="portal-list-head">
            <h3>Historial reciente</h3>
            <span className="sub">últimas 5</span>
          </div>
          {past.slice(0, 5).map((a) => (
            <div key={a.id} className="portal-list-row">
              <div className="when">
                {a.startTime.slice(0, 5)}
                <small>{formatDate(a.date)}</small>
              </div>
              <div className="what">
                <div className="nm">{a.label}</div>
                <div className="meta">
                  {KIND_LABEL[a.kind]}
                  {a.room ? ` · ${a.room}` : ''}
                </div>
              </div>
              <span className={`badge ${STATUS_BADGE[a.status]}`}>
                <span className="dot" />
                {STATUS_LABEL[a.status]}
              </span>
            </div>
          ))}
        </div>
      )}
    </PortalShell>
  )
}
