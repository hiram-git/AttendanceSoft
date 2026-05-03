import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '../../src/lib/ThemeProvider'
import { ToastProvider } from '../../src/lib/ToastProvider'
import { loadSessionToken } from '../../src/lib/sessionToken'
import { api } from '../../src/lib/api'
import {
  applyStatusBarTheme,
  hideSplash,
  isNative,
  registerDeepLinks,
  registerDeviceForPush,
  scheduleAppointmentReminder,
} from './lib/native'
import { routeTree } from './routeTree.gen'
import './styles.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Expose mobile-only side effects to shared route files via a window
// hook. The web bundle never sets this, so the call sites are no-ops
// there.
window.__attsoft_schedule_reminder = scheduleAppointmentReminder

async function bootstrap() {
  // Read the persisted bearer token (Keychain/Keystore on native,
  // localStorage fallback on web preview) into the in-memory cache so
  // the very first network call carries the Authorization header.
  await loadSessionToken()

  const rootEl = document.getElementById('root')
  if (!rootEl) throw new Error('No #root in index.html')

  createRoot(rootEl).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>,
  )

  // Best-effort native side effects after first paint. None of these
  // block the app boot — the user can interact while they finish.
  if (isNative()) {
    void hideSplash()
    void applyStatusBarTheme(false) // light theme by default
    void registerDeepLinks((path) => {
      router.navigate({ to: path })
    })
    setTimeout(() => {
      void registerDeviceForPush(api.portalRegisterDevice)
    }, 0)
  }
}

void bootstrap()
