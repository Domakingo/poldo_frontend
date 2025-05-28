<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Alert from '@/components/Alert.vue'
import { useQRStore } from '@/stores/qr'
import jsQR from 'jsqr'

const router = useRouter()
const result = ref<string | null>(null)
const error = ref<string | null>(null)
const isValidScan = ref(false)
const qrStore = useQRStore();
const videoElement = ref<HTMLVideoElement | null>(null)
const canvasElement = ref<HTMLCanvasElement | null>(null)
const canvasContext = ref<CanvasRenderingContext2D | null>(null)
const scanning = ref(false)
const showScanner = ref(true)

// Stato per gli alert
const showConfirmModal = ref(false);
const showErrorAlert = ref(false);
const qrContentForConfirmation = ref<string | null>(null);

const onDecode = (content: string | null) => {
  console.log('ricevuto - contenuto:', content);

  if (!content || content.trim() === "") {
    console.warn('nullo o vuoto.');
    error.value = 'QR code letto è vuoto o non valido.';
    showErrorAlert.value = true;
    return;
  }

  qrStore.checkQR(content);
  result.value = null;

  try {
    if (content.startsWith('ordine-classe:')) {
      console.log('[DEBUG] QR code VALIDO per "ordine-classe". Order ID:', content.split(':')[1]);
      qrContentForConfirmation.value = content;
      isValidScan.value = true;
      showConfirmModal.value = true;
    } else {
      console.warn('[DEBUG] QR code NON RICONOSCIUTO. Contenuto:', content);
      result.value = content;
      isValidScan.value = false;
      showScanner.value = false;
    }
  } catch (e: any) {
    console.error('[DEBUG] Errore validazione QR code:', e);
    error.value = `Errore nella validazione del QR code: ${e.message || e}`;
    showErrorAlert.value = true;
  }
}

const resetScanner = () => {
  console.log('[DEBUG] resetScanner - Chiamata.');
  result.value = null;
  error.value = null;
  isValidScan.value = false;
  showConfirmModal.value = false;
  showErrorAlert.value = false;
  qrContentForConfirmation.value = null;
  showScanner.value = true;
  startScanning();
}

const handleOrder = () => {
  console.log('[DEBUG] handleOrder - Chiamata.');
  if (result.value && isValidScan.value) {
    const orderId = result.value.split(':')[1];
    router.push(`/ordini/${orderId}`);
  }
}

const handleModalConfirm = () => {
  console.log('[DEBUG] Conferma ordine');
  if (qrContentForConfirmation.value && isValidScan.value) {
    result.value = qrContentForConfirmation.value;
    showConfirmModal.value = false;
    showScanner.value = false;
  }
};

const handleModalCancel = () => {
  console.log('[DEBUG] Annulla ordine');
  showConfirmModal.value = false;
  resetScanner();
};

const confirmationMessage = computed(() => {
  if (qrContentForConfirmation.value) {
    return `Confermi l'ordine associato al QR Code: "${qrContentForConfirmation.value}"?`;
  }
  return 'Sei sicuro di voler procedere?';
});

// Avvia scansione
const startScanning = async () => {
  try {
    if (!videoElement.value || !canvasElement.value) return;

    // Configura canvas
    canvasContext.value = canvasElement.value.getContext('2d');
    if (!canvasContext.value) return;

    // Ottieni accesso fotocamera
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });

    videoElement.value.srcObject = stream;
    videoElement.value.setAttribute("playsinline", "true");
    videoElement.value.play();

    scanning.value = true;
    requestAnimationFrame(tick);
  } catch (err) {
    console.error('Errore accesso fotocamera:', err);
    error.value = 'Impossibile accedere alla fotocamera. Assicurati di aver concesso i permessi.';
    showErrorAlert.value = true;
    scanning.value = false;
  }
};

