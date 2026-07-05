/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // amazon-cognito-identity-js (via its crypto-js dependency) references Node's `global`
  // object, which doesn't exist in browsers — map it to `globalThis` so the browser bundle
  // doesn't crash with "ReferenceError: global is not defined" on the /admin routes.
  define: {
    global: 'globalThis',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
