import { useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { AppShell } from '../components/AppShell.tsx'
import { EmptyState } from '../components/EmptyState.tsx'
import { NavIcon } from '../components/icons.tsx'
import { api } from '../lib/api.ts'

export const Route = createFileRoute('/backoffice/reports')({ component: ReportsPage })

const MONTH_FROM = '2026-05-01'
const MONTH_TO = '2026-05-31'

function ReportsPage() {
  const apptsQuery = useQuery({
    queryKey: ['appointments', 'range', MONTH_FROM, MONTH_TO],
    queryFn: () => api.appointments({ from: MONTH_FROM, to: MONTH_TO }),
  })
  const staffQuery = useQuery({ queryKey: ['staff'], queryFn: () => api.staff() })

  const data = apptsQuery.data ?? []

  const summary = useMemo(() => {
    const byKind = { consulta: 0, seguimiento: 0, procedimiento: 0, bloqueo: 0 }
    const byStatus = { confirmada: 0, pendiente: 0, cancelada: 0 }
    for (const a of data) {
      byKind[a.kind] = byKind[a.kind] + 1
      byStatus[a.status] = byStatus[a.status] + 1
    }
    return { total: data.length, byKind, byStatus }
  }, [data])

  const byStaff = useMemo(() => {
    const counts = new Map<string, number>()
    for (const a of data) {
      if (!a.staffId) continue
      counts.set(a.staffId, (counts.get(a.staffId) ?? 0) + 1)
    }
    const rows = (staffQuery.data ?? [])
      .map((s) => ({ staff: s, count: counts.get(s.id) ?? 0 }))
      .sort((a, b) => b.count - a.count)
    const max = Math.max(1, ...rows.map((r) => r.count))
    return { rows, max }
  }, [data, staffQuery.data])

  if (apptsQuery.isPending || staffQuery.isPending) {
    return (
      <AppShell active="rep" here="Reportes" crumbPath={['Backoffice', 'Reportes']}>
        <div className="page-head">
          <div>
            <h1>Reportes</h1>
            <div className="subtitle">Cargando datos del mes…</div>
          </div>
        </div>
      </AppShell>
    )
  }

  if (data.length === 0) {
    return (
      <AppShell active="rep" here="Reportes" crumbPath={['Backoffice', 'Reportes']}>
        <div className="page-head">
          <div>
            <h1>Reportes</h1>
            <div className="subtitle">Resumen del mes en curso · Mayo 2026.</div>
          </div>
        </div>
        <div className="card">
          <EmptyState
            title="Aún no hay datos para reportar"
            description="Cuando se agenden citas en el rango seleccionado, aquí verás el desglose por tipo, estado y persona."
            icon={NavIcon.rep}
          />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell active="rep" here="Reportes" crumbPath={['Backoffice', 'Reportes']}>
      <div className="page-head">
        <div>
          <h1>Reportes</h1>
          <div className="subtitle">Resumen del mes en curso · Mayo 2026.</div>
        </div>
      </div>

      <div className="metrics" style={{ marginBottom: 18 }}>
        <div className="metric">
          <div className="lbl">Total del mes</div>
          <div className="val">{summary.total}</div>
          <div className="delta">citas registradas</div>
        </div>
        <div className="metric">
          <div className="lbl">Confirmadas</div>
          <div className="val">{summary.byStatus.confirmada}</div>
          <div className="delta up">
            {Math.round((summary.byStatus.confirmada / summary.total) * 100)}% del total
          </div>
        </div>
        <div className="metric">
          <div className="lbl">Pendientes</div>
          <div className="val">{summary.byStatus.pendiente}</div>
          <div className="delta">esperando confirmación</div>
        </div>
        <div className="metric">
          <div className="lbl">Canceladas</div>
          <div className="val">{summary.byStatus.cancelada}</div>
          <div className="delta dn">
            {summary.total > 0
              ? `${Math.round((summary.byStatus.cancelada / summary.total) * 100)}% del total`
              : '—'}
          </div>
        </div>
      </div>

      <div className="dash-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 1fr' }}>
        <div className="card">
          <div className="card-head">
            <h3>Citas por tipo</h3>
            <span className="sub">Mayo 2026</span>
          </div>
          <div style={{ padding: '4px 18px 14px' }}>
            {(['consulta', 'seguimiento', 'procedimiento', 'bloqueo'] as const).map((k) => {
              const value = summary.byKind[k]
              const pct = summary.total > 0 ? Math.round((value / summary.total) * 100) : 0
              return (
                <div key={k} className="staff-stat-row">
                  <span
                    style={{
                      width: 8, height: 8, borderRadius: 2, flex: '0 0 auto',
                      background:
                        k === 'consulta' ? 'var(--accent)'
                        : k === 'seguimiento' ? '#10a76b'
                        : k === 'procedimiento' ? '#c2862c'
                        : '#e0455a',
                    }}
                  />
                  <span className="nm" style={{ textTransform: 'capitalize' }}>{k}</span>
                  <span className="bar"><i style={{ width: `${pct}%` }} /></span>
                  <span className="pc">{value}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Carga por persona</h3>
            <span className="sub">{byStaff.rows.length} personas</span>
          </div>
          <div style={{ padding: '4px 18px 14px' }}>
            {byStaff.rows.map(({ staff, count }) => {
              const pct = Math.round((count / byStaff.max) * 100)
              return (
                <div key={staff.id} className="staff-stat-row">
                  <span
                    className="av"
                    style={{ background: staff.avatarGradient, width: 28, height: 28, fontSize: 11 }}
                  >
                    {staff.initials}
                  </span>
                  <span className="nm">{staff.name}</span>
                  <span className="bar"><i style={{ width: `${pct}%` }} /></span>
                  <span className="pc">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
