import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../useTheme.js'
import { NavIcon } from '../components/icons.jsx'

export default function LoginPage() {
  const { appDark, toggleApp } = useTheme()
  const navigate = useNavigate()
  const [email, setEmail] = useState('camila@vertice.mx')
  const [pw, setPw] = useState('passwordfake')
  const [remember, setRemember] = useState(true)

  function handleSubmit(e) {
    e.preventDefault()
    navigate('/dashboard')
  }

  return (
    <div className="login-shell" data-theme={appDark ? 'dark' : 'light'}>
      <aside className="login-aside">
        <div className="login-brand">Attendance<span className="dot">·</span>Soft</div>
        <div className="login-pitch">
          <h1>La operación, sin fricción.</h1>
          <p>
            Reservas, recursos y disponibilidad en una sola plataforma. Diseñada
            para equipos que necesitan claridad en cada turno.
          </p>
        </div>
        <div className="login-quote">
          “La diferencia entre una agenda saturada y una agenda controlada se mide
          en minutos al día.”
          <div className="login-quote-attr">Equipo de producto · AttendanceSoft</div>
        </div>
      </aside>

      <main className="login-main">
        <div className="login-topbar">
          <span>
            ¿No tienes cuenta? <a href="#signup">Crear una</a>
          </span>
          <button className="theme-pill" onClick={toggleApp}>
            {appDark ? NavIcon.sun : NavIcon.moon}
            {appDark ? 'Oscuro' : 'Claro'}
          </button>
        </div>

        <form className="login-card" onSubmit={handleSubmit}>
          <div>
            <h2 className="login-title">Iniciar sesión</h2>
            <p className="login-sub">Bienvenido de vuelta. Continúa donde lo dejaste.</p>
          </div>

          <div className="login-sso">
            <button type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
              </svg>
              Continuar con SSO
            </button>
            <button type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.35 11.1H12v3.2h5.35c-.5 2.4-2.55 3.7-5.35 3.7a5.9 5.9 0 0 1 0-11.8c1.4 0 2.7.5 3.7 1.4l2.4-2.4A9.3 9.3 0 0 0 12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4 9.6-9.7 0-.4 0-.8-.25-1.2z" />
              </svg>
              Continuar con Google
            </button>
          </div>

          <div className="login-divider">o con tu correo</div>

          <div className="field">
            <label className="field-label" htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              className="input focus-ring"
              type="email"
              placeholder="tu@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="pw">
              Contraseña <a href="#forgot">¿La olvidaste?</a>
            </label>
            <input
              id="pw"
              className="input focus-ring"
              type="password"
              placeholder="••••••••"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
          </div>

          <div className="login-meta">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span className="box">{NavIcon.check}</span>
              Mantener sesión iniciada
            </label>
          </div>

          <button type="submit" className="btn-primary">Entrar al panel</button>
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
