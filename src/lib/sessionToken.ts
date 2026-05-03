// Session token storage. The mobile bundle stores it in Capacitor
// Preferences (Keychain on iOS, EncryptedSharedPreferences on Android),
// the web bundle falls back to localStorage. Both are wrapped behind a
// **synchronous** getter because Better-Auth's `auth.token` callback
// must return a string (no Promise allowed). The trick:
//
//   1. `loadSessionToken()` is called once at app startup, before the
//      router renders. It awaits the async storage read and primes
//      an in-memory cache.
//   2. `getSessionToken()` is sync and just returns that cache.
//   3. `setSessionToken()` updates the cache immediately (sync) AND
//      fires off the storage write in the background.
//
// On first cold start there's no token yet, so the cache is null —
// no Authorization header gets attached, RequireAuth bounces to /login,
// the user signs in, the token lands in the cache + storage.

const KEY = 'attsoft.session_token'

// Sync prime from localStorage at module import. On the web bundle
// this is the only path. On the mobile bundle localStorage is empty
// (the token lives in Preferences) and `loadSessionToken()` will
// overwrite the cache from there during boot.
let cached: string | null =
  typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null

interface PreferencesPlugin {
  get: (opts: { key: string }) => Promise<{ value: string | null }>
  set: (opts: { key: string; value: string }) => Promise<void>
  remove: (opts: { key: string }) => Promise<void>
}

let prefsPromise: Promise<PreferencesPlugin | null> | null = null

function loadPreferences(): Promise<PreferencesPlugin | null> {
  if (prefsPromise) return prefsPromise
  prefsPromise = (async () => {
    if (typeof window === 'undefined') return null
    try {
      const mod = await import('@capacitor/preferences')
      return mod.Preferences
    } catch {
      return null
    }
  })()
  return prefsPromise
}

/** Read the persisted token into the in-memory cache. Call once at boot. */
export async function loadSessionToken(): Promise<void> {
  if (typeof window === 'undefined') return
  const prefs = await loadPreferences()
  if (prefs) {
    const { value } = await prefs.get({ key: KEY })
    cached = value
    return
  }
  cached = localStorage.getItem(KEY)
}

export function getSessionToken(): string | null {
  return cached
}

export function setSessionToken(token: string | null | undefined) {
  const next = token || null
  cached = next
  if (typeof window === 'undefined') return
  // Fire-and-forget — the cache is what callers read synchronously,
  // the async write is for persistence across app restarts.
  void (async () => {
    const prefs = await loadPreferences()
    if (prefs) {
      if (next) await prefs.set({ key: KEY, value: next })
      else await prefs.remove({ key: KEY })
      return
    }
    if (next) localStorage.setItem(KEY, next)
    else localStorage.removeItem(KEY)
  })()
}

export function clearSessionToken() {
  setSessionToken(null)
}
