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
    // API routes live in the Worker (worker/index.ts); run `bun run dev:api` alongside.
    proxy: {
      '/api': 'http://localhost:8787',
      '/.well-known': 'http://localhost:8787',
    },
  },
})
