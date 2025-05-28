import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import fs from 'fs'
import path from 'path'

// Percorso assoluto alla cartella dei certificati
const certsPath = path.resolve(process.cwd(), 'certs');

// Funzione per leggere i file dei certificati con gestione errori
const readCertFile = (filename) => {
  try {
    return fs.readFileSync(path.join(certsPath, filename));
  } catch (error) {
    console.error(`Errore lettura file ${filename}:`, error.message);
    return null;
  }
};

const PRIVATE_KEY = readCertFile('key.pem');
const CERTIFICATE = readCertFile('cert.pem');

// Configurazione HTTPS solo se i certificati esistono
const httpsConfig = PRIVATE_KEY && CERTIFICATE ? {
  key: PRIVATE_KEY,
  cert: CERTIFICATE
} : false;

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
    host: true, // Accessibile da rete locale
    port: 5173,
    strictPort: true, // Non cerca altre porte se occupata
    https: httpsConfig, // Usa HTTPS se certificati disponibili
    allowedHosts: [
      'l.figliolo.it',
      'localhost'
    ],
    proxy: {
      '/api': {
        target: 'https://figliolo.it:5007',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/v1'),
        secure: false
      }
    },
    hmr: {
      protocol: httpsConfig ? 'wss' : 'ws',
      host: 'localhost',
      port: 5173
    }
  },
  optimizeDeps: {
    include: ['@vitejs/plugin-vue'],
    esbuildOptions: {
      target: 'esnext',
      supported: {
        'top-level-await': true
      }
    }
  }
})
