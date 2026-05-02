import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar.tsx'
import { Topbar } from './Topbar.tsx'
import { RequireAuth } from './RequireAuth.tsx'
import { useTheme } from '../lib/useTheme.ts'

interface Props {
  active?: string
  here?: string
  crumbPath?: ReadonlyArray<string>
  onNewAppointment?: () => void
  children: ReactNode
}

export function AppShell({
  active,
  here,
  crumbPath,
  onNewAppointment,
  children,
}: Props) {
  const { appDark } = useTheme()
  return (
    <RequireAuth requiredRole="staff">
      <div
        className="app-shell"
        data-theme={appDark ? 'dark' : 'light'}
        data-sidebar="labeled"
      >
        <Sidebar active={active} />
        <div className="main">
          <Topbar
            here={here}
            crumbPath={crumbPath}
            onNewAppointment={onNewAppointment}
          />
          <div className="content app-scroll">{children}</div>
        </div>
      </div>
    </RequireAuth>
  )
}
