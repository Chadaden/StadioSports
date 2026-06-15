import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Installable PWA (§2). Offline persistence for Firestore is enabled
    // separately in src/firebase/config.js.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'STADIO National Sports Day',
        short_name: 'Sports Day',
        description: 'Live scores, standings, squad travel and schedule for STADIO National Sports Day.',
        theme_color: '#ffffff',
        background_color: '#f5f6f7',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
  ],
})
