// Lightweight wrapper around the auth token storage used by the
// mobile bundle. The web bundle works with cookies — this helper is a
// no-op there because localStorage stays empty (sign-in never writes
// to it on web).
//
// On Capacitor's webview localStorage is persisted in the app sandbox,
// which is enough for now. 6.3 will swap this out for the
// Preferences plugin so the token lands in Keychain (iOS) / Keystore
// (Android) instead of plain localStorage.

const KEY = 'attsoft.session_token'

export function getSessionToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(KEY)
}

export function setSessionToken(token: string | null | undefined) {
  if (typeof localStorage === 'undefined') return
  if (!token) {
    localStorage.removeItem(KEY)
    return
  }
  localStorage.setItem(KEY, token)
}

export function clearSessionToken() {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(KEY)
}
