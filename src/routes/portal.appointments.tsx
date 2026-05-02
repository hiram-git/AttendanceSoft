import { useMemo, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PortalShell } from '../components/PortalShell.tsx'
import { ConfirmDialog } from '../components/ConfirmDialog.tsx'
import { EmptyState } from '../components/EmptyState.tsx'
import { NavIcon } from '../components/icons.tsx'
import { api } from '../lib/api.ts'
import { useToast } from '../lib/useToast.ts'
import type { Appointment } from '../db/schema.ts'

export const Route = createFileRoute('/portal/appointments')({
  component: PortalAppointmentsPage,
})

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

const TODAY = '2026-05-02'

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('es-MX', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function PortalAppointmentsPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming')
  const [cancelling, setCancelling] = useState<Appointment | null>(null)

  const apptsQ = useQuery({
    queryKey: ['portal', 'appointments'],
    queryFn: () => api.portalAppointments(),
  })

  const cancelMut = useMutation({
    mutationFn: (id: string) => api.portalCancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal', 'appointments'] })
      toast.success('Cita cancelada')
    },
    onError: (e) => {
      toast.error('No pudimos cancelar', e instanceof Error ? e.message : undefined)
    },
  })

  const rows = useMemo(() => {
    const all = apptsQ.data ?? []
    const sorted = [...all].sort((a, b) =>
      a.date === b.date
        ? a.startTime.localeCompare(b.startTime)
        : b.date.localeCompare(a.date),
    )
    if (filter === 'all') return sorted
    if (filter === 'upcoming') {
      return sorted
        .filter((a) => a.date >= TODAY && a.status !== 'cancelada')
        .reverse()
    }
    return sorted.filter((a) => a.date < TODAY || a.status === 'cancelada')
  }, [apptsQ.data, filter])

  return (
    <PortalShell active="history">
      <section className="portal-hero">
        <h1>Mis citas</h1>
        <p>Tu historial completo. Puedes cancelar las que estén próximas.</p>
      </section>

      <div className="portal-list">
        <div className="portal-list-head">
          <div className="seg" style={{ background: 'var(--app-surface-2)' }}>
            <button
              className={filter === 'upcoming' ? 'active' : ''}
              onClick={() => setFilter('upcoming')}
            >Próximas</button>
            <button
              className={filter === 'past' ? 'active' : ''}
              onClick={() => setFilter('past')}
            >Pasadas</button>
            <button
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >Todas</button>
          </div>
          <span className="sub">{rows.length} citas</span>
        </div>

        {apptsQ.isPending ? (
          <div className="portal-empty">Cargando…</div>
        ) : rows.length === 0 ? (
          <EmptyState
            title={
              filter === 'upcoming'
                ? 'No tienes citas próximas'
                : 'Sin registros'
            }
            description={
              filter === 'upcoming'
                ? 'Reserva una cita nueva desde el botón de abajo.'
                : 'Aquí verás tu historial cuando tengas citas registradas.'
            }
            icon={NavIcon.cal}
            action={
              <Link to="/portal/book" className="btn-grad">
                {NavIcon.plus} Reservar nueva cita
              </Link>
            }
          />
        ) : (
          rows.map((a) => (
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`badge ${STATUS_BADGE[a.status]}`}>
                  <span className="dot" />
                  {STATUS_LABEL[a.status]}
                </span>
                {a.date >= TODAY && a.status === 'confirmada' && (
                  <button
                    type="button"
                    className="icon-btn tone-warning"
                    title="Cancelar cita"
                    aria-label="Cancelar cita"
                    onClick={() => setCancelling(a)}
                  >
                    {NavIcon.ban}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={cancelling !== null}
        onOpenChange={(o) => { if (!o) setCancelling(null) }}
        title="Cancelar cita"
        description={
          cancelling
            ? `¿Seguro que quieres cancelar "${cancelling.label}" del ${formatDate(cancelling.date)} ${cancelling.startTime.slice(0, 5)}? Si necesitas reagendar, vuelve a reservar después.`
            : ''
        }
        confirmLabel="Sí, cancelar"
        cancelLabel="No, mantener"
        destructive
        onConfirm={async () => {
          if (cancelling) await cancelMut.mutateAsync(cancelling.id)
          setCancelling(null)
        }}
      />
    </PortalShell>
  )
}
