/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { buildHead } from './src/seo/site.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      // Dev only: fill index.html's <!--app-head--> marker so `npm run dev` has a real title/meta.
      // Production builds leave the marker for scripts/prerender.mjs, which writes per-language heads.
      name: 'dev-seo-head',
      apply: 'serve',
      transformIndexHtml: (html, ctx) => html.replace('<!--app-head-->', buildHead(ctx.originalUrl?.startsWith('/tr') ? 'tr' : 'en')),
    },
  ],
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
