import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'mx.attendancesoft.app',
  appName: 'AttendanceSoft',
  webDir: 'dist',
  // Loosen for dev: iOS/Android simulators talk to the host's localhost
  // through the network. In production these go away because the app
  // talks to PUBLIC_API_URL set at build time.
  server: {
    androidScheme: 'https',
  },
}

export default config
