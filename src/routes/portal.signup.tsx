import { useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { useTheme } from '../lib/useTheme.ts'
import { NavIcon } from '../components/icons.tsx'
import { api, ApiError } from '../lib/api.ts'

export const Route = createFileRoute('/portal/signup')({ component: PortalSignupPage })

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Correo inválido'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})

function PortalSignupPage() {
  const { appDark, toggleApp } = useTheme()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { name: '', email: '', phone: '', password: '' },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        await api.portalSignup({
          name: value.name,
          email: value.email,
          password: value.password,
          phone: value.phone || undefined,
        })
        navigate({ to: '/portal' })
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'No pudimos crear tu cuenta')
      }
    },
  })

  return (
    <div className="login-shell" data-theme={appDark ? 'dark' : 'light'}>
      <aside className="login-aside">
        <div className="login-brand">Attendance<span className="dot">·</span>Soft</div>
        <div className="login-pitch">
          <h1>Tu agenda, sin teléfono ni filas.</h1>
          <p>
            Crea tu cuenta en menos de un minuto. Después podrás reservar,
            consultar y cancelar citas desde cualquier dispositivo.
          </p>
        </div>
        <div className="login-quote">
          “La mejor reserva es la que no tienes que recordar — el sistema lo hace por ti.”
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

        <form
          className="login-card"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <div>
            <h2 className="login-title">Crear cuenta</h2>
            <p className="login-sub">Como cliente, podrás reservar y gestionar tus citas en el portal.</p>
          </div>

          <form.Field name="name">
            {(field) => (
              <div className="field">
                <label className="field-label" htmlFor={field.name}>Nombre completo</label>
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

          <form.Field name="email">
            {(field) => (
              <div className="field">
                <label className="field-label" htmlFor={field.name}>Correo electrónico</label>
                <input
                  id={field.name}
                  className="input focus-ring"
                  type="email"
                  placeholder="tu@ejemplo.com"
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
                <label className="field-label" htmlFor={field.name}>Teléfono (opcional)</label>
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

          <form.Field name="password">
            {(field) => (
              <div className="field">
                <label className="field-label" htmlFor={field.name}>Contraseña</label>
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
                {s ? 'Creando cuenta…' : 'Crear cuenta y entrar'}
              </button>
            )}
          </form.Subscribe>
        </form>

        <div className="login-footer">
          <div>© 2026 AttendanceSoft</div>
          <div className="login-footer-links">
            <a href="#">Privacidad</a>
            <a href="#">Términos</a>
          </div>
          <div>
            <Link to="/" style={{ textDecoration: 'none' }}>← Volver al inicio</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
