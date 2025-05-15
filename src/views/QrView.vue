<script setup lang="ts">
import { QrcodeStream, QrcodeDropZone, QrcodeCapture } from 'vue-qrcode-reader'
import { ref } from 'vue'
import Alert from '@/components/Alert.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const result = ref<string | null>(null)
const error = ref<string | null>(null)
const camera = ref<'auto' | 'rear' | 'front'>('auto')
const isValidScan = ref(false)

const onDecode = (content: string) => {
  result.value = content
  try {
    // Esempio validazione formato QR code
    if (content.startsWith('ordine-classe:')) {
      const orderId = content.split(':')[1]
      isValidScan.value = true
      // Gestisci l'ordine...
    } else {
      error.value = 'QR code non riconosciuto'
    }
  } catch (e) {
    error.value = 'Errore nella lettura del QR code'
  }
}

const onInit = async (promise: Promise<any>) => {
  try {
    await promise
  } catch (e) {
    if (e === 'NotAllowedError') {
      error.value = 'Permesso camera negato'
    } else if (e === 'NotFoundError') {
      error.value = 'Nessuna camera disponibile'
    } else {
      error.value = 'Errore sconosciuto'
    }
  }
}

const resetScanner = () => {
  result.value = null
  error.value = null
  isValidScan.value = false
}

const handleOrder = () => {
  if (result.value) {
    router.push(`/ordini/${result.value.split(':')[1]}`)
  }
}
</script>

<template>
  <div class="qr-scanner-page">
    <Alert 
      v-if="error"
      type="error" 
      :message="error"
      @close="error = null"
    />

    <div class="scanner-container">
      <div v-if="!result" class="camera-wrapper">
        <qrcode-stream
          @decode="onDecode"
          @init="onInit"
          :camera="camera"
        >
          <div class="scan-overlay">
            <div class="viewfinder"></div>
            <div class="scan-line"></div>
          </div>
        </qrcode-stream>

        <div class="scanner-actions">
          <button class="icon-btn" @click="router.back()">
            <svg viewBox="0 0 24 24">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
        </div>
      </div>

      <div v-else class="scan-result">
        <div class="result-card">
          <h3 v-if="isValidScan">Ordine riconosciuto!</h3>
          <h3 v-else>Contenuto QR code:</h3>
          
          <div class="result-content">
            <code>{{ result }}</code>
          </div>

          <div class="result-actions">
            <button v-if="isValidScan" 
                    class="confirm-btn"
                    @click="handleOrder">
              Visualizza ordine
            </button>
            <button class="rescan-btn" @click="resetScanner">
              Scansiona nuovo
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.qr-scanner-page {
  height: 100vh;
  background: var(--poldo-background);
  display: flex;
  flex-direction: column;
}

.scanner-container {
  flex: 1;
  position: relative;
}

.camera-wrapper {
  height: 100%;
  position: relative;
  overflow: hidden;
}

.scan-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
}

.viewfinder {
  width: 70vw;
  max-width: 400px;
  height: 70vw;
  max-height: 400px;
  border: 4px solid var(--poldo-primary);
  border-radius: 20px;
  position: relative;
  box-shadow: 0 0 20px rgba(239, 194, 12, 0.3);
}

.scan-line {
  position: absolute;
  width: 90%;
  height: 4px;
  background: var(--poldo-primary);
  top: 10%;
  animation: scan 2.5s infinite linear;
  border-radius: 2px;
}

@keyframes scan {
  0% { top: 10% }
  50% { top: 90% }
  100% { top: 10% }
}

.scanner-actions {
  position: absolute;
  bottom: 30px;
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 20px;
}

.icon-btn {
  background: var(--poldo-primary);
  border: none;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px var(--card-shadow);
}

.icon-btn svg {
  width: 30px;
  height: 30px;
  fill: white;
}

.scan-result {
  padding: 20px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-card {
  background: var(--card-bg);
  padding: 30px;
  border-radius: 20px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 12px var(--card-shadow);
  text-align: center;
}

.result-content {
  margin: 20px 0;
  padding: 15px;
  background: var(--color-background-soft);
  border-radius: 10px;
  word-break: break-all;
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 25px;
}

.confirm-btn, .rescan-btn {
  padding: 12px 25px;
  border: none;
  border-radius: 25px;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s;
}

.confirm-btn {
  background: var(--poldo-primary);
  color: white;
}

.rescan-btn {
  background: var(--color-background-soft);
  color: var(--poldo-text);
}

button:hover {
  transform: translateY(-2px);
}
</style>