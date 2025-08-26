import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_MICROFRONTEND_NAME': JSON.stringify('energy-service')
  },
  server: {
    port: 8084,
    cors: true
  },
  build: {
    target: 'esnext',
    minify: false
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
})