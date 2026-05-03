import { Navigate, createFileRoute } from '@tanstack/react-router'

// The mobile bundle has no landing — opening the app sends the user
// straight to the portal (where RequireAuth bounces to /login if
// they don't have a session yet).
export const Route = createFileRoute('/')({
  component: () => <Navigate to="/portal" replace />,
})
