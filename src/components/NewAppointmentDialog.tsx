import { useEffect, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from '../lib/api.ts'
import { NavIcon } from './icons.tsx'
import { Modal } from './Modal.tsx'

const schema = z.object({
  date: z.string().min(1, 'Requerido'),
  startTime: z.string().min(1, 'Requerido'),
  endTime: z.string().min(1, 'Requerido'),
  label: z.string().min(2, 'Mínimo 2 caracteres'),
  kind: z.enum(['consulta', 'seguimiento', 'procedimiento', 'bloqueo']),
  staffId: z.string().optional(),
  serviceId: z.string().optional(),
  clientId: z.string().optional(),
  room: z.string().optional(),
})

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultDate?: string
}

export function NewAppointmentDialog({ open, onOpenChange, defaultDate }: Props) {
  const qc = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const staffQuery = useQuery({
    queryKey: ['staff'],
    queryFn: () => api.staff(),
    enabled: open,
  })
  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: () => api.services(),
    enabled: open,
  })
  const clientsQuery = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.clients(),
    enabled: open,
  })

  const create = useMutation({
    mutationFn: api.createAppointment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
    },
  })

  const form = useForm({
    defaultValues: {
      date: defaultDate ?? '2026-05-02',
      startTime: '09:00',
      endTime: '09:30',
      label: '',
      kind: 'consulta' as const,
      staffId: '',
      serviceId: '',
      clientId: '',
      room: '',
    },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        await create.mutateAsync({
          date: value.date,
          startTime: value.startTime,
          endTime: value.endTime,
          label: value.label,
          kind: value.kind,
          staffId: value.staffId || undefined,
          serviceId: value.serviceId || undefined,
          clientId: value.clientId || undefined,
          room: value.room || undefined,
        })
        onOpenChange(false)
        form.reset()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al crear la cita')
      }
    },
  })

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset()
      setError(null)
    }
  }, [open, form])

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Nueva cita"
      subtitle="Crea una cita en el calendario"
    >
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
                  <label className="field-label" htmlFor={field.name}>Fecha</label>
                  <input
                    id={field.name}
                    className="input focus-ring"
                    type="date"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
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
                    onChange={(e) => field.handleChange(e.target.value as never)}
                  >
                    <option value="consulta">Consulta</option>
                    <option value="seguimiento">Seguimiento</option>
                    <option value="procedimiento">Procedimiento</option>
                    <option value="bloqueo">Bloqueo</option>
                  </select>
                </div>
              )}
            </form.Field>
          </div>

          <div className="modal-grid two">
            <form.Field name="startTime">
              {(field) => (
                <div className="field">
                  <label className="field-label" htmlFor={field.name}>Inicio</label>
                  <input
                    id={field.name}
                    className="input focus-ring"
                    type="time"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="endTime">
              {(field) => (
                <div className="field">
                  <label className="field-label" htmlFor={field.name}>Fin</label>
                  <input
                    id={field.name}
                    className="input focus-ring"
                    type="time"
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
                <label className="field-label" htmlFor={field.name}>Título</label>
                <input
                  id={field.name}
                  className="input focus-ring"
                  type="text"
                  placeholder="Ej. Méndez · Control trimestral"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
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
            <form.Field name="staffId">
              {(field) => (
                <div className="field">
                  <label className="field-label" htmlFor={field.name}>Personal</label>
                  <select
                    id={field.name}
                    className="input focus-ring"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  >
                    <option value="">— Sin asignar —</option>
                    {staffQuery.data?.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} · {s.role}</option>
                    ))}
                  </select>
                </div>
              )}
            </form.Field>

            <form.Field name="serviceId">
              {(field) => (
                <div className="field">
                  <label className="field-label" htmlFor={field.name}>Servicio</label>
                  <select
                    id={field.name}
                    className="input focus-ring"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  >
                    <option value="">— Sin servicio —</option>
                    {servicesQuery.data?.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </form.Field>
          </div>

          <div className="modal-grid two">
            <form.Field name="clientId">
              {(field) => (
                <div className="field">
                  <label className="field-label" htmlFor={field.name}>Cliente</label>
                  <select
                    id={field.name}
                    className="input focus-ring"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  >
                    <option value="">— Sin cliente —</option>
                    {clientsQuery.data?.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </form.Field>

            <form.Field name="room">
              {(field) => (
                <div className="field">
                  <label className="field-label" htmlFor={field.name}>Sala</label>
                  <input
                    id={field.name}
                    className="input focus-ring"
                    type="text"
                    placeholder="Ej. Sala 2"
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
                fontSize: 13,
                color: 'var(--danger)',
                background: 'var(--danger-bg)',
                border: '1px solid color-mix(in oklab, var(--danger) 30%, transparent)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-2)',
              }}
            >
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-soft" onClick={() => onOpenChange(false)}>
              Cancelar
            </button>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <button type="submit" className="btn-grad" disabled={isSubmitting}>
                  {isSubmitting ? 'Creando…' : (
                    <>
                      {NavIcon.plus} Crear cita
                    </>
                  )}
                </button>
              )}
            </form.Subscribe>
          </div>
        </form>
    </Modal>
  )
}
