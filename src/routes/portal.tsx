import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/portal')({
  component: PortalLayout,
})

function PortalLayout() {
  return <Outlet />
}
