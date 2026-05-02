import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar.tsx'
import { Topbar } from './Topbar.tsx'
import { useTheme } from '../lib/useTheme.ts'

interface Props {
  active?: string
  here?: string
  crumbPath?: ReadonlyArray<string>
  children: ReactNode
}

export function AppShell({ active, here, crumbPath, children }: Props) {
  const { appDark } = useTheme()
  return (
    <div
      className="app-shell"
      data-theme={appDark ? 'dark' : 'light'}
      data-sidebar="labeled"
    >
      <Sidebar active={active} />
      <div className="main">
        <Topbar here={here} crumbPath={crumbPath} />
        <div className="content app-scroll">{children}</div>
      </div>
    </div>
  )
}
