import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_MICROFRONTEND_NAME': JSON.stringify('events-service')
  },
  server: {
    port: 8085,
    cors: true
  }
})