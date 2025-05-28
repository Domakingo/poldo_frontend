<script setup lang="ts">
import { QrcodeStream } from 'vue-qrcode-reader'
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import Alert from '@/components/Alert.vue'
import { useQRStore } from '@/stores/qr'

const router = useRouter()
const result = ref<string | null>(null)
const error = ref<string | null>(null)
const camera = ref<'auto' | 'rear' | 'front'>('auto')
const isValidScan = ref(false)
const qrStore = useQRStore();

// Stato per il modal di conferma
const showConfirmModal = ref(false);
const qrContentForConfirmation = ref<string | null>(null);

// Funzione per disegnare un contorno attorno ai QR code rilevati (per debug)
const paintOutline = (detectedCodes: any[], ctx: CanvasRenderingContext2D) => {
  if (detectedCodes && detectedCodes.length > 0) {
    console.log('QR Code trovato:', detectedCodes);
    for (const detectedCode of detectedCodes) {
      const [firstPoint, ...otherPoints] = detectedCode.cornerPoints;

      ctx.strokeStyle = "red";
      ctx.lineWidth = 5;

      ctx.beginPath();
      ctx.moveTo(firstPoint.x, firstPoint.y);
      for (const { x, y } of otherPoints) {
        ctx.lineTo(x, y);
      }
      ctx.lineTo(firstPoint.x, firstPoint.y);
      ctx.closePath();
      ctx.stroke();
      console.log('quadrato disegnato - data: ', detectedCode.rawValue);
    }
    onDecode(detectedCodes[0].rawValue);
  }
}

const onDecode = (content: string | null) => {
  console.log('ricevuto - contenuto:', content);

  if (!content || content.trim() === "") {
    console.warn('nullo o vuoto.');
    error.value = 'QR code letto è vuoto o non valido.';
    result.value = null;
    isValidScan.value = false;
    showConfirmModal.value = false;
    return;
  }
  qrStore.checkQR(content);
  result.value = null;

  try {
    // if (content.startsWith('ordine-classe:')) {
    if (content.startsWith('')) {
      console.log('[DEBUG] onDecode - QR code VALIDO per "ordine-classe". Order ID:', content.split(':')[1]);
      qrContentForConfirmation.value = content; // Salva per la conferma
      isValidScan.value = true; // Necessario per la logica del modal e del risultato
      error.value = null; // Pulisce errori precedenti
      showConfirmModal.value = true; // Mostra il modal di conferma
    } else {
      console.warn('[DEBUG] onDecode - QR code NON RICONOSCIUTO. Contenuto:', content);
      // Per QR non riconosciuti, mostra direttamente la pagina di risultato con il contenuto
      result.value = content;
      isValidScan.value = false;
      error.value = null; // Pulisce errori di camera, la pagina risultato indicherà formato non valido
      showConfirmModal.value = false;
    }
  } catch (e: any) {
    console.error('[DEBUG] onDecode - Errore durante la validazione del contenuto del QR code:', e);
    error.value = `Errore nella validazione del QR code: ${e.message || e}`;
    isValidScan.value = false;
    showConfirmModal.value = false;
  }
}

const onInit = async (promise: Promise<any>) => {
  console.log('[DEBUG] onInit - Chiamata. In attesa della promise di inizializzazione della fotocamera...');
  try {
    const capabilities = await promise;
    console.log('[DEBUG] onInit - Fotocamera inizializzata con SUCCESSO. Funzionalità:', capabilities);
    error.value = null;
  } catch (e: any) {
    console.error('[DEBUG] onInit - ERRORE nell\'inizializzazione della fotocamera:', e);
    console.error('[DEBUG] onInit - Nome errore:', e.name, 'Messaggio:', e.message);
    // Gestione errori come prima
    if (e.name === 'NotAllowedError') {
      error.value = 'Permesso fotocamera NEGATO. Devi autorizzare l\'accesso alla fotocamera nelle impostazioni del browser.';
    } else if (e.name === 'NotFoundError') {
      error.value = 'Nessuna fotocamera disponibile. Controlla che una fotocamera sia connessa e non utilizzata da altre applicazioni.';
    } else if (e.name === 'NotSupportedError') {
      error.value = 'Accesso HTTPS o localhost richiesto. La fotocamera non può essere usata su HTTP (non sicuro).';
    } else if (e.name === 'NotReadableError') {
      error.value = 'La fotocamera è già in uso o bloccata. Chiudi altre app che potrebbero usarla o riavvia il browser.';
    } else if (e.name === 'OverconstrainedError') {
      error.value = 'Nessuna fotocamera soddisfa i requisiti. Questo può accadere se la fotocamera selezionata (es. retro) non è disponibile.';
    } else if (e.name === 'StreamApiNotSupportedError') {
      error.value = 'L\'API Stream per la fotocamera non è supportata da questo browser. Prova un browser più moderno.';
    } else if (e.message && e.message.includes('Requested device not found')) {
        error.value = 'Dispositivo richiesto (fotocamera) non trovato. Potrebbe essere disconnessa o non disponibile.';
    } else {
      error.value = `Errore sconosciuto durante l\'inizializzazione della fotocamera: ${e.name} - ${e.message || e}`;
    }
  }
}

