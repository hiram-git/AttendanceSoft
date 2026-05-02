import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'
import { AppShell } from '../components/AppShell.tsx'
import { DataTable } from '../components/DataTable.tsx'
import { Modal } from '../components/Modal.tsx'
import { ConfirmDialog } from '../components/ConfirmDialog.tsx'
import { EmptyState } from '../components/EmptyState.tsx'
import { NewAppointmentDialog } from '../components/NewAppointmentDialog.tsx'
import { NavIcon } from '../components/icons.tsx'
import { api } from '../lib/api.ts'
import { useToast } from '../lib/useToast.ts'
import type { Appointment, Staff } from '../db/schema.ts'

export const Route = createFileRoute('/backoffice/appointments')({ component: AppointmentsPage })

const KINDS = ['consulta', 'seguimiento', 'procedimiento', 'bloqueo'] as const
type Kind = (typeof KINDS)[number]
const STATUSES = ['confirmada', 'pendiente', 'cancelada'] as const
type Status = (typeof STATUSES)[number]

const KIND_LABEL: Record<Kind, string> = {
  consulta: 'Consulta',
  seguimiento: 'Seguimiento',
  procedimiento: 'Procedimiento',
  bloqueo: 'Bloqueo',
}
const KIND_BADGE: Record<Kind, string> = {
  consulta: 'accent',
  seguimiento: 'success',
  procedimiento: 'warning',
  bloqueo: 'danger',
}
const STATUS_LABEL: Record<Status, string> = {
  confirmada: 'Confirmada',
  pendiente: 'Pendiente',
  cancelada: 'Cancelada',
}
const STATUS_BADGE: Record<Status, string> = {
  confirmada: 'accent',
  pendiente: 'warning',
  cancelada: 'danger',
}

const editSchema = z.object({
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  label: z.string().min(2),
  kind: z.enum(KINDS),
  status: z.enum(STATUSES),
  room: z.string().optional(),
})

interface EditAppointmentFormProps {
  appt: Appointment
  onSubmit: (v: z.infer<typeof editSchema>) => Promise<void>
  onCancel: () => void
}

