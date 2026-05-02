import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  // Expose env vars prefixed with PUBLIC_ to the client bundle, alongside
  // Vite's default VITE_ prefix. Lets the same .env work on Vercel /
  // Cloudflare / Railway, which all conventionally use PUBLIC_*.
  envPrefix: ['VITE_', 'PUBLIC_'],
  resolve: { tsconfigPaths: true },
  plugins: [devtools(), tailwindcss(), tanstackStart(), viteReact()],
})

export default config
