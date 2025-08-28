import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Load env file from root directory
  const env = loadEnv(mode, path.resolve(__dirname, '../..'), '')
  
  return {
    plugins: [react()],
    server: {
      port: 8080,
      cors: true
    },
    build: {
      rollupOptions: {
        external: ['@honeycombio/opentelemetry-web']
      }
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts'
    },
    define: {
      // Explicitly expose environment variables from root .env
      __VITE_HONEYCOMB_API_KEY__: JSON.stringify(env.VITE_HONEYCOMB_API_KEY),
      'import.meta.env.VITE_MICROFRONTEND_NAME': JSON.stringify('ui-service-shell')
    },
    // Ensure Vite can access env vars from root
    envDir: path.resolve(__dirname, '../..')
  }
})