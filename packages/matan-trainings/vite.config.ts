import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/yoav-fun-packages/matan-trainings/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Kady Trainings',
        short_name: 'Kady Trainings',
        description: 'Personal Training Management App',
        theme_color: '#242424',
        background_color: '#242424',
        display: 'standalone',
        start_url: process.env.NODE_ENV === 'production' ? '/yoav-fun-packages/matan-trainings/' : '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Aggressive update strategy - activates new SW immediately
        skipWaiting: true,
        clientsClaim: true,
        // Clean up old caches automatically  
        cleanupOutdatedCaches: true,
        // Disable navigation fallback to avoid caching issues
        navigateFallback: null
      }
    })
  ],
})