// Analizza frame
const tick = () => {
  if (!scanning.value) return;

  if (videoElement.value && videoElement.value.readyState === videoElement.value.HAVE_ENOUGH_DATA) {
    if (!canvasElement.value || !canvasContext.value) return;

    canvasElement.value.hidden = false;
    const video = videoElement.value;
    const canvas = canvasElement.value;

    // Imposta dimensioni canvas
    canvas.height = video.videoHeight;
    canvas.width = video.videoWidth;

    // Disegna frame corrente
    canvasContext.value.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Cerca QR code
    const imageData = canvasContext.value.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (code) {
      onDecode(code.data);
      scanning.value = false;
      showScanner.value = false;

      // Ferma stream video
      if (videoElement.value && videoElement.value.srcObject) {
        const tracks = (videoElement.value.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    }
  }

  if (scanning.value) {
    requestAnimationFrame(tick);
  }
};

// Ferma fotocamera
const stopCamera = () => {
  scanning.value = false;
  if (videoElement.value && videoElement.value.srcObject) {
    const tracks = (videoElement.value.srcObject as MediaStream).getTracks();
    tracks.forEach(track => track.stop());
  }
};

onMounted(() => {
  console.log('[DEBUG] Componente montato');
  startScanning();
});

onUnmounted(() => {
  stopCamera();
});
</script>

<template>
  <div class="qr-scanner-page">
    <!-- Alert per errori -->
    <Alert
      v-if="showErrorAlert"
      type="error"
      :message="error || 'Errore sconosciuto'"
      @close="resetScanner"
    />

    <!-- Alert per conferma ordine -->
    <Alert
      v-if="showConfirmModal"
      type="confirm"
      :message="confirmationMessage"
      @confirm="handleModalConfirm"
      @cancel="handleModalCancel"
    />

    <div class="scanner-container">
      <div v-if="showScanner" class="camera-wrapper">
        <video ref="videoElement" class="video-feed" playsinline></video>
        <canvas ref="canvasElement" class="scan-canvas" hidden></canvas>

        <div class="scan-overlay">
          <div class="viewfinder"></div>
          <div class="scan-line"></div>
        </div>

        <div class="scanner-actions">
          <button class="icon-btn back-btn" @click="router.back()" title="Indietro">
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
            <button
              v-if="isValidScan"
              class="confirm-btn"
              @click="handleOrder"
            >
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
/* Stili invariati */
.video-feed {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scan-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.qr-scanner-page {
  height: 100vh;
  background: #2c3e50;
  display: flex;
  flex-direction: column;
  color: var(--poldo-text, #333333);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.scanner-container {
  flex: 1;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.camera-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background-color: #000;
}

.scan-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
}

.viewfinder {
  width: clamp(200px, 70vw, 350px);
  height: clamp(200px, 70vw, 350px);
  border: 4px solid var(--poldo-primary, #efc20c);
  border-radius: 20px;
  position: relative;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5),
              0 0 25px rgba(239, 194, 12, 0.4);
}

.scan-line {
  position: absolute;
  width: clamp(180px, 65vw, 330px);
  height: 3px;
  background: linear-gradient(to right, transparent, var(--poldo-primary, #efc20c), transparent);
  top: 10%;
  animation: scan 2.8s infinite cubic-bezier(0.5, 0, 0.5, 1);
  border-radius: 2px;
  box-shadow: 0 0 10px var(--poldo-primary, #efc20c);
}

@keyframes scan {
  0% { transform: translateY(0); opacity: 0.8; }
  50% { transform: translateY(calc(clamp(200px, 70vw, 350px) - 20px)); opacity: 1;}
  100% { transform: translateY(0); opacity: 0.8; }
}

.scanner-actions {
  position: absolute;
  bottom: 25px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 0 20px;
  box-sizing: border-box;
  gap: 20px;
  z-index: 20;
}

.icon-btn {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0,0,0,0.2);
  width: 55px;
  height: 55px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  transition: background-color 0.2s, transform 0.2s;
}
.icon-btn:hover {
  background: white;
  transform: translateY(-2px);
}

.icon-btn.back-btn svg {
  fill: #333;
}

.icon-btn svg {
  width: 28px;
  height: 28px;
  fill: var(--poldo-primary, #efc20c);
}

.scan-result {
  padding: 20px;
  width: 100%;
  max-width: 600px;
  box-sizing: border-box;
}

.result-card {
  background: var(--card-bg, #ffffff);
  padding: 25px 30px;
  border-radius: 15px;
  width: 100%;
  box-shadow: 0 6px 15px var(--card-shadow, rgba(0, 0, 0, 0.1));
  text-align: center;
}
.result-card h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: var(--poldo-text, #333333);
  font-size: 1.4rem;
}

.result-content {
  margin: 20px 0;
  padding: 15px;
  background: var(--color-background-soft, #f8f9fa);
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  word-break: break-all;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.95rem;
  color: #333;
  text-align: left;
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 25px;
}

.confirm-btn, .rescan-btn {
  padding: 14px 25px;
  border: none;
  border-radius: 8px;
  font-size: 1.05rem;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}
.confirm-btn:hover, .rescan-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.confirm-btn {
  background: var(--poldo-primary, #efc20c);
  color: white;
}

.rescan-btn {
  background: #e9ecef;
  color: var(--poldo-text, #333333);
  border: 1px solid #ced4da;
}
</style>
