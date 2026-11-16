import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Fail loudly if 5173 is taken instead of silently moving to 5174
    // (which usually means a stale copy of the app is still running).
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})
