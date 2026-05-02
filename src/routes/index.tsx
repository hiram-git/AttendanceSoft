import { Link, createFileRoute } from '@tanstack/react-router'
import { useTheme } from '../lib/useTheme.ts'

export const Route = createFileRoute('/')({ component: LandingPage })

function LandingNav({ light, onToggleTheme }: { light: boolean; onToggleTheme: () => void }) {
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
      n: '01', title: 'Agenda inteligente',
      body: 'Reglas de disponibilidad por equipo, recurso o sala. Sin conflictos, sin huecos.',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="5" width="18" height="16" rx="1.5" /><path d="M3 9h18M8 3v4M16 3v4" /></svg>,
    },
    {
      n: '02', title: 'Reserva en un toque',
      body: 'Páginas públicas para que el cliente confirme su cita en menos de 30 segundos.',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
    },
    {
      n: '03', title: 'Operación en vivo',
      body: 'Tablero, métricas y avisos en tiempo real. La operación que el equipo necesita.',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 13l4-4 4 4 4-7 6 10" /></svg>,
    },
  ]
  return (
    <section className="land-section" id="producto">
      <div className="land-section-head">
        <div className="land-eyebrow">— Plataforma</div>
        <h2 className="land-h2">Una sola plataforma para <em>agendar, atender y entender</em> tu operación.</h2>
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
        <h2 className="land-h2">Diseñado para los <em>equipos que viven en la agenda.</em></h2>
      </div>
      <div className="land-showcase">
        <div className="placeholder-img"><span className="ph-label">CAPTURA · DASHBOARD · 1280×960</span></div>
        <div className="placeholder-img tall"><span className="ph-label">CAPTURA · MOBILE · 720×960</span></div>
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
          <div className="land-stat-num">{s.num}<sup>{s.sup}</sup></div>
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
        <div className="land-quote-attr">Camila R. · Directora de Operaciones · Clínica Vértice</div>
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

function Customers() {
  const logos = [
    'CLÍNICA VÉRTICE',
    'STUDIO NORTE',
    'GIMNASIO ARENA',
    'NOTARÍA 14',
    'ESTÉTICA AURA',
    'TALLER NÚCLEO',
    'CONSULTORIO IRIS',
    'ATELIER VOL.',
  ]
  const cases = [
    {
      n: '01',
      tag: 'Clínica',
      title: 'De agendas en papel a tablero único.',
      body: 'Clínica Vértice migró 12 consultorios a una sola operación; redujo 32% las ausencias en el primer mes.',
      meta: '12 CONSULTORIOS · 4,800 CITAS/MES',
    },
    {
      n: '02',
      tag: 'Estudio',
      title: 'Reservas que llegan solas.',
      body: 'Studio Norte abrió un canal público de reservas y movió 71% de las citas a self-service sin sumar personal.',
      meta: '3 SEDES · 2,100 CITAS/MES',
    },
    {
      n: '03',
      tag: 'Servicios',
      title: 'Sin conflictos de sala, nunca más.',
      body: 'Taller Núcleo eliminó las dobles asignaciones de bahías con reglas de disponibilidad por recurso.',
      meta: '6 BAHÍAS · 38 TÉCNICOS',
    },
  ]
  return (
    <section className="land-section" id="clientes">
      <div className="land-section-head">
        <div className="land-eyebrow">— Clientes</div>
        <h2 className="land-h2">
          Equipos de toda forma y tamaño <em>operan en silencio</em> con AttendanceSoft.
        </h2>
      </div>

      <div className="land-logos">
        {logos.map((l) => (
          <div className="land-logo" key={l}>{l}</div>
        ))}
      </div>

      <div className="land-cases">
        {cases.map((c) => (
          <article className="land-case" key={c.n}>
            <div className="land-case-head">
              <span className="land-case-num">{c.n}</span>
              <span className="land-case-tag">{c.tag}</span>
            </div>
            <h3 className="land-case-title">{c.title}</h3>
            <p className="land-case-body">{c.body}</p>
            <div className="land-case-meta">{c.meta}</div>
          </article>
        ))}
      </div>
    </section>
  )
}

function Pricing() {
  const tiers = [
    {
      n: '01',
      name: 'Solo',
      price: '0',
      currency: 'MXN',
      cadence: 'siempre gratis',
      pitch: 'Para una persona. Empieza sin tarjeta.',
      features: [
        'Hasta 50 citas / mes',
        '1 calendario',
        'Página pública de reservas',
        'Recordatorios por correo',
      ],
      cta: 'Empezar gratis',
      ctaHref: '#trial',
    },
    {
      n: '02',
      name: 'Equipo',
      price: '1,290',
      currency: 'MXN',
      cadence: 'por usuario / mes',
      featured: true,
      pitch: 'Para equipos que viven en la agenda.',
      features: [
        'Citas ilimitadas',
        'Calendarios por persona y por sala',
        'Reglas de disponibilidad y conflictos',
        'Reportes y exportación',
        'Soporte prioritario',
      ],
      cta: 'Probar 14 días',
      ctaHref: '#trial',
    },
    {
      n: '03',
      name: 'Empresa',
      price: 'Hablemos',
      currency: '',
      cadence: 'plan a medida',
      pitch: 'Para operaciones grandes con compliance.',
      features: [
        'SSO (SAML / OIDC)',
        'SLA y soporte dedicado',
        'Implementación guiada',
        'Auditoría y residencia de datos',
      ],
      cta: 'Contactar a ventas',
      ctaHref: '#sales',
    },
  ]
  return (
    <section className="land-section" id="precios">
      <div className="land-section-head">
        <div className="land-eyebrow">— Precios</div>
        <h2 className="land-h2">
          Tres planes. <em>Cero sorpresas.</em> Sin tarjeta para empezar.
        </h2>
      </div>

      <div className="land-pricing">
        {tiers.map((t) => (
          <article className={'land-tier' + (t.featured ? ' featured' : '')} key={t.n}>
            <div className="land-tier-head">
              <span className="land-tier-num">{t.n}</span>
              <span className="land-tier-name">{t.name}</span>
            </div>
            <div className="land-tier-price">
              <span className="amount">{t.price}</span>
              {t.currency && <span className="currency">{t.currency}</span>}
            </div>
            <div className="land-tier-cadence">{t.cadence}</div>
            <p className="land-tier-pitch">{t.pitch}</p>
            <ul className="land-tier-features">
              {t.features.map((f) => (
                <li key={f}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <a className={'btn-min ' + (t.featured ? '' : 'ghost')} href={t.ctaHref}>
              {t.cta}
            </a>
          </article>
        ))}
      </div>

      <div className="land-pricing-foot">
        Todos los planes incluyen actualizaciones, exportación de datos y backups diarios.
        Sin costo de implementación.
      </div>
    </section>
  )
}

function Company() {
  const values = [
    {
      n: '01',
      title: 'Sustracción.',
      body: 'Un producto fuerte se reconoce por lo que decide no hacer. Cada feature compite contra el silencio.',
    },
    {
      n: '02',
      title: 'Operación.',
      body: 'Diseñamos para el equipo que vive en la agenda, no para el que la inspecciona dos veces al mes.',
    },
    {
      n: '03',
      title: 'Honestidad.',
      body: 'Un precio claro, un dato exportable, un correo del CEO. Nada que esconder en letra chica.',
    },
  ]
  return (
    <section className="land-section" id="empresa">
      <div className="land-section-head">
        <div className="land-eyebrow">— Empresa</div>
        <h2 className="land-h2">
          Construimos software para que <em>tu día empiece silencioso.</em>
        </h2>
      </div>

      <div className="land-company">
        <div className="land-company-copy">
          <p>
            AttendanceSoft nació en CDMX en 2024, dentro de una clínica que perdía
            tres horas al día sincronizando calendarios. Hoy es la plataforma de
            agendamiento que prefieren equipos pequeños y operaciones grandes que
            buscan claridad antes que ruido.
          </p>
          <p>
            Somos un equipo distribuido de 14 personas. Cobramos por uso real,
            cifrramos los datos en reposo y publicamos cada cambio en un changelog
            abierto. Si el producto no resuelve algo, lo decimos antes de venderlo.
          </p>
        </div>

        <div className="land-company-stats">
          <div>
            <div className="land-company-stat-num">2024</div>
            <div className="land-company-stat-lbl">FUNDADA · CDMX</div>
          </div>
          <div>
            <div className="land-company-stat-num">14</div>
            <div className="land-company-stat-lbl">PERSONAS</div>
          </div>
          <div>
            <div className="land-company-stat-num">312</div>
            <div className="land-company-stat-lbl">EQUIPOS ACTIVOS</div>
          </div>
        </div>
      </div>

      <div className="land-values">
        {values.map((v) => (
          <div className="land-value" key={v.n}>
            <div className="land-value-num">{v.n}</div>
            <h3 className="land-value-title">{v.title}</h3>
            <p className="land-value-body">{v.body}</p>
          </div>
        ))}
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

function LandingPage() {
  const { landingDark, toggleLanding } = useTheme()
  const light = !landingDark
  return (
    <div className={`land${light ? ' light' : ''}`}>
      <LandingNav light={light} onToggleTheme={toggleLanding} />
      <Hero />
      <Pillars />
      <Showcase />
      <Customers />
      <Stats />
      <Quote />
      <Pricing />
      <Company />
      <CTA />
      <Footer />
    </div>
  )
}
