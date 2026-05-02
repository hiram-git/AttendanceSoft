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
import type { Client } from '../db/schema.ts'

export const Route = createFileRoute('/backoffice/clients')({ component: ClientsPage })

const clientSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Correo inválido').or(z.literal('')),
  phone: z.string().optional(),
})

type ClientFormValues = {
  name: string
  email: string
  phone: string
}

interface ClientFormProps {
  initial?: Client
  onSubmit: (values: { name: string; email: string | null; phone: string | null }) => Promise<void>
  onCancel: () => void
  submitLabel: string
}

function ClientForm({ initial, onSubmit, onCancel, submitLabel }: ClientFormProps) {
  const [error, setError] = useState<string | null>(null)
  const form = useForm({
    defaultValues: {
      name: initial?.name ?? '',
      email: initial?.email ?? '',
      phone: initial?.phone ?? '',
    } satisfies ClientFormValues,
    validators: { onSubmit: clientSchema },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        await onSubmit({
          name: value.name,
          email: value.email || null,
          phone: value.phone || null,
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
      <form.Field name="name">
        {(field) => (
          <div className="field">
            <label className="field-label" htmlFor={field.name}>Nombre</label>
            <input
              id={field.name}
              className="input focus-ring"
              type="text"
              placeholder="Ej. Camila Reyes"
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
        <form.Field name="email">
          {(field) => (
            <div className="field">
              <label className="field-label" htmlFor={field.name}>Correo</label>
              <input
                id={field.name}
                className="input focus-ring"
                type="email"
                placeholder="cliente@ejemplo.com"
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

        <form.Field name="phone">
          {(field) => (
            <div className="field">
              <label className="field-label" htmlFor={field.name}>Teléfono</label>
              <input
                id={field.name}
                className="input focus-ring"
                type="tel"
                placeholder="+52 ..."
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.Field>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            fontSize: 13, color: 'var(--danger)',
            background: 'var(--danger-bg)',
            border: '1px solid color-mix(in oklab, var(--danger) 30%, transparent)',
            padding: '8px 12px', borderRadius: 'var(--radius-2)',
          }}
        >
          {error}
        </div>
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

function ClientsPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [deleting, setDeleting] = useState<Client | null>(null)

  const clientsQuery = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.clients(),
  })

  const createMut = useMutation({
    mutationFn: api.createClient,
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Cliente creado', row.name)
    },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof api.updateClient>[1] }) =>
      api.updateClient(id, body),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Cliente actualizado', row.name)
    },
  })
  const deleteMut = useMutation({
    mutationFn: api.deleteClient,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Cliente eliminado')
    },
  })

  const columns = useMemo<Array<ColumnDef<Client>>>(() => [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => (
        <span style={{ fontWeight: 500, color: 'var(--app-heading)' }}>{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Correo',
      cell: ({ row }) => row.original.email ?? <span style={{ color: 'var(--app-muted)' }}>—</span>,
    },
    {
      accessorKey: 'phone',
      header: 'Teléfono',
      cell: ({ row }) => row.original.phone ?? <span style={{ color: 'var(--app-muted)' }}>—</span>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Alta',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('es-MX'),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="row-actions">
          <button
            type="button"
            className="icon-btn tone-accent"
            title="Editar cliente"
            aria-label="Editar cliente"
            onClick={() => setEditing(row.original)}
          >
            {NavIcon.edit}
          </button>
          <button
            type="button"
            className="icon-btn tone-danger"
            title="Eliminar cliente"
            aria-label="Eliminar cliente"
            onClick={() => setDeleting(row.original)}
          >
            {NavIcon.trash}
          </button>
        </div>
      ),
    },
  ], [])

  return (
    <AppShell active="ppl" here="Clientes" crumbPath={['Operación', 'Clientes']}>
      <div className="page-head">
        <div>
          <h1>Clientes</h1>
          <div className="subtitle">Tu cartera. Crea, edita y mantiene su info al día.</div>
        </div>
        <div className="page-head-actions">
          <button className="btn-grad" onClick={() => setCreateOpen(true)}>
            {NavIcon.plus} Nuevo cliente
          </button>
        </div>
      </div>

      <div className="table-toolbar">
        <input
          className="input-sm"
          type="search"
          placeholder="Buscar por nombre, correo o teléfono…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--app-muted)' }}>
          {clientsQuery.data?.length ?? 0} clientes
        </span>
      </div>

      <DataTable
        data={clientsQuery.data ?? []}
        columns={columns}
        globalFilter={search}
        isLoading={clientsQuery.isPending}
        emptyState={
          <EmptyState
            title="Aún no hay clientes"
            description="Crea el primero para empezar a agendar citas."
            icon={NavIcon.ppl}
            action={
              <button className="btn-grad" onClick={() => setCreateOpen(true)}>
                {NavIcon.plus} Nuevo cliente
              </button>
            }
          />
        }
      />

      <Modal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Nuevo cliente"
        subtitle="Agrega una persona a tu cartera"
      >
        <ClientForm
          submitLabel="Crear cliente"
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
        title="Editar cliente"
      >
        {editing && (
          <ClientForm
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
        title="Eliminar cliente"
        description={
          deleting
            ? `¿Eliminar a ${deleting.name}? Sus citas previas se conservan, pero ya no podrás asociarle nuevas.`
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
