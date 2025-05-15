<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Alert from '@/components/Alert.vue'
import { useTurnoStore } from '@/stores/turno'

// Importa i componenti
import ProfessorTimeline from '@/components/Gestione/ProfessorTimeline.vue'
import TurnoTabs from '@/components/Gestione/TurnoTabs.vue'
import ProductTotals from '@/components/Gestione/ProductTotals.vue'
import ClassOrders from '@/components/Gestione/ClassOrders.vue'

// Store
const turnoStore = useTurnoStore()

// // API configurazione
// const API_CONFIG = {
//   BASE_URL: 'http://figliolo.it:5005/v1',
//   TOKEN: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDgsInJ1b2xvIjoiYWRtaW4iLCJpYXQiOjE3NDQyNzk2ODMsImV4cCI6MTc3NTgzNzI4M30.AelK6BkvrydKSqNGuXbzWGzST4yctrHvdjy66XeoMHI"
// }
const API_CONFIG = {
  BASE_URL: 'http://figliolo.it:5005/v1',
  TOKEN: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDgsInJ1b2xvIjoiYWRtaW4iLCJpYXQiOjE3NDQyNzk2ODMsImV4cCI6MTc3NTgzNzI4M30.AelK6BkvrydKSqNGuXbzWGzST4yctrHvdjy66XeoMHI"
}

// Headers per le chiamate API
const headers = new Headers({
  Authorization: `Bearer ${API_CONFIG.TOKEN}`,
  Accept: 'application/json',
  'Content-Type': 'application/json'
})

// Interfacce
interface Product {
  idProdotto: number
  nome: string
  quantita: number
  prezzo: number
}

interface Order {
  idOrdine: number
  data: string
  nTurno: number
  giorno: string
  user: number
  classe: string
  confermato: boolean
  preparato: boolean
  oraRitiro?: string 
  prodotti: Product[]
  userRole?: string 
  userData?: any 
}

interface ClassOrder {
  classe: string
  data: string
  prodotti: Product[]
  confermato?: boolean
  oraRitiro?: string
  preparato?: boolean
}

// Ref
const classOrders = ref<ClassOrder[]>([]) 
const profOrders = ref<Order[]>([]) 
const loading = ref(true)
const error = ref<string | null>(null)
const selectedTurno = ref(1)
const showOrderDetails = ref(false)
const selectedOrderDetails = ref<Order[]>([])
const availableTurni = computed(() => turnoStore.turni)

// Formattazione data
const formatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
const selectedDate = ref(formatDate(new Date()))

// Proprietà calcolata per la visualizzazione della timeline
const showProfessorTimeline = computed(() => {
  return profOrders.value.length > 0;
})

// Cache utenti
const userCache = ref<{[key: number]: any}>({});
const fetchUserById = async (userId: number) => {
  if (userCache.value[userId]) return userCache.value[userId];
  
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/utenti/${userId}`, { headers }); 
    if (!response.ok) {
      throw new Error(`Impossibile recuperare i dati dell'utente con ID ${userId}`);
    }
    const userData = await response.json();
    userCache.value[userId] = userData;
    
    return userData;
  } catch (error) {
    console.error(`Errore nel recupero dei dati dell'utente con ID ${userId}:`, error);
    return null;
  }
}

// Recupera gli ordini dei professori
const fetchProfOrders = async () => {
  loading.value = true
  try {
    const url = `${API_CONFIG.BASE_URL}/ordini?startDate=${selectedDate.value}&endDate=${selectedDate.value}`;
    const response = await fetch(url, { headers })
    
    if (!response.ok) throw new Error(`Errore API con stato ${response.status}`)
    const data = await response.json()
    
    const professorOrders = data.filter((order: any) => order.oraRitiro !== null && order.oraRitiro !== undefined);
    const processedOrders = [];
    for (const order of professorOrders) {
      try {
        const processedOrder = {
          ...order,
          prodotti: Array.isArray(order.prodotti) ? order.prodotti : [],
          classe: order.classe,
          userRole: 'prof',
          oraRitiro: order.oraRitiro
        };
        
        if (order.user) {
          const userData = await fetchUserById(order.user);
          if (userData) {
            processedOrder.userData = userData;
          }
        }
        
        processedOrders.push(processedOrder);
      } catch (err) {
        console.error("Errore nell'elaborazione dell'ordine del professore:", err, order);
      }
    }
    
    profOrders.value = processedOrders;
  } catch (err) {
    console.error('Errore nel recupero degli ordini dei professori:', err)
    error.value = 'Errore nel caricamento degli ordini dei professori.'
    profOrders.value = []
  } finally {
    loading.value = false
  }
}

// Recupera gli ordini per classe
const fetchClassOrders = async () => {
  loading.value = true
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/ordini/classi?startDate=${selectedDate.value}&endDate=${selectedDate.value}&nTurno=${selectedTurno.value}`, { headers })
    if (!response.ok) {
      throw new Error(`Errore API con stato ${response.status}`)
    }
    const data = await response.json()
    
    // Filtra gli ordini per il turno selezionato
    classOrders.value = data
      .map((order: any) => ({
        ...order,
        prodotti: Array.isArray(order.prodotti) ? order.prodotti : [],
        classe: order.classe,
        confermato: order.confermato,
        preparato: order.preparato
      }))
  } catch (err) {
    console.error('Errore nel recupero degli ordini per classe:', err)
    error.value = 'Errore nel caricamento degli ordini per classe.'
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
    classOrders.value = profOrders.value.map(order => ({
      ...order,
      classe: order.classe,
      data: order.data,
      prodotti: Array.isArray(order.prodotti) ? order.prodotti : [],
      confermato: order.confermato,
      oraRitiro: order.oraRitiro,
      preparato: order.preparato,
      userData: order.userData
    }));
  } else {
    await fetchClassOrders();
  }
}

// Handler for when an order is marked as prepared
const handleOrderMarkedAsPrepared = async ({ classe, turno }: { classe: string, turno: number }) => {
  // Refresh the orders after an order is marked as prepared
  if (turno === 2) {
    await fetchProfOrders()
    
    classOrders.value = profOrders.value.map(order => ({
      ...order,
      classe: order.classe,
      data: order.data,
      prodotti: Array.isArray(order.prodotti) ? order.prodotti : [],
      confermato: order.confermato,
      oraRitiro: order.oraRitiro,
      preparato: order.preparato,
      userData: order.userData
    }));
  } else {
    await fetchClassOrders()
  }
}

// Handler for when a product is marked as prepared
const handleProductMarkedAsPrepared = async ({ productId, turno }: { productId: number, turno: number }) => {
  // Refresh the orders after a product is marked as prepared
  if (turno === 2) {
    await fetchProfOrders()
    
    classOrders.value = profOrders.value.map(order => ({
      ...order,
      classe: order.classe,
      data: order.data,
      prodotti: Array.isArray(order.prodotti) ? order.prodotti : [],
      confermato: order.confermato,
      oraRitiro: order.oraRitiro,
      preparato: order.preparato,
      userData: order.userData
    }));
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
    classOrders.value = profOrders.value.map(order => ({
      ...order,
      classe: order.classe,
      data: order.data,
      prodotti: Array.isArray(order.prodotti) ? order.prodotti : [],
      confermato: order.confermato,
      oraRitiro: order.oraRitiro,
      preparato: order.preparato,
      userData: order.userData
    }));
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