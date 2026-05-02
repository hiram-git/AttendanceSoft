import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'
import { useTheme } from '../useTheme.js'

export default function AppShell({ active, here, crumbPath, children }) {
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
