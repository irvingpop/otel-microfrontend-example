import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_MICROFRONTEND_NAME': JSON.stringify('traffic-service')
  },
  server: {
    port: 8082,
    cors: true
  },
  build: {
    target: 'esnext',
    minify: false,
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
})