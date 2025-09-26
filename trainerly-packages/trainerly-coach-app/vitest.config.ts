import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    pool: 'forks', // Use forked processes to avoid global pollution
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@testkit': resolve(__dirname, '../trainerly-server/src/testkit'),
    }
  },
  define: {
    global: 'globalThis',
    // Add webidl-conversions polyfills directly
    'global.WeakMap': 'globalThis.WeakMap || WeakMap',
    'global.Map': 'globalThis.Map || Map',
    'global.Set': 'globalThis.Set || Set',
    'global.Symbol': 'globalThis.Symbol || Symbol',
  }
})
