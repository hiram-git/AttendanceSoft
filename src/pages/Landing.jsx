import { Link } from 'react-router-dom'
import { useTheme } from '../useTheme.js'

function LandingNav({ light, onToggleTheme }) {
  return (
    <nav className="land-nav">
      <div className="land-brand">Attendance<span className="dot">·</span>Soft</div>
      <div className="land-navlinks">
        <a href="#producto">Producto</a>
        <a href="#clientes">Clientes</a>
        <a href="#precios">Precios</a>
        <a href="#empresa">Empresa</a>
      </div>
      <div className="land-navactions">
        <button className="land-theme focus-ring" onClick={onToggleTheme} aria-label="Cambiar tema">
          {light ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
          )}
        </button>
        <Link className="btn-min ghost" to="/login">Iniciar sesión</Link>
        <a className="btn-min" href="#trial">Probar gratis</a>
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <section className="land-hero">
      <div className="land-hero-frame placeholder-img">
        <span className="ph-label" style={{ position: 'absolute', top: 16, left: 20, fontSize: 10 }}>
          HERO · CINEMATIC IMAGERY · 1920×1080
        </span>
        <div className="land-hero-content">
          <div className="land-hero-tagline">SISTEMA DE AGENDAMIENTO · 2026</div>
          <div>
            <div className="land-hero-title-row">
              <h1 className="land-hero-title">
                Cada cita,<br /><em>en su lugar.</em>
              </h1>
              <div className="land-hero-meta">
                <div>VERSIÓN 4.2</div>
                <div>312 EQUIPOS ACTIVOS</div>
                <div>UPTIME 99.99%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="land-hero-actions">
        <a className="btn-min large" href="#demo">Solicitar demo</a>
        <a className="btn-min ghost large" href="#tour">Ver el producto</a>
      </div>
    </section>
  )
}

function Pillars() {
  const items = [
    {
      n: '01',
      title: 'Agenda inteligente',
      body: 'Reglas de disponibilidad por equipo, recurso o sala. Sin conflictos, sin huecos.',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <rect x="3" y="5" width="18" height="16" rx="1.5" />
          <path d="M3 9h18M8 3v4M16 3v4" />
        </svg>
      ),
    },
    {
      n: '02',
      title: 'Reserva en un toque',
      body: 'Páginas públicas para que el cliente confirme su cita en menos de 30 segundos.',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      ),
    },
    {
      n: '03',
      title: 'Operación en vivo',
      body: 'Tablero, métricas y avisos en tiempo real. La operación que el equipo necesita.',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M3 13l4-4 4 4 4-7 6 10" />
        </svg>
      ),
    },
  ]
  return (
    <section className="land-section" id="producto">
      <div className="land-section-head">
        <div className="land-eyebrow">— Plataforma</div>
        <h2 className="land-h2">
          Una sola plataforma para <em>agendar, atender y entender</em> tu operación.
        </h2>
      </div>
      <div className="land-pillars">
        {items.map((it) => (
          <div className="land-pillar" key={it.n}>
            <div className="land-pillar-num">{it.n}</div>
            <div className="land-pillar-icon">{it.icon}</div>
            <h3 className="land-pillar-title">{it.title}</h3>
            <p className="land-pillar-body">{it.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Showcase() {
  return (
    <section className="land-section">
      <div className="land-section-head">
        <div className="land-eyebrow">— Producto</div>
        <h2 className="land-h2">
          Diseñado para los <em>equipos que viven en la agenda.</em>
        </h2>
      </div>
      <div className="land-showcase">
        <div className="placeholder-img">
          <span className="ph-label">CAPTURA · DASHBOARD · 1280×960</span>
        </div>
        <div className="placeholder-img tall">
          <span className="ph-label">CAPTURA · MOBILE · 720×960</span>
        </div>
      </div>
    </section>
  )
}

function Stats() {
  const stats = [
    { num: '32', sup: '%', label: 'Menos ausencias' },
    { num: '4.9', sup: '★', label: 'Satisfacción promedio' },
    { num: '11', sup: 'min', label: 'Ahorro por reserva' },
    { num: '99.99', sup: '%', label: 'Disponibilidad' },
  ]
  return (
    <section className="land-stats">
      {stats.map((s) => (
        <div className="land-stat" key={s.label}>
          <div className="land-stat-num">
            {s.num}
            <sup>{s.sup}</sup>
          </div>
          <div className="land-stat-label">{s.label}</div>
        </div>
      ))}
    </section>
  )
}

function Quote() {
  return (
    <section className="land-quote">
      <div className="land-eyebrow">— Lo que dicen</div>
      <div>
        <p className="land-quote-text">
          “Reemplazamos tres herramientas con AttendanceSoft. <em>El silencio operativo es lo mejor que nos pasó.</em>”
        </p>
        <div className="land-quote-attr">
          Camila R. · Directora de Operaciones · Clínica Vértice
        </div>
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section className="land-cta">
      <h3>Tu agenda, sin ruido.</h3>
      <div className="land-hero-actions">
        <a className="btn-min large" href="#demo">Solicitar demo</a>
        <a className="btn-min ghost large" href="#trial">Probar 14 días</a>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="land-footer">
      <div>© 2026 ATTENDANCESOFT · CDMX</div>
      <div className="land-footer-links">
        <a href="#">Privacidad</a>
        <a href="#">Términos</a>
        <a href="#">Estado</a>
        <a href="#">Soporte</a>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  const { landingDark, toggleLanding } = useTheme()
  const light = !landingDark
  return (
    <div className={`land${light ? ' light' : ''}`}>
      <LandingNav light={light} onToggleTheme={toggleLanding} />
      <Hero />
      <Pillars />
      <Showcase />
      <Stats />
      <Quote />
      <CTA />
      <Footer />
    </div>
  )
}
