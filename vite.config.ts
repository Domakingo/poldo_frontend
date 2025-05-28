import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['l.figliolo.it', 'f03a-87-8-184-244.ngrok-free.app'],
    proxy: {
      '/api': {
        target: 'http://figliolo.it:5006',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/v1'),
        secure: false
      }
    }
  }
})
