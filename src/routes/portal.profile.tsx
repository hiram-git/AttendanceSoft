import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { PortalShell } from '../components/PortalShell.tsx'
import { authClient, useSession } from '../lib/auth-client.ts'
import { api } from '../lib/api.ts'

export const Route = createFileRoute('/portal/profile')({ component: PortalProfilePage })

const nameSchema = z.object({ name: z.string().min(2, 'Mínimo 2 caracteres') })

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Requerida'),
    newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
    confirm: z.string().min(8, 'Mínimo 8 caracteres'),
  })
  .refine((d) => d.newPassword === d.confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm'],
  })

type Banner = { kind: 'success' | 'error'; message: string }

function BannerBox({ b }: { b: Banner }) {
  const isError = b.kind === 'error'
  return (
    <div
      role={isError ? 'alert' : 'status'}
      style={{
        fontSize: 13,
        color: isError ? 'var(--danger)' : 'var(--success)',
        background: isError ? 'var(--danger-bg)' : 'var(--success-bg)',
        border: `1px solid color-mix(in oklab, var(--${isError ? 'danger' : 'success'}) 30%, transparent)`,
        padding: '8px 12px',
        borderRadius: 'var(--radius-2)',
      }}
    >
      {b.message}
    </div>
  )
}

function NameForm({ initialName }: { initialName: string }) {
  const [banner, setBanner] = useState<Banner | null>(null)
  const form = useForm({
    defaultValues: { name: initialName },
    validators: { onSubmit: nameSchema },
    onSubmit: async ({ value }) => {
      setBanner(null)
      const res = await authClient.updateUser({ name: value.name })
      if (res.error) {
        setBanner({ kind: 'error', message: res.error.message ?? 'No pudimos actualizar' })
        return
      }
      setBanner({ kind: 'success', message: 'Nombre actualizado' })
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <form.Field name="name">
        {(field) => (
          <div className="field">
            <label className="field-label" htmlFor={field.name}>Nombre</label>
            <input
              id={field.name}
              className="input focus-ring"
              type="text"
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
      {banner && <BannerBox b={banner} />}
      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(s) => (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-grad" disabled={s}>
              {s ? 'Guardando…' : 'Actualizar nombre'}
            </button>
          </div>
        )}
      </form.Subscribe>
    </form>
  )
}

function PasswordForm() {
  const [banner, setBanner] = useState<Banner | null>(null)
  const form = useForm({
    defaultValues: { currentPassword: '', newPassword: '', confirm: '' },
    validators: { onSubmit: passwordSchema },
    onSubmit: async ({ value }) => {
      setBanner(null)
      const res = await authClient.changePassword({
        currentPassword: value.currentPassword,
        newPassword: value.newPassword,
        revokeOtherSessions: true,
      })
      if (res.error) {
        setBanner({ kind: 'error', message: res.error.message ?? 'No pudimos cambiar la contraseña' })
        return
      }
      setBanner({ kind: 'success', message: 'Contraseña actualizada' })
      form.reset()
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <form.Field name="currentPassword">
        {(field) => (
          <div className="field">
            <label className="field-label" htmlFor={field.name}>Contraseña actual</label>
            <input
              id={field.name}
              className="input focus-ring"
              type="password"
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
        <form.Field name="newPassword">
          {(field) => (
            <div className="field">
              <label className="field-label" htmlFor={field.name}>Nueva contraseña</label>
              <input
                id={field.name}
                className="input focus-ring"
                type="password"
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
        <form.Field name="confirm">
          {(field) => (
            <div className="field">
              <label className="field-label" htmlFor={field.name}>Confirmar</label>
              <input
                id={field.name}
                className="input focus-ring"
                type="password"
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

      {banner && <BannerBox b={banner} />}

      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(s) => (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-grad" disabled={s}>
              {s ? 'Cambiando…' : 'Cambiar contraseña'}
            </button>
          </div>
        )}
      </form.Subscribe>
    </form>
  )
}

function PortalProfilePage() {
  const { data: session } = useSession()
  const meQ = useQuery({ queryKey: ['portal', 'me'], queryFn: () => api.portalMe() })
  const client = meQ.data?.client ?? null

  return (
    <PortalShell active="profile">
      <section className="portal-hero">
        <h1>Tu perfil</h1>
        <p>Datos de la cuenta y preferencias de seguridad.</p>
      </section>

      {!session ? (
        <div className="portal-empty">Cargando…</div>
      ) : (
        <div style={{ display: 'grid', gap: 18, gridTemplateColumns: '1fr 1fr' }}>
          <div className="card">
            <div className="card-head">
              <h3>Identidad</h3>
              <span className="sub">{session.user.email}</span>
            </div>
            <div style={{ padding: 18 }}>
              <NameForm initialName={session.user.name} />
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Seguridad</h3>
              <span className="sub">Cambia tu contraseña</span>
            </div>
            <div style={{ padding: 18 }}>
              <PasswordForm />
            </div>
          </div>

          {client && (
            <div className="card" style={{ gridColumn: 'span 2' }}>
              <div className="card-head">
                <h3>Tu ficha</h3>
                <span className="sub">Visible solo para el equipo</span>
              </div>
              <div style={{ padding: 18, display: 'grid', gap: 10, fontSize: 14, color: 'var(--app-body)' }}>
                <div><strong style={{ color: 'var(--app-heading)' }}>Nombre:</strong> {client.name}</div>
                {client.email && (
                  <div><strong style={{ color: 'var(--app-heading)' }}>Correo:</strong> {client.email}</div>
                )}
                {client.phone && (
                  <div><strong style={{ color: 'var(--app-heading)' }}>Teléfono:</strong> {client.phone}</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </PortalShell>
  )
}
