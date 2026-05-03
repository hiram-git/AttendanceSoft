import { useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { useTheme } from '../lib/useTheme.ts'
import { NavIcon } from '../components/icons.tsx'
import { api, ApiError } from '../lib/api.ts'
import { setSessionToken } from '../lib/sessionToken.ts'

export const Route = createFileRoute('/portal/invite/$token')({
  component: PortalInvitePage,
})

const schema = z
  .object({
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirm: z.string().min(8, 'Mínimo 8 caracteres'),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm'],
  })

function PortalInvitePage() {
  const { token } = Route.useParams()
  const { appDark, toggleApp } = useTheme()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const invQ = useQuery({
    queryKey: ['invitation', token],
    queryFn: () => api.getInvitation(token),
    retry: false,
  })

  const form = useForm({
    defaultValues: { password: '', confirm: '' },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        const res = await api.acceptInvite({ token, password: value.password })
        setSessionToken(res.token)
        navigate({ to: '/portal' })
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'No pudimos activar la cuenta')
      }
    },
  })

  return (
    <div className="login-shell" data-theme={appDark ? 'dark' : 'light'}>
      <aside className="login-aside">
        <div className="login-brand">Attendance<span className="dot">·</span>Soft</div>
        <div className="login-pitch">
          <h1>Tu cuenta te espera.</h1>
          <p>
            Define una contraseña para activar tu acceso al portal. Después
            podrás reservar y consultar tus citas en cualquier momento.
          </p>
        </div>
        <div className="login-quote">
          “La invitación es un saludo: la cuenta es tuya. Manténla simple.”
          <div className="login-quote-attr">Equipo de producto · AttendanceSoft</div>
        </div>
      </aside>

      <main className="login-main">
        <div className="login-topbar">
          <span>¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link></span>
          <button className="theme-pill" onClick={toggleApp}>
            {appDark ? NavIcon.sun : NavIcon.moon}
            {appDark ? 'Oscuro' : 'Claro'}
          </button>
        </div>

        <div className="login-card">
          {invQ.isPending ? (
            <p style={{ color: 'var(--app-muted)', fontSize: 14 }}>Validando invitación…</p>
          ) : invQ.isError ? (
            <>
              <div>
                <h2 className="login-title">Invitación inválida</h2>
                <p className="login-sub">
                  No encontramos ninguna invitación con este token. Pídele al
                  equipo que te genere una nueva.
                </p>
              </div>
              <Link to="/login" className="btn-soft" style={{ alignSelf: 'flex-start' }}>
                Ir al login
              </Link>
            </>
          ) : invQ.data.state !== 'pending' ? (
            <>
              <div>
                <h2 className="login-title">
                  {invQ.data.state === 'used' ? 'Invitación ya usada' : 'Invitación expirada'}
                </h2>
                <p className="login-sub">
                  {invQ.data.state === 'used'
                    ? 'Esta invitación ya activó una cuenta. Si eres tú, inicia sesión normalmente.'
                    : 'Este enlace ya expiró. Pídele al equipo que te genere uno nuevo.'}
                </p>
              </div>
              <Link to="/login" className="btn-grad" style={{ alignSelf: 'flex-start' }}>
                Ir al login
              </Link>
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                form.handleSubmit()
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 22 }}
            >
              <div>
                <h2 className="login-title">Activa tu cuenta</h2>
                <p className="login-sub">
                  Hola{' '}
                  <strong style={{ color: 'var(--app-heading)' }}>
                    {invQ.data.client.name}
                  </strong>
                  . Define una contraseña para entrar al portal.
                </p>
              </div>

              <div className="field">
                <label className="field-label">Correo registrado</label>
                <input
                  className="input"
                  type="email"
                  readOnly
                  value={invQ.data.client.email ?? ''}
                  style={{ color: 'var(--app-muted)' }}
                />
              </div>

              <form.Field name="password">
                {(field) => (
                  <div className="field">
                    <label className="field-label" htmlFor={field.name}>Nueva contraseña</label>
                    <input
                      id={field.name}
                      className="input focus-ring"
                      type="password"
                      placeholder="Mínimo 8 caracteres"
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
                      placeholder="Repite la contraseña"
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

              <form.Subscribe selector={(s) => s.isSubmitting}>
                {(s) => (
                  <button type="submit" className="btn-primary" disabled={s}>
                    {s ? 'Activando…' : 'Activar cuenta y entrar'}
                  </button>
                )}
              </form.Subscribe>
            </form>
          )}
        </div>

        <div className="login-footer">
          <div>© 2026 AttendanceSoft</div>
          <div>
            <Link to="/" style={{ textDecoration: 'none' }}>← Volver al inicio</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