function EditAppointmentForm({ appt, onSubmit, onCancel }: EditAppointmentFormProps) {
  const [error, setError] = useState<string | null>(null)
  const form = useForm({
    defaultValues: {
      date: appt.date,
      startTime: appt.startTime.slice(0, 5),
      endTime: appt.endTime.slice(0, 5),
      label: appt.label,
      kind: appt.kind,
      status: appt.status,
      room: appt.room ?? '',
    },
    validators: { onSubmit: editSchema },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        await onSubmit(value)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al guardar')
      }
    },
  })

  return (
    <form
      className="modal-body"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      <div className="modal-grid two">
        <form.Field name="date">
          {(field) => (
            <div className="field">
              <label className="field-label">Fecha</label>
              <input
                className="input focus-ring" type="date"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.Field>
        <form.Field name="status">
          {(field) => (
            <div className="field">
              <label className="field-label">Estado</label>
              <select
                className="input focus-ring"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value as Status)}
              >
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
          )}
        </form.Field>
      </div>

      <div className="modal-grid two">
        <form.Field name="startTime">
          {(field) => (
            <div className="field">
              <label className="field-label">Inicio</label>
              <input
                className="input focus-ring" type="time"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.Field>
        <form.Field name="endTime">
          {(field) => (
            <div className="field">
              <label className="field-label">Fin</label>
              <input
                className="input focus-ring" type="time"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.Field>
      </div>

      <form.Field name="label">
        {(field) => (
          <div className="field">
            <label className="field-label">Título</label>
            <input
              className="input focus-ring" type="text"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      </form.Field>

      <div className="modal-grid two">
        <form.Field name="kind">
          {(field) => (
            <div className="field">
              <label className="field-label">Tipo</label>
              <select
                className="input focus-ring"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value as Kind)}
              >
                {KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
              </select>
            </div>
          )}
        </form.Field>
        <form.Field name="room">
          {(field) => (
            <div className="field">
              <label className="field-label">Sala</label>
              <input
                className="input focus-ring" type="text"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.Field>
      </div>

      {error && (
        <div role="alert" style={{
          fontSize: 13, color: 'var(--danger)', background: 'var(--danger-bg)',
          border: '1px solid color-mix(in oklab, var(--danger) 30%, transparent)',
          padding: '8px 12px', borderRadius: 'var(--radius-2)',
        }}>{error}</div>
      )}

      <div className="modal-actions">
        <button type="button" className="btn-soft" onClick={onCancel}>Cancelar</button>
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(s) => (
            <button type="submit" className="btn-grad" disabled={s}>
              {s ? 'Guardando…' : 'Guardar cambios'}
            </button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}

function AppointmentsPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const today = new Date().toISOString().slice(0, 10)
  const [from, setFrom] = useState('2026-05-01')
  const [to, setTo] = useState('2026-05-31')
  const [search, setSearch] = useState('')
  const [kindFilter, setKindFilter] = useState<Kind | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Appointment | null>(null)
  const [deleting, setDeleting] = useState<Appointment | null>(null)

  const apptsQuery = useQuery({
    queryKey: ['appointments', 'range', from, to],
    queryFn: () => api.appointments({ from, to }),
  })
  const staffQuery = useQuery({ queryKey: ['staff'], queryFn: () => api.staff() })

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof api.updateAppointment>[1] }) =>
      api.updateAppointment(id, body),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Cita actualizada', row.label)
    },
    onError: (e) => {
      toast.error('No pudimos actualizar', e instanceof Error ? e.message : undefined)
    },
  })
  const deleteMut = useMutation({
    mutationFn: api.deleteAppointment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Cita eliminada')
    },
  })

  const staffById = useMemo(() => {
    const map = new Map<string, Staff>()
    for (const s of staffQuery.data ?? []) map.set(s.id, s)
    return map
  }, [staffQuery.data])

  const data = useMemo(() => {
    const all = apptsQuery.data ?? []
    return all
      .filter((a) => kindFilter === 'all' || a.kind === kindFilter)
      .filter((a) => statusFilter === 'all' || a.status === statusFilter)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date)
        return a.startTime.localeCompare(b.startTime)
      })
  }, [apptsQuery.data, kindFilter, statusFilter])

  const columns = useMemo<Array<ColumnDef<Appointment>>>(() => [
    {
      accessorKey: 'date',
      header: 'Fecha',
      cell: ({ row }) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          {new Date(row.original.date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
          {' · '}
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
            {row.original.startTime.slice(0, 5)}
          </span>
        </span>
      ),
    },
    {
      accessorKey: 'label',
      header: 'Cita',
      cell: ({ row }) => (
        <span style={{ fontWeight: 500, color: 'var(--app-heading)' }}>{row.original.label}</span>
      ),
    },
    {
      accessorKey: 'kind',
      header: 'Tipo',
      cell: ({ row }) => {
        const k = row.original.kind
        return <span className={`badge ${KIND_BADGE[k]}`}><span className="dot" />{KIND_LABEL[k]}</span>
      },
    },
    {
      accessorKey: 'staffId',
      header: 'Personal',
      cell: ({ row }) => {
        const s = row.original.staffId ? staffById.get(row.original.staffId) : null
        return s ? s.name : <span style={{ color: 'var(--app-muted)' }}>—</span>
      },
    },
    {
      accessorKey: 'room',
      header: 'Sala',
      cell: ({ row }) => row.original.room ?? <span style={{ color: 'var(--app-muted)' }}>—</span>,
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const s = row.original.status
        return <span className={`badge ${STATUS_BADGE[s]}`}><span className="dot" />{STATUS_LABEL[s]}</span>
      },
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="row-actions">
          <button className="btn-soft" onClick={() => setEditing(row.original)}>Editar</button>
          {row.original.status !== 'cancelada' && (
            <button
              className="btn-soft"
              title="Marcar como cancelada"
              onClick={() => updateMut.mutate({ id: row.original.id, body: { status: 'cancelada' } })}
            >
              Cancelar
            </button>
          )}
          <button className="btn-soft" onClick={() => setDeleting(row.original)} aria-label="Eliminar">
            ✕
          </button>
        </div>
      ),
    },
  ], [staffById, updateMut])

  return (
    <AppShell
      active="cal"
      here="Agenda"
      crumbPath={['Operación', 'Agenda']}
      onNewAppointment={() => setCreateOpen(true)}
    >
      <div className="page-head">
        <div>
          <h1>Agenda</h1>
          <div className="subtitle">Todas las citas en el rango seleccionado.</div>
        </div>
        <div className="page-head-actions">
          <button className="btn-grad" onClick={() => setCreateOpen(true)}>
            {NavIcon.plus} Nueva cita
          </button>
        </div>
      </div>

      <div className="table-toolbar">
        <input
          className="input-sm"
          type="search"
          placeholder="Buscar título…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          className="input-sm" type="date"
          value={from} onChange={(e) => setFrom(e.target.value)}
          aria-label="Desde"
          style={{ minWidth: 0 }}
        />
        <span style={{ color: 'var(--app-muted)', fontSize: 12 }}>→</span>
        <input
          className="input-sm" type="date"
          value={to} onChange={(e) => setTo(e.target.value)}
          aria-label="Hasta"
          style={{ minWidth: 0 }}
        />
        <div className="seg" style={{ marginLeft: 4 }}>
          <button className={kindFilter === 'all' ? 'active' : ''} onClick={() => setKindFilter('all')}>Todos</button>
          {KINDS.map((k) => (
            <button
              key={k}
              className={kindFilter === k ? 'active' : ''}
              onClick={() => setKindFilter(k)}
            >{KIND_LABEL[k]}</button>
          ))}
        </div>
        <div className="seg">
          <button className={statusFilter === 'all' ? 'active' : ''} onClick={() => setStatusFilter('all')}>Todos</button>
          {STATUSES.map((s) => (
            <button
              key={s}
              className={statusFilter === s ? 'active' : ''}
              onClick={() => setStatusFilter(s)}
            >{STATUS_LABEL[s]}</button>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--app-muted)' }}>
          {data.length} citas
        </span>
      </div>

      <DataTable
        data={data}
        columns={columns}
        globalFilter={search}
        isLoading={apptsQuery.isPending}
        emptyState={
          <EmptyState
            title="Sin citas en este rango"
            description={`Entre ${from} y ${to} no hay registros que coincidan con los filtros.`}
            icon={NavIcon.cal}
            action={
              <button className="btn-grad" onClick={() => setCreateOpen(true)}>
                {NavIcon.plus} Crear cita
              </button>
            }
          />
        }
      />

      <NewAppointmentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultDate={today}
      />

      <Modal
        open={editing !== null}
        onOpenChange={(o) => { if (!o) setEditing(null) }}
        title="Editar cita"
      >
        {editing && (
          <EditAppointmentForm
            appt={editing}
            onCancel={() => setEditing(null)}
            onSubmit={async (v) => {
              await updateMut.mutateAsync({
                id: editing.id,
                body: {
                  ...v,
                  room: v.room ? v.room : null,
                },
              })
              setEditing(null)
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => { if (!o) setDeleting(null) }}
        title="Eliminar cita"
        description={
          deleting
            ? `¿Eliminar "${deleting.label}"? Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Eliminar"
        destructive
        onConfirm={async () => {
          if (deleting) await deleteMut.mutateAsync(deleting.id)
          setDeleting(null)
        }}
      />
    </AppShell>
  )
}
