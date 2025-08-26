import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
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
      // Explicitly expose environment variables
      __VITE_HONEYCOMB_API_KEY__: JSON.stringify(env.VITE_HONEYCOMB_API_KEY),
      'import.meta.env.VITE_MICROFRONTEND_NAME': JSON.stringify('ui-service-shell')
    }
  }
})