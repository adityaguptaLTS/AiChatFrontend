import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_BASE_URL || 'http://localhost:5181'

  return {
    plugins: [react()],
    server: {
      port: 5180,
      strictPort: true,
      host: '127.0.0.1',
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          headers: {
            Origin: 'http://localhost:5173',
          },
        },
      },
    },
  }
})
