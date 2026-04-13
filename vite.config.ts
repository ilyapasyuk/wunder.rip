import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import viteTsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  base: '',
  plugins: [react(), viteTsconfigPaths()],
  build: {
    chunkSizeWarningLimit: 300,
  },
  server: {
    open: true,
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: ['ilyas-macbook-pro-m5-max.aegean-ph.ts.net']
  },
})
