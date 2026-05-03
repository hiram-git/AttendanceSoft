import { createAuthClient } from 'better-auth/react'
import { getSessionToken } from './sessionToken.ts'

export const authClient = createAuthClient({
  baseURL:
    import.meta.env.PUBLIC_API_URL ??
    import.meta.env.VITE_API_URL ??
    'http://localhost:3001',
  basePath: '/api/auth',
  fetchOptions: {
    credentials: 'include',
    // When a session token is stored locally (Capacitor webview), send
    // it as a Bearer header. The Better-Auth bearer plugin validates
    // it server-side. On the web bundle localStorage stays empty and
    // the cookie does the work.
    auth: {
      type: 'Bearer',
      token: () => getSessionToken() ?? '',
    },
  },
})

export const { signIn, signUp, signOut, useSession, getSession } = authClient
