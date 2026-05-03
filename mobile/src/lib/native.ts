// Capacitor-only side effects: notifications, push registration,
// status bar, etc. Everything is gated by isNative() so the same
// module is harmless if it ever gets imported into the web bundle
// (which it won't — these helpers are only called from
// mobile/src/main.tsx and from helpers in mobile/src/lib/).

import { Capacitor } from '@capacitor/core'

export function isNative() {
  return Capacitor.isNativePlatform()
}

export function platform(): 'ios' | 'android' | 'web' {
  const p = Capacitor.getPlatform()
  return p === 'ios' || p === 'android' ? p : 'web'
}

/**
 * Schedule a local notification one hour before the appointment.
 * Idempotent: re-running with the same appointment id replaces the
 * existing reminder (the LocalNotifications plugin does this when ids
 * match).
 */
export async function scheduleAppointmentReminder(appt: {
  id: string
  date: string
  startTime: string
  label: string
}) {
  if (!isNative()) return
  const { LocalNotifications } = await import('@capacitor/local-notifications')

  const perm = await LocalNotifications.checkPermissions()
  if (perm.display !== 'granted') {
    const req = await LocalNotifications.requestPermissions()
    if (req.display !== 'granted') return
  }

  const start = new Date(`${appt.date}T${normalizeTime(appt.startTime)}:00`)
  const at = new Date(start.getTime() - 60 * 60 * 1000) // 1h before
  if (at.getTime() <= Date.now()) return // already too late

  // Capacitor wants a numeric id. Hash the uuid into a stable 31-bit int.
  const id = stableNumericId(appt.id)

  await LocalNotifications.schedule({
    notifications: [
      {
        id,
        title: 'Recordatorio: tu cita es en 1 hora',
        body: appt.label,
        schedule: { at },
        smallIcon: 'ic_stat_icon_config_sample',
      },
    ],
  })
}

export async function cancelAppointmentReminder(appointmentId: string) {
  if (!isNative()) return
  const { LocalNotifications } = await import('@capacitor/local-notifications')
  await LocalNotifications.cancel({
    notifications: [{ id: stableNumericId(appointmentId) }],
  })
}

/**
 * Register the device with the API so push notifications can reach it.
 * Called once at startup, after the user is signed in. The actual send
 * side (FCM/APNs) is a follow-up — for now we just persist the token.
 */
export async function registerDeviceForPush(
  registerFn: (b: { platform: 'ios' | 'android'; token: string }) => Promise<unknown>,
) {
  if (!isNative()) return
  const { PushNotifications } = await import('@capacitor/push-notifications')

  const perm = await PushNotifications.checkPermissions()
  if (perm.receive !== 'granted') {
    const req = await PushNotifications.requestPermissions()
    if (req.receive !== 'granted') return
  }

  return new Promise<void>((resolve) => {
    const onRegistration = PushNotifications.addListener('registration', async (token) => {
      const plat = platform()
      if (plat === 'web') {
        await onRegistration.remove()
        resolve()
        return
      }
      try {
        await registerFn({ platform: plat, token: token.value })
      } catch (err) {
        // Swallow — registration failures shouldn't block app boot.
        console.warn('[push] device register failed:', err)
      }
      await onRegistration.remove()
      resolve()
    })

    const onError = PushNotifications.addListener('registrationError', async (err) => {
      console.warn('[push] registration error:', err.error)
      await onError.remove()
      resolve()
    })

    void PushNotifications.register()
  })
}

function normalizeTime(t: string) {
  return t.length === 5 ? t : t.slice(0, 5)
}

function stableNumericId(uuid: string): number {
  let h = 0
  for (let i = 0; i < uuid.length; i++) {
    h = (h * 31 + uuid.charCodeAt(i)) | 0
  }
  // Force into a positive 31-bit int for plugin compatibility.
  return Math.abs(h)
}
