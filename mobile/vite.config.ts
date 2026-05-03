import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

// SPA build for the mobile app. Embedded into the Capacitor shell as
// static assets, so no SSR — Capacitor's webview loads index.html and
// hydrates from there.
export default defineConfig({
  // Match the web app: PUBLIC_* vars flow into the bundle alongside
  // the Vite default VITE_*, so deploys can use the same `.env`.
  envPrefix: ['VITE_', 'PUBLIC_'],
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
    react(),
  ],
  build: {
    outDir: 'dist',
    // Capacitor expects relative asset URLs so the bundle works
    // when served from `capacitor://localhost` on iOS or
    // `https://localhost` on Android.
    assetsDir: 'assets',
  },
})
