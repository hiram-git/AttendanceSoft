import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { useTheme } from '../lib/useTheme.ts'
import { NavIcon } from '../components/icons.tsx'
import { authClient } from '../lib/auth-client.ts'

export const Route = createFileRoute('/forgot-password')({ component: ForgotPasswordPage })

const schema = z.object({
  email: z.string().email('Correo inválido'),
})

function ForgotPasswordPage() {
  const { appDark, toggleApp } = useTheme()
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const form = useForm({
    defaultValues: { email: '' },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      setError(null)
      const res = await authClient.requestPasswordReset({
        email: value.email,
        redirectTo: '/reset-password',
      })
      if (res.error) {
        setError(res.error.message ?? 'No pudimos enviar el correo.')
        return
      }
      setSent(true)
    },
  })

  return (
    <div className="login-shell" data-theme={appDark ? 'dark' : 'light'}>
      <aside className="login-aside">
        <div className="login-brand">Attendance<span className="dot">·</span>Soft</div>
        <div className="login-pitch">
          <h1>Te ayudamos a volver.</h1>
          <p>
            Ingresa tu correo y te enviaremos un enlace para crear una nueva
            contraseña. El vínculo expira en 1 hora.
          </p>
        </div>
        <div className="login-quote">
          “Una buena agenda no debería pedirte que recuerdes contraseñas viejas.”
          <div className="login-quote-attr">Equipo de producto · AttendanceSoft</div>
        </div>
      </aside>

      <main className="login-main">
        <div className="login-topbar">
          <span>¿Ya recordaste? <Link to="/login">Iniciar sesión</Link></span>
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
            <h2 className="login-title">Recuperar contraseña</h2>
            <p className="login-sub">
              Te enviaremos un enlace seguro al correo asociado a tu cuenta.
            </p>
          </div>

          {sent ? (
            <div
              role="status"
              style={{
                fontSize: 14,
                color: 'var(--success)',
                background: 'var(--success-bg)',
                border: '1px solid color-mix(in oklab, var(--success) 30%, transparent)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-2)',
                lineHeight: 1.5,
              }}
            >
              Si la cuenta existe, te enviamos un enlace de recuperación. Revisa tu
              bandeja de entrada (y la consola del API server en modo desarrollo).
            </div>
          ) : (
            <>
              <form.Field name="email">
                {(field) => (
                  <div className="field">
                    <label className="field-label" htmlFor={field.name}>
                      Correo electrónico
                    </label>
                    <input
                      id={field.name}
                      name={field.name}
                      className="input focus-ring"
                      type="email"
                      placeholder="tu@empresa.com"
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
                  <button type="submit" className="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Enviando…' : 'Enviar enlace'}
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
