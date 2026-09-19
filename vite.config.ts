import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  base: '/Kachmohol2099/',
  server: { host: '0.0.0.0', allowedHosts: true },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('three') || id.includes('@react-three') || id.includes('postprocessing')) return 'three-engine'
          if (id.includes('dexie') || id.includes('qrcode')) return 'app-services'
        }
      }
    }
  }
})
