import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Load env file from root directory
  const env = loadEnv(mode, path.resolve(__dirname, '../..'), '')
  
  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_MICROFRONTEND_NAME': JSON.stringify('transit-service')
    },
    server: {
      port: 8083,
      cors: true
    },
    // Ensure Vite can access env vars from root
    envDir: path.resolve(__dirname, '../..')
  }
})