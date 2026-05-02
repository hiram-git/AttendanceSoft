import { useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { useTheme } from '../lib/useTheme.ts'
import { NavIcon } from '../components/icons.tsx'
import { signIn } from '../lib/auth-client.ts'

export const Route = createFileRoute('/login')({ component: LoginPage })

const credentialsSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  remember: z.boolean(),
})

function LoginPage() {
  const { appDark, toggleApp } = useTheme()
  const navigate = useNavigate()
  const [authError, setAuthError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      email: 'camila@vertice.mx',
      password: 'attendancesoft',
      remember: true,
    },
    validators: { onSubmit: credentialsSchema },
    onSubmit: async ({ value }) => {
      setAuthError(null)
      const res = await signIn.email({
        email: value.email,
        password: value.password,
        rememberMe: value.remember,
      })
      if (res.error) {
        setAuthError(res.error.message ?? 'No pudimos iniciar sesión.')
        return
      }
      await navigate({ to: '/dashboard' })
    },
  })

  return (
    <div className="login-shell" data-theme={appDark ? 'dark' : 'light'}>
      <aside className="login-aside">
        <div className="login-brand">Attendance<span className="dot">·</span>Soft</div>
        <div className="login-pitch">
          <h1>La operación, sin fricción.</h1>
          <p>
            Reservas, recursos y disponibilidad en una sola plataforma. Diseñada para
            equipos que necesitan claridad en cada turno.
          </p>
        </div>
        <div className="login-quote">
          “La diferencia entre una agenda saturada y una agenda controlada se mide en
          minutos al día.”
          <div className="login-quote-attr">Equipo de producto · AttendanceSoft</div>
        </div>
      </aside>

      <main className="login-main">
        <div className="login-topbar">
          <span>¿No tienes cuenta? <a href="#signup">Crear una</a></span>
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
            <h2 className="login-title">Iniciar sesión</h2>
            <p className="login-sub">Bienvenido de vuelta. Continúa donde lo dejaste.</p>
          </div>

          <div className="login-sso">
            <button type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" /></svg>
              Continuar con SSO
            </button>
            <button type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M21.35 11.1H12v3.2h5.35c-.5 2.4-2.55 3.7-5.35 3.7a5.9 5.9 0 0 1 0-11.8c1.4 0 2.7.5 3.7 1.4l2.4-2.4A9.3 9.3 0 0 0 12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4 9.6-9.7 0-.4 0-.8-.25-1.2z" /></svg>
              Continuar con Google
            </button>
          </div>

          <div className="login-divider">o con tu correo</div>

          <form.Field name="email">
            {(field) => (
              <div className="field">
                <label className="field-label" htmlFor={field.name}>Correo electrónico</label>
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

          <form.Field name="password">
            {(field) => (
              <div className="field">
                <label className="field-label" htmlFor={field.name}>
                  Contraseña <a href="#forgot">¿La olvidaste?</a>
                </label>
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

          <form.Field name="remember">
            {(field) => (
              <div className="login-meta">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={field.state.value}
                    onChange={(e) => field.handleChange(e.target.checked)}
                  />
                  <span className="box">{NavIcon.check}</span>
                  Mantener sesión iniciada
                </label>
              </div>
            )}
          </form.Field>

          {authError && (
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
              {authError}
            </div>
          )}

          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Entrando…' : 'Entrar al panel'}
              </button>
            )}
          </form.Subscribe>
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
