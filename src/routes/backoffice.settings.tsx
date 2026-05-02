import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '../components/AppShell.tsx'
import { EmptyState } from '../components/EmptyState.tsx'
import { NavIcon } from '../components/icons.tsx'

export const Route = createFileRoute('/backoffice/settings')({ component: SettingsPage })

function SettingsPage() {
  return (
    <AppShell active="set" here="Ajustes" crumbPath={['Backoffice', 'Ajustes']}>
      <div className="page-head">
        <div>
          <h1>Ajustes</h1>
          <div className="subtitle">Reglas de operación, permisos y preferencias.</div>
        </div>
      </div>

      <div className="card">
        <EmptyState
          title="Pendiente de implementar"
          description="Esta sección agrupará reglas de disponibilidad, permisos por rol y preferencias generales. Por ahora se queda como placeholder mientras priorizamos los CRUDs operativos."
          icon={NavIcon.set}
        />
      </div>
    </AppShell>
  )
}
