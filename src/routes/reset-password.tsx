import { useState } from 'react'
import { Link, createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { useTheme } from '../lib/useTheme.ts'
import { NavIcon } from '../components/icons.tsx'
import { authClient } from '../lib/auth-client.ts'

export const Route = createFileRoute('/reset-password')({
  validateSearch: z.object({ token: z.string().optional() }),
  component: ResetPasswordPage,
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

function ResetPasswordPage() {
  const { appDark, toggleApp } = useTheme()
  const navigate = useNavigate()
  const { token } = useSearch({ from: '/reset-password' })
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const form = useForm({
    defaultValues: { password: '', confirm: '' },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      setError(null)
      if (!token) {
        setError('Enlace inválido. Solicita uno nuevo.')
        return
      }
      const res = await authClient.resetPassword({
        newPassword: value.password,
        token,
      })
      if (res.error) {
        setError(res.error.message ?? 'No pudimos actualizar tu contraseña.')
        return
      }
      setDone(true)
      setTimeout(() => navigate({ to: '/login' }), 1500)
    },
  })

  return (
    <div className="login-shell" data-theme={appDark ? 'dark' : 'light'}>
      <aside className="login-aside">
        <div className="login-brand">Attendance<span className="dot">·</span>Soft</div>
        <div className="login-pitch">
          <h1>Define tu nueva contraseña.</h1>
          <p>
            Una contraseña fuerte protege a tu equipo y a tu agenda. Usamos hashing
            estándar (Better-Auth) — ni siquiera nosotros la vemos.
          </p>
        </div>
        <div className="login-quote">
          “Mejor una contraseña que recuerdes, escrita en un manager, que una que
          adivines.”
          <div className="login-quote-attr">Equipo de seguridad · AttendanceSoft</div>
        </div>
      </aside>

      <main className="login-main">
        <div className="login-topbar">
          <span>¿Lo solucionaste? <Link to="/login">Iniciar sesión</Link></span>
          <button className="theme-pill" onClick={toggleApp}>
            {appDark ? NavIcon.sun : NavIcon.moon}
            {appDark ? 'Oscuro' : 'Claro'}
          </button>
        </div>

        <form
          className="login-card"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <div>
            <h2 className="login-title">Nueva contraseña</h2>
            <p className="login-sub">Mínimo 8 caracteres. Confirma para continuar.</p>
          </div>

          {!token && (
            <div
              role="alert"
              style={{
                fontSize: 13,
                color: 'var(--warning)',
                background: 'rgba(194,134,44,0.12)',
                border: '1px solid rgba(194,134,44,0.3)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-2)',
              }}
            >
              No detectamos un token en el enlace. Si llegaste aquí desde un correo,
              cópialo de nuevo. Si no, <Link to="/forgot-password">solicita uno nuevo</Link>.
            </div>
          )}

          {done ? (
            <div
              role="status"
              style={{
                fontSize: 14,
                color: 'var(--success)',
                background: 'var(--success-bg)',
                border: '1px solid color-mix(in oklab, var(--success) 30%, transparent)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-2)',
              }}
            >
              Listo. Te llevamos al login…
            </div>
          ) : (
            <>
              <form.Field name="password">
                {(field) => (
                  <div className="field">
                    <label className="field-label" htmlFor={field.name}>Nueva contraseña</label>
                    <input
                      id={field.name}
                      name={field.name}
                      className="input focus-ring"
                      type="password"
                      placeholder="••••••••"
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
                    <label className="field-label" htmlFor={field.name}>Confirmar contraseña</label>
                    <input
                      id={field.name}
                      name={field.name}
                      className="input focus-ring"
                      type="password"
                      placeholder="••••••••"
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
                {(isSubmitting) => (
                  <button type="submit" className="btn-primary" disabled={isSubmitting || !token}>
                    {isSubmitting ? 'Guardando…' : 'Guardar contraseña'}
                  </button>
                )}
              </form.Subscribe>
            </>
          )}
        </form>

        <div className="login-footer">
          <div>© 2026 AttendanceSoft</div>
          <div className="login-footer-links">
            <a href="#">Privacidad</a>
            <a href="#">Términos</a>
            <a href="#">Estado</a>
          </div>
          <div>
            <Link to="/" style={{ textDecoration: 'none' }}>← Volver al inicio</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
