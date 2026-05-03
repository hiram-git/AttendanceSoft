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

  plugins: {
    SplashScreen: {
      // Match the design accent for the navy background. The artwork
      // (a gradient brand mark) lives in mobile/resources/splash.svg
      // and is rasterized by `cap assets generate`.
      backgroundColor: '#0a0f24',
      launchShowDuration: 1500,
      launchAutoHide: false, // we hide it from JS once the app is ready
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
    },
    PushNotifications: {
      // Both iOS and Android prompt the OS-level permission dialog the
      // first time. When 'true' the prompt is shown automatically.
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },

  // Custom URL scheme for invitation deep links: tapping
  //   attendancesoft://invite/<token>
  // opens the app and routes to /portal/invite/<token>. Universal
  // / App links (https://...) are a follow-up once we have a domain.
  ios: {
    scheme: 'attendancesoft',
  },
}

export default config
