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
import { NavIcon } from '../components/icons.tsx'
import { api } from '../lib/api.ts'
import { useToast } from '../lib/useToast.ts'
import type { Service } from '../db/schema.ts'

export const Route = createFileRoute('/backoffice/services')({ component: ServicesPage })

const KINDS = ['consulta', 'seguimiento', 'procedimiento', 'bloqueo'] as const
type Kind = (typeof KINDS)[number]

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

const serviceSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  durationMinutes: z.coerce.number().int().min(5, 'Mínimo 5 min').max(480, 'Máximo 8 h'),
  kind: z.enum(KINDS),
})

interface ServiceFormProps {
  initial?: Service
  onSubmit: (values: { name: string; durationMinutes: number; kind: Kind }) => Promise<void>
  onCancel: () => void
  submitLabel: string
}

function ServiceForm({ initial, onSubmit, onCancel, submitLabel }: ServiceFormProps) {
  const [error, setError] = useState<string | null>(null)
  const form = useForm({
    defaultValues: {
      name: initial?.name ?? '',
      durationMinutes: initial?.durationMinutes ?? 30,
      kind: initial?.kind ?? 'consulta',
    },
    validators: { onSubmit: serviceSchema },
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
      <form.Field name="name">
        {(field) => (
          <div className="field">
            <label className="field-label" htmlFor={field.name}>Nombre</label>
            <input
              id={field.name}
              className="input focus-ring"
              type="text"
              placeholder="Ej. Consulta general"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.errors.length > 0 && (
              <span style={{ fontSize: 12, color: 'var(--danger)' }}>
                {String(field.state.meta.errors[0]?.message ?? field.state.meta.errors[0])}
              </span>
            )}
          </div>
        )}
      </form.Field>

      <div className="modal-grid two">
        <form.Field name="durationMinutes">
          {(field) => (
            <div className="field">
              <label className="field-label" htmlFor={field.name}>Duración (min)</label>
              <input
                id={field.name}
                className="input focus-ring"
                type="number"
                min={5}
                max={480}
                step={5}
                value={field.state.value}
                onChange={(e) => field.handleChange(Number(e.target.value))}
                onBlur={field.handleBlur}
              />
              {field.state.meta.errors.length > 0 && (
                <span style={{ fontSize: 12, color: 'var(--danger)' }}>
                  {String(field.state.meta.errors[0]?.message ?? field.state.meta.errors[0])}
                </span>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="kind">
          {(field) => (
            <div className="field">
              <label className="field-label" htmlFor={field.name}>Tipo</label>
              <select
                id={field.name}
                className="input focus-ring"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value as Kind)}
              >
                {KINDS.map((k) => (
                  <option key={k} value={k}>{KIND_LABEL[k]}</option>
                ))}
              </select>
            </div>
          )}
        </form.Field>
      </div>

      {error && (
        <div role="alert" style={{
          fontSize: 13, color: 'var(--danger)',
          background: 'var(--danger-bg)',
          border: '1px solid color-mix(in oklab, var(--danger) 30%, transparent)',
          padding: '8px 12px', borderRadius: 'var(--radius-2)',
        }}>{error}</div>
      )}

      <div className="modal-actions">
        <button type="button" className="btn-soft" onClick={onCancel}>Cancelar</button>
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <button type="submit" className="btn-grad" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando…' : submitLabel}
            </button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}

function ServicesPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [kindFilter, setKindFilter] = useState<Kind | 'all'>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [deleting, setDeleting] = useState<Service | null>(null)

  const servicesQuery = useQuery({ queryKey: ['services'], queryFn: () => api.services() })

  const createMut = useMutation({
    mutationFn: api.createService,
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ['services'] })
      toast.success('Servicio creado', row.name)
    },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof api.updateService>[1] }) =>
      api.updateService(id, body),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ['services'] })
      toast.success('Servicio actualizado', row.name)
    },
  })
  const deleteMut = useMutation({
    mutationFn: api.deleteService,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] })
      toast.success('Servicio eliminado')
    },
  })

  const data = useMemo(() => {
    const all = servicesQuery.data ?? []
    return kindFilter === 'all' ? all : all.filter((s) => s.kind === kindFilter)
  }, [servicesQuery.data, kindFilter])

  const columns = useMemo<Array<ColumnDef<Service>>>(() => [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => (
        <span style={{ fontWeight: 500, color: 'var(--app-heading)' }}>{row.original.name}</span>
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
      accessorKey: 'durationMinutes',
      header: 'Duración',
      cell: ({ row }) => `${row.original.durationMinutes} min`,
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="row-actions">
          <button className="btn-soft" onClick={() => setEditing(row.original)}>Editar</button>
          <button className="btn-soft" onClick={() => setDeleting(row.original)} aria-label="Eliminar">
            ✕
          </button>
        </div>
      ),
    },
  ], [])

  return (
    <AppShell active="svc" here="Servicios" crumbPath={['Operación', 'Servicios']}>
      <div className="page-head">
        <div>
          <h1>Servicios</h1>
          <div className="subtitle">Tipos de cita y duraciones que ofrece tu equipo.</div>
        </div>
        <div className="page-head-actions">
          <button className="btn-grad" onClick={() => setCreateOpen(true)}>
            {NavIcon.plus} Nuevo servicio
          </button>
        </div>
      </div>

      <div className="table-toolbar">
        <input
          className="input-sm"
          type="search"
          placeholder="Buscar por nombre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="seg" style={{ marginLeft: 8 }}>
          <button className={kindFilter === 'all' ? 'active' : ''} onClick={() => setKindFilter('all')}>Todos</button>
          {KINDS.map((k) => (
            <button
              key={k}
              className={kindFilter === k ? 'active' : ''}
              onClick={() => setKindFilter(k)}
            >
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--app-muted)' }}>
          {data.length} servicios
        </span>
      </div>

      <DataTable
        data={data}
        columns={columns}
        globalFilter={search}
        isLoading={servicesQuery.isPending}
        emptyState={
          <EmptyState
            title="Aún no hay servicios"
            description="Define al menos uno para poder agendar citas."
            icon={NavIcon.svc}
            action={
              <button className="btn-grad" onClick={() => setCreateOpen(true)}>
                {NavIcon.plus} Nuevo servicio
              </button>
            }
          />
        }
      />

      <Modal open={createOpen} onOpenChange={setCreateOpen} title="Nuevo servicio">
        <ServiceForm
          submitLabel="Crear servicio"
          onSubmit={async (v) => {
            await createMut.mutateAsync(v)
            setCreateOpen(false)
          }}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      <Modal
        open={editing !== null}
        onOpenChange={(o) => { if (!o) setEditing(null) }}
        title="Editar servicio"
      >
        {editing && (
          <ServiceForm
            initial={editing}
            submitLabel="Guardar cambios"
            onSubmit={async (v) => {
              await updateMut.mutateAsync({ id: editing.id, body: v })
              setEditing(null)
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => { if (!o) setDeleting(null) }}
        title="Eliminar servicio"
        description={
          deleting
            ? `¿Eliminar "${deleting.name}"? Las citas existentes que lo usaban se conservan.`
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
