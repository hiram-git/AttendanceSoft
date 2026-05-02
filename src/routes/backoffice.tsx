import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/backoffice')({
  component: BackofficeLayout,
})

function BackofficeLayout() {
  return <Outlet />
}
