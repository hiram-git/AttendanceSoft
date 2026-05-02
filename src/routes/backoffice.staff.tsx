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
import { AvailabilityEditor } from '../components/AvailabilityEditor.tsx'
import { NavIcon } from '../components/icons.tsx'
import { api } from '../lib/api.ts'
import { useToast } from '../lib/useToast.ts'
import type { Staff } from '../db/schema.ts'

export const Route = createFileRoute('/backoffice/staff')({ component: StaffPage })

const GRADIENTS = [
  'linear-gradient(135deg,#c5d2ff,#dfe6ff)',
  'linear-gradient(135deg,#ffd5ee,#ffe6f4)',
  'linear-gradient(135deg,#fde2c5,#ffeed8)',
  'linear-gradient(135deg,#c4f0d8,#dff5e8)',
  'linear-gradient(135deg,#ffd1c5,#ffe2da)',
  'linear-gradient(135deg,#e2d4ff,#efe5ff)',
] as const

const staffSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  role: z.string().min(2, 'Mínimo 2 caracteres'),
  initials: z.string().min(1).max(3, 'Máximo 3 letras'),
  avatarGradient: z.string().min(1),
  rooms: z.array(z.string()).default([]),
})

interface StaffFormProps {
  initial?: Staff
  onSubmit: (values: z.infer<typeof staffSchema>) => Promise<void>
  onCancel: () => void
  submitLabel: string
}

