import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({    
  server: {
    host: true,
    port: 5173,  // optional: your Vite dev server port
    strictPort: true,
 allowedHosts:['app.tdrivers.in','www.app.tdrivers.in'],
  },
  plugins: [
    react(),
    legacy(),
    tailwindcss(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})