const resetScanner = () => {
  console.log('[DEBUG] resetScanner - Chiamata.');
  result.value = null;
  error.value = null;
  isValidScan.value = false;
  showConfirmModal.value = false; // Resetta anche lo stato del modal
  qrContentForConfirmation.value = null; // Pulisce il contenuto in attesa
  console.log('[DEBUG] resetScanner - Stato resettato. `result` è ora null, `qrcode-stream` dovrebbe riapparire.');
}

const handleOrder = () => {
  console.log('[DEBUG] handleOrder - Chiamata.');
  if (result.value && isValidScan.value) {
    const orderId = result.value.split(':')[1];
    console.log('[DEBUG] handleOrder - Navigazione a /ordini/', orderId);
    router.push(`/ordini/${orderId}`);
  } else {
    console.warn('[DEBUG] handleOrder - Tentativo di gestire ordine con result nullo o scansione non valida. Result:', result.value, 'isValidScan:', isValidScan.value);
  }
}


const handleModalConfirm = () => {
  console.log('[DEBUG] handleModalConfirm - Ordine confermato dall\'utente.');
  if (qrContentForConfirmation.value && isValidScan.value) {
    result.value = qrContentForConfirmation.value;
  } else {
     console.warn('[DEBUG] handleModalConfirm - qrContentForConfirmation o isValidScan non validi.');
  }
  showConfirmModal.value = false;
};

const handleModalCancel = () => {
  console.log('[DEBUG] handleModalCancel - Ordine annullato dall\'utente.');
  showConfirmModal.value = false;
  resetScanner(); // Permette una nuova scansione
};

const confirmationMessage = computed(() => {
  if (qrContentForConfirmation.value) {
    return `Confermi l'ordine associato al QR Code: "${qrContentForConfirmation.value}"?`;
  }
  return 'Sei sicuro di voler procedere?';
});


onMounted(() => {
  console.log('[DEBUG] Componente QRScanner MONTATO.');
  if (!('BarcodeDetector' in window)) {
    console.warn('[DEBUG] BarcodeDetector API non è supportata da questo browser.');
    error.value = 'Il tuo browser non supporta la scansione QR nativa. Prova un browser più recente (es. Chrome, Edge, Safari).';
  } else {
    console.log('[DEBUG] BarcodeDetector supportata.');
  }
});

</script>

<template>
  <div class="qr-scanner-page">
    <div v-if="error && !showConfirmModal" class="error-message-box">
      <h4>Errore Scansione</h4>
      <p>{{ error }}</p>
      <button @click="resetScanner">Riprova</button>
    </div>

    <Alert
      v-if="showConfirmModal"
      type="confirm"
      :message="confirmationMessage"
      @confirm="handleModalConfirm"
      @cancel="handleModalCancel"
    />

    <div class="scanner-container">
      <div v-if="!result" class="camera-wrapper">
        <qrcode-stream
          @init="onInit"
          :camera="camera"
          :track="paintOutline"
        >
          <div class="scan-overlay">
            <div class="viewfinder"></div>
            <div class="scan-line"></div>
          </div>
        </qrcode-stream>

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
/* Placeholder per variabili CSS globali, definiscile nel tuo progetto */
/* Queste variabili dovrebbero essere definite globalmente per essere accessibili anche da Alert.vue */
/* :root {
  --poldo-background: #f0f2f5;
  --poldo-primary: #efc20c;
  --poldo-text: #333333;
  --card-bg: #ffffff;
  --card-shadow: rgba(0, 0, 0, 0.1);
  --color-background-soft: #f8f9fa;
  --poldo-green: #4CAF50;
  --poldo-red: #F44336;
  --poldo-accent: #FF9800;
  --color-background: #fff;
  --color-text: #333;
} */

.qr-scanner-page {
  height: 100vh;
  background: #2c3e50;
  display: flex;
  flex-direction: column;
  color: var(--poldo-text, #333333); /* Fallback se var non definita */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.error-message-box {
  background-color: #ffdddd;
  border-left: 6px solid #f44336;
  color: #5c2121;
  padding: 15px;
  margin: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: relative; /* Per z-index se necessario */
  z-index: 1001; /* Sopra il QR stream ma sotto il modal Alert se Alert ha z-index più alto */
}
.error-message-box h4 {
  margin-top: 0;
  margin-bottom: 5px;
  font-weight: bold;
}
.error-message-box button {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
  transition: background-color 0.2s;
}
.error-message-box button:hover {
  background-color: #d32f2f;
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

.scan-prompt {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  background-color: rgba(0,0,0,0.5);
  padding: 8px 15px;
  border-radius: 5px;
  z-index: 10;
}

:deep(.qrcode-stream-wrapper) {
  width: 100% !important;
  height: 100% !important;
}
:deep(video) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover;
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