function initialsOf(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function StaffForm({ initial, onSubmit, onCancel, submitLabel }: StaffFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [roomsText, setRoomsText] = useState((initial?.rooms ?? []).join(', '))

  const form = useForm({
    defaultValues: {
      name: initial?.name ?? '',
      role: initial?.role ?? '',
      initials: initial?.initials ?? '',
      avatarGradient: initial?.avatarGradient ?? GRADIENTS[0],
      rooms: initial?.rooms ?? [],
    },
    validators: { onSubmit: staffSchema },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        await onSubmit({
          ...value,
          rooms: roomsText
            .split(',')
            .map((s) => s.trim().toUpperCase())
            .filter(Boolean),
        })
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
        <form.Field name="name">
          {(field) => (
            <div className="field">
              <label className="field-label" htmlFor={field.name}>Nombre</label>
              <input
                id={field.name}
                className="input focus-ring"
                type="text"
                placeholder="Ej. Andrea Méndez"
                value={field.state.value}
                onChange={(e) => {
                  field.handleChange(e.target.value)
                  if (!initial) {
                    form.setFieldValue('initials', initialsOf(e.target.value))
                  }
                }}
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

        <form.Field name="role">
          {(field) => (
            <div className="field">
              <label className="field-label" htmlFor={field.name}>Rol</label>
              <input
                id={field.name}
                className="input focus-ring"
                type="text"
                placeholder="Ej. Médica general"
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
      </div>

      <div className="modal-grid two">
        <form.Field name="initials">
          {(field) => (
            <div className="field">
              <label className="field-label" htmlFor={field.name}>Iniciales</label>
              <input
                id={field.name}
                className="input focus-ring"
                type="text"
                maxLength={3}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="avatarGradient">
          {(field) => (
            <div className="field">
              <label className="field-label" htmlFor={field.name}>Color de avatar</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {GRADIENTS.map((g, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => field.handleChange(g)}
                    aria-label={`Avatar ${i + 1}`}
                    style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: g, cursor: 'pointer',
                      border: field.state.value === g
                        ? '2px solid var(--accent)'
                        : '1px solid var(--app-border-strong)',
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </form.Field>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="rooms">Salas (separadas por coma)</label>
        <input
          id="rooms"
          className="input focus-ring"
          type="text"
          placeholder="Ej. SALA 1, SALA 2"
          value={roomsText}
          onChange={(e) => setRoomsText(e.target.value)}
        />
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

function StaffPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Staff | null>(null)
  const [deleting, setDeleting] = useState<Staff | null>(null)
  const [availabilityFor, setAvailabilityFor] = useState<Staff | null>(null)

  const staffQuery = useQuery({ queryKey: ['staff'], queryFn: () => api.staff() })

  const createMut = useMutation({
    mutationFn: api.createStaff,
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ['staff'] })
      toast.success('Persona agregada', row.name)
    },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof api.updateStaff>[1] }) =>
      api.updateStaff(id, body),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ['staff'] })
      toast.success('Persona actualizada', row.name)
    },
  })
  const deleteMut = useMutation({
    mutationFn: api.deleteStaff,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] })
      toast.success('Persona eliminada')
    },
  })

  const columns = useMemo<Array<ColumnDef<Staff>>>(() => [
    {
      accessorKey: 'name',
      header: 'Persona',
      cell: ({ row }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            className="av"
            style={{ background: row.original.avatarGradient, width: 28, height: 28 }}
          >
            {row.original.initials}
          </span>
          <span style={{ fontWeight: 500, color: 'var(--app-heading)' }}>{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Rol',
    },
    {
      id: 'rooms',
      header: 'Salas',
      cell: ({ row }) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {row.original.rooms.length === 0
            ? <span style={{ color: 'var(--app-muted)' }}>—</span>
            : row.original.rooms.map((r) => (
                <span
                  key={r}
                  style={{
                    fontSize: 10.5, fontFamily: 'var(--font-mono)',
                    color: 'var(--app-muted)', letterSpacing: '0.04em',
                    padding: '2px 6px',
                    border: '1px solid var(--app-border)',
                    background: 'var(--app-surface-2)',
                    borderRadius: 4,
                  }}
                >{r}</span>
              ))
          }
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="row-actions">
          <button
            type="button"
            className="icon-btn tone-success"
            title="Disponibilidad semanal"
            aria-label="Disponibilidad semanal"
            onClick={() => setAvailabilityFor(row.original)}
          >
            {NavIcon.clock}
          </button>
          <button
            type="button"
            className="icon-btn tone-accent"
            title="Editar persona"
            aria-label="Editar persona"
            onClick={() => setEditing(row.original)}
          >
            {NavIcon.edit}
          </button>
          <button
            type="button"
            className="icon-btn tone-danger"
            title="Eliminar persona"
            aria-label="Eliminar persona"
            onClick={() => setDeleting(row.original)}
          >
            {NavIcon.trash}
          </button>
        </div>
      ),
    },
  ], [])

  return (
    <AppShell active="staff" here="Equipo" crumbPath={['Backoffice', 'Equipo']}>
      <div className="page-head">
        <div>
          <h1>Equipo</h1>
          <div className="subtitle">Personal disponible para tomar citas y procedimientos.</div>
        </div>
        <div className="page-head-actions">
          <button className="btn-grad" onClick={() => setCreateOpen(true)}>
            {NavIcon.plus} Nueva persona
          </button>
        </div>
      </div>

      <div className="table-toolbar">
        <input
          className="input-sm"
          type="search"
          placeholder="Buscar por nombre o rol…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--app-muted)' }}>
          {staffQuery.data?.length ?? 0} personas
        </span>
      </div>

      <DataTable
        data={staffQuery.data ?? []}
        columns={columns}
        globalFilter={search}
        isLoading={staffQuery.isPending}
        emptyState={
          <EmptyState
            title="Aún no hay personal"
            description="Agrega al menos una persona al equipo para empezar."
            icon={NavIcon.staff}
            action={
              <button className="btn-grad" onClick={() => setCreateOpen(true)}>
                {NavIcon.plus} Nueva persona
              </button>
            }
          />
        }
      />

      <Modal open={createOpen} onOpenChange={setCreateOpen} title="Nueva persona">
        <StaffForm
          submitLabel="Crear"
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
        title="Editar persona"
      >
        {editing && (
          <StaffForm
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
        title="Eliminar persona"
        description={
          deleting
            ? `¿Eliminar a ${deleting.name} del equipo? Las citas previas se conservan.`
            : ''
        }
        confirmLabel="Eliminar"
        destructive
        onConfirm={async () => {
          if (deleting) await deleteMut.mutateAsync(deleting.id)
          setDeleting(null)
        }}
      />

      <AvailabilityEditor
        staff={availabilityFor}
        open={availabilityFor !== null}
        onOpenChange={(o) => { if (!o) setAvailabilityFor(null) }}
      />
    </AppShell>
  )
}
