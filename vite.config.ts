import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  base: '/Kachmohol2099/',
  server: { host: '0.0.0.0', allowedHosts: true }
})
