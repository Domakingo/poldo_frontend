<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Alert from '@/components/Alert.vue'
import { useTurnoStore } from '@/stores/turno'
import { useOrdiniStore } from '@/stores/Gestione/ordini'

// Importa i componenti
import ProfessorTimeline from '@/components/Gestione/ProfessorTimeline.vue'
import TurnoTabs from '@/components/Gestione/TurnoTabs.vue'
import ProductTotals from '@/components/Gestione/ProductTotals.vue'
import ClassOrders from '@/components/Gestione/ClassOrders.vue'

// Store
const turnoStore = useTurnoStore()
const ordiniStore = useOrdiniStore()

// Ref
const classOrders = ref(ordiniStore.classOrders)
const profOrders = ref(ordiniStore.profOrders)
const loading = ref(true)
const error = ref<string | null>(null)
const selectedTurno = ref(1)
const showOrderDetails = ref(false)
const selectedOrderDetails = ref<any[]>([])
const availableTurni = computed(() => turnoStore.turni)

// Formattazione data
const selectedDate = ref(ordiniStore.selectedDate)

// Proprietà calcolata per la visualizzazione della timeline
const showProfessorTimeline = computed(() => {
  return ordiniStore.profOrders.length > 0;
})

// Recupera gli ordini dei professori
const fetchProfOrders = async () => {
  loading.value = true
  error.value = null
  
  try {
    await ordiniStore.fetchProfOrders()
    profOrders.value = ordiniStore.profOrders
  } catch (err) {
    error.value = ordiniStore.error || 'Errore nel caricamento degli ordini dei professori.'
  } finally {
    loading.value = false
  }
}

// Recupera gli ordini per classe
const fetchClassOrders = async () => {
  loading.value = true
  error.value = null
  
  try {
    await ordiniStore.fetchClassOrders(selectedTurno.value)
    classOrders.value = ordiniStore.classOrders
  } catch (err) {
    error.value = ordiniStore.error || 'Errore nel caricamento degli ordini per classe.'
  } finally {
    loading.value = false
  }
}

// Orari del turno selezionato
const selectedTurnoTimes = computed(() => {
  if (showProfessorTimeline.value) {
    return {
      orderStart: '08:00',
      orderEnd: '11:00',
      pickupStart: '11:30',
      pickupEnd: '15:00'
    };
  }

  const turno = turnoStore.turni.find(t => t.n === selectedTurno.value)

  if (!turno) {
    console.error(`Turno ${selectedTurno.value} not found!`);
    error.value = `Turno ${selectedTurno.value} non trovato. Selezionare un altro turno.`
    return null
  }

  return {
    orderStart: turno.oraInizio,
    orderEnd: turno.oraFine,
    pickupStart: turno.inizioRitiro,
    pickupEnd: turno.fineRitiro
  }
})

// Gestione cambio turno
const handleTurnoChange = async (turno: number) => {
  selectedTurno.value = turno;
  turnoStore.selectTurno(turno);

  await fetchProfOrders();

  if (turno === 2) {
    classOrders.value = ordiniStore.profOrders;
  } else {
    await fetchClassOrders();
  }
}

// Handler for when an order is marked as prepared
const handleOrderMarkedAsPrepared = async ({ classe, turno }: { classe: string, turno: number }) => {
  // Refresh the orders after an order is marked as prepared
  await ordiniStore.markOrderAsPrepared(classe, turno)
  
  if (turno === 2) {
    await fetchProfOrders()
    classOrders.value = ordiniStore.profOrders
  } else {
    await fetchClassOrders()
  }
}

// Handler for when a product is marked as prepared
const handleProductMarkedAsPrepared = async ({ productId, turno }: { productId: number, turno: number }) => {
  // Refresh the orders after a product is marked as prepared
  await ordiniStore.markProductAsPrepared(productId, turno)
  
  if (turno === 2) {
    await fetchProfOrders()
    classOrders.value = ordiniStore.profOrders
  } else {
    await fetchClassOrders()
  }
}


// Lifecycle
onMounted(async () => {
  await turnoStore.fetchTurni()
  await fetchProfOrders()

  if (turnoStore.turnoSelezionato > 0) {
    selectedTurno.value = turnoStore.turnoSelezionato
  } else if (availableTurni.value.length > 0) {
    selectedTurno.value = availableTurni.value[0].n
  }

  turnoStore.selectTurno(selectedTurno.value)

  if (selectedTurno.value === 2) {
    classOrders.value = ordiniStore.profOrders
  } else {
    await fetchClassOrders()
  }
})
</script>

<template>
  <div class="ordinazioni-view">
    <!-- Caricamento e stati di errore -->
    <div v-if="loading || turnoStore.loading" class="loading-indicator">
      <p>Caricamento ordinazioni...</p>
    </div>

    <div v-else-if="error || turnoStore.error" class="error-message">
      <p>{{ error || turnoStore.error }}</p>
      <button @click="turnoStore.fetchTurni().then(() => { fetchClassOrders(); fetchProfOrders(); })">Riprova</button>
    </div>

    <div v-else>

      <!-- Timeline per gli ordini dei professori -->
      <ProfessorTimeline
        v-if="showProfessorTimeline"
        :profOrders="profOrders"
        :turnoTimes="selectedTurnoTimes"
        @reload="fetchProfOrders"
      />

      <!-- Sezione ordini -->
      <div class="orders-section">
        <TurnoTabs
          :availableTurni="availableTurni"
          :selectedTurno="selectedTurno"
          @turnoChange="handleTurnoChange"
        />

        <div class="orders-content">
          <ProductTotals
            :classOrders="classOrders"
            :currentTurno="selectedTurno"
            @product-marked-as-prepared="handleProductMarkedAsPrepared"
          />
          <ClassOrders
            :classOrders="classOrders"
            :selectedTurno="selectedTurno"
            @orderMarkedAsPrepared="handleOrderMarkedAsPrepared"
          />
        </div>
      </div>
    </div>

    <!-- Modal per i dettagli degli ordini -->
    <Alert
      v-if="showOrderDetails"
      type="info"
      :message="'Dettagli Ordini'"
      @close="showOrderDetails = false"
    >
      <div class="order-details">
        <div v-for="order in selectedOrderDetails" :key="order.idOrdine" class="detail-item">
          <div class="detail-header">
            <span>Ordine #{{ order.idOrdine }}</span>
            <span>Classe {{ order.classe }}</span>
          </div>
          <div class="detail-products">
            <div v-for="product in order.prodotti" :key="product.idProdotto" class="detail-product">
              {{ product.nome }} x{{ product.quantita }}
            </div>
          </div>
        </div>
      </div>
    </Alert>
  </div>
</template>

<style scoped>
.ordinazioni-view {
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px;
  color: var(--poldo-text);
}

h1 {
  margin-bottom: 20px;
  color: var(--poldo-primary);
}

.loading-indicator,
.error-message,
.no-data {
  text-align: center;
  padding: 20px;
  color: var(--poldo-text);
}

.error-message {
  color: var(--poldo-red);
}

.error-message button {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: var(--poldo-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.orders-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: calc(80vh - 200px);
  overflow: hidden;
}

.orders-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.order-details {
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
}

.detail-item {
  background-color: var(--card-bg);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
  box-shadow: 0 2px 4px var(--card-shadow);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 5px;
}

.detail-products {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

@media (max-width: 768px) {
  .orders-content {
    flex-direction: column;
  }
}
</style>
