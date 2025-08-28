import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Load env file from root directory
  const env = loadEnv(mode, path.resolve(__dirname, '../..'), '')
  
  return {
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
    },
    // Ensure Vite can access env vars from root
    envDir: path.resolve(__dirname, '../..')
  }
})