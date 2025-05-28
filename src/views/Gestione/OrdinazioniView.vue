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

// Proprietà calcolata per la visualizzazione della timeline - Modificato per mostrare sempre la timeline
const showProfessorTimeline = computed(() => {
  return true; // Always show the timeline regardless of whether there are orders
})

// Recupera gli ordini dei professori
const fetchProfOrders = async () => {
  loading.value = true
  error.value = null
  
  try {
    await ordiniStore.fetchProfOrders()
    // Create a new array reference to ensure Vue's reactivity system detects the change
    profOrders.value = [...ordiniStore.profOrders]
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
    // Create a new array reference to ensure Vue's reactivity system detects the change
    classOrders.value = [...ordiniStore.classOrders]
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
  
  // Always fetch professor orders for timeline regardless of selected turno
  await fetchProfOrders();
  
  if (turno === 2) {
    // For turno 2 (professors), we use profOrders in the order list
    // Create a new array reference to ensure Vue's reactivity system detects the change
    classOrders.value = [...ordiniStore.profOrders];
  } else {
    // For other turni (students), fetch class orders
    await fetchClassOrders();
  }
}

// Handler for when an order is marked as prepared
const handleOrderMarkedAsPrepared = async ({ classe, turno }: { classe: string, turno: number }) => {
  // Update local state immediately to show changes in UI without waiting for API
  // Update order in profOrders for immediate timeline feedback
  if (turno === 2) {
    profOrders.value = profOrders.value.map(order => {
      if (order.classe === classe) {
        // Mark the order and all its products as prepared
        return {
          ...order,
          preparato: true,
          prodotti: order.prodotti.map(product => ({
            ...product, 
            preparato: true
          }))
        };
      }
      return order;
    });
  }

  // Update order in the currently displayed classOrders
  classOrders.value = classOrders.value.map(order => {
    if (order.classe === classe) {
      // Mark the order and all its products as prepared
      return {
        ...order,
        preparato: true,
        prodotti: Array.isArray(order.prodotti) ? order.prodotti.map(product => ({
          ...product,
          preparato: true
        })) : []
      };
    }
    return order;
  });
  
  // Call the store method to persist changes to API
  await ordiniStore.markOrderAsPrepared(classe, turno)
  
  // Refresh the orders to ensure data consistency
  if (turno === 2) {
    await fetchProfOrders()
    classOrders.value = [...ordiniStore.profOrders] // Create a new array reference to ensure reactivity
  } else {
    await fetchClassOrders()
  }
}

// Handler for when a product is marked as prepared
const handleProductMarkedAsPrepared = async ({ productId, turno }: { productId: number, turno: number }) => {
  // Update local state immediately to show changes in UI without waiting for API
  // Update products in profOrders for immediate timeline feedback
  profOrders.value.forEach(order => {
    if (order && Array.isArray(order.prodotti)) {
      order.prodotti.forEach(product => {
        if (product.idProdotto === productId) {
          product.preparato = true;
        }
      });
    }
  });

  // Update products in the currently displayed classOrders
  if (Array.isArray(classOrders.value)) {
    classOrders.value.forEach(order => {
      if (order && Array.isArray(order.prodotti)) {
        order.prodotti.forEach(product => {
          if (product.idProdotto === productId) {
            product.preparato = true;
          }
        });
      }
    });
  }
  
  // Call the store method to persist changes to API (which also includes local state updates)
  await ordiniStore.markProductAsPrepared(productId, turno)
  
  // Refresh the orders to ensure data consistency
  if (turno === 2) {
    await fetchProfOrders()
    classOrders.value = [...ordiniStore.profOrders] // Create a new array reference to ensure reactivity
  } else {
    await fetchClassOrders()
  }
}


// Lifecycle
onMounted(async () => {
  await turnoStore.fetchTurni()
  
  // Student turns are typically n=1, professor turns are n=2
  const studentTurns = availableTurni.value.filter(t => t.n === 1)
  const professorTurns = availableTurni.value.filter(t => t.n === 2)
  
  // Determine which turn to select initially
  // First check if we have a saved selection
  if (turnoStore.turnoSelezionato > 0) {
    selectedTurno.value = turnoStore.turnoSelezionato
  } 
  // Otherwise prefer student turn (usually turno 1) if available
  else if (availableTurni.value.some(t => t.n === 1)) {
    selectedTurno.value = 1
  }
  // Fallback to first available turn
  else if (availableTurni.value.length > 0) {
    selectedTurno.value = availableTurni.value[0].n
  }
  turnoStore.selectTurno(selectedTurno.value)

  // Always fetch the professor orders for the timeline regardless of selected turno
  await fetchProfOrders()
  
  // Load the appropriate orders based on the selected turn
  if (selectedTurno.value === 2) {
    // For professor turn, also use profOrders for the order list
    // Create a new array reference to ensure reactivity
    classOrders.value = [...ordiniStore.profOrders]
  } else {
    // For student turns, load class orders
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

    <div v-else>      <!-- Timeline per gli ordini dei professori - Always visible -->
      <ProfessorTimeline
        :profOrders="profOrders"
        :turnoTimes="selectedTurnoTimes"
        @reload="fetchProfOrders"
      />

      <!-- Sezione ordini -->
      <div class="orders-section">        <div class="turno-selection-container">
          <TurnoTabs
            :availableTurni="availableTurni"
            :selectedTurno="selectedTurno"
            @turnoChange="handleTurnoChange"
          />
          
          <!-- Current view indicator -->
          <div class="current-view-indicator">
            <span class="view-label">Tipo ordini:</span>
            <span class="view-value">
              {{ selectedTurno === 2 ? 'Professori' : 'Classi' }}
            </span>
          </div>
        </div>

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

.turno-selection-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.current-view-indicator {
  background-color: var(--poldo-card-bg);
  padding: 5px 15px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.9rem;
  border: 1px solid var(--color-border);
}

.view-label {
  font-weight: bold;
  color: var(--poldo-primary);
}

.view-value {
  padding: 2px 8px;
  background-color: var(--poldo-accent-light);
  border-radius: 4px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .orders-content {
    flex-direction: column;
  }
  
  .turno-selection-container {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .current-view-indicator {
    width: 100%;
    justify-content: center;
  }
}
</style>
