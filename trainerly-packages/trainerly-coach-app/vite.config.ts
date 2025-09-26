import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/yoav-fun-packages/trainerly-coach-app/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 3001,
    open: '/'
  }
})
