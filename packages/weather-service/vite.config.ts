import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// For this demo, we'll create a standalone app that can be embedded
// In production, you would use @module-federation/vite for true microfrontends

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8081,
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
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts'
  }
})