<template>
  <div class="ordinazioni-prof-view">    
    <!-- Loading and error handling -->
    <div v-if="loading" class="loading-indicator">
      <p>Caricamento ordinazioni...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="fetchOrders">Riprova</button>
    </div>
    
    <div v-else-if="professorOrders.length === 0" class="no-data">
      <p>Nessun ordine dei professori trovato per la data selezionata.</p>
    </div>
    
    <div v-else>      <!-- Timeline section (40% height) -->      <div class="timeline-container">
        <ProfessorTimeline 
          :profOrders="professorOrders" 
          :turnoTimes="turnoTimes"
          :isDetailView="true"
          @reload="fetchOrders" 
        />
      </div>
      
      <!-- Horizontal line separator -->
      <hr class="section-divider">
      
      <!-- Controls for time range selection -->
      <div class="timerange-controls">
        <div class="time-selector">
          <label for="start-time">Dalle ore:</label>
          <input 
            type="time" 
            id="start-time" 
            v-model="startTime" 
            @change="updateTimerange"
          />
        </div>
        <div class="time-selector">
          <label for="end-time">Alle ore:</label>
          <input 
            type="time" 
            id="end-time" 
            v-model="endTime" 
            @change="updateTimerange"
          />
        </div>
        <button class="apply-btn" @click="applyTimeFilter">Applica</button>
      </div>
      
      <!-- Bottom section (60% height) -->
      <div class="content-container">
        <!-- Product totals (left) -->
          <ProductTotals 
            :classOrders="filteredOrders"
          />
        
        <!-- Orders list (right) -->
        <div class="orders-list">
          <h2>Lista Ordini</h2>
          <div v-if="filteredOrders.length === 0" class="no-orders">
            Nessun ordine nel periodo selezionato
          </div>
          <div v-else class="orders-container">
            <div 
              v-for="order in filteredOrders" 
              :key="order.idOrdine" 
              class="order-item"
              :class="{ 'order-prepared': order.preparato }"
            >
              <div class="order-header">
                <div class="order-user">{{ getOrderUserName(order) }}</div>
                <div v-if="order.oraRitiro" class="order-time">
                  Ritiro: {{ formatTime(order.oraRitiro) }}
                </div>
                
                <button 
                  v-if="!order.preparato" 
                  class="mark-prepared-btn"
                  @click="markOrderAsPrepared(order)"
                  title="Segna come preparato"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </button>
                
                <div v-if="order.preparato" class="prepared-badge">Preparato</div>
              </div>
              
              <div class="order-products">
                <div 
                  v-for="product in order.prodotti" 
                  :key="product.idProdotto" 
                  class="order-product"
                >
                  <span class="product-quantity">x{{ product.quantita }}</span>
                  <span class="product-name">{{ product.nome }}</span>
                  <span class="product-price">{{ formatCurrency(product.prezzo * product.quantita) }}</span>
                </div>
              </div>
              <div class="order-total">
                Totale: {{ formatCurrency(calculateOrderTotal(order)) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ProfessorTimeline from '@/components/Gestione/ProfessorTimeline.vue'
import ProductTotals from '@/components/Gestione/ProductTotals.vue'
import { formatTime, formatCurrency, timeToMinutes } from '@/utils/timelineUtils'
import { useTurnoStore } from '@/stores/turno'

// Store
const turnoStore = useTurnoStore()

// // API configurazione
// const API_CONFIG = {
//   BASE_URL: 'http://figliolo.it:5005/v1',
//   TOKEN: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDgsInJ1b2xvIjoiYWRtaW4iLCJpYXQiOjE3NDQyNzk2ODMsImV4cCI6MTc3NTgzNzI4M30.AelK6BkvrydKSqNGuXbzWGzST4yctrHvdjy66XeoMHI"
// }
// API configurazione
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

interface Product {
  idProdotto: number;
  nome: string;
  quantita: number;
  prezzo: number;
}

// ClassOrder type needed for ProductTotals component
interface ClassOrder {
  classe: string;
  prodotti: Product[];
  idOrdine?: number;
  data?: string;
  user?: number;
  oraRitiro?: string;
  userData?: any;
  confermato?: boolean;
  preparato?: boolean;
  userRole?: string;
}

interface Order {
  idOrdine: number;
  data: string;
  nTurno?: number;
  giorno?: string;
  user?: number;
  classe: string; // Make classe required
  oraRitiro?: string;
  prodotti: Product[];
  userData?: any;
  confermato?: boolean;
  preparato?: boolean;
  userRole?: string;
}

// State
const allOrders = ref<Order[]>([])
const professorOrders = ref<Order[]>([])
const loading = ref(false)
const error = ref('')

// Cache utenti
const userCache = ref<{[key: number]: any}>({});

// Formattazione data
const formatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
const selectedDate = ref(formatDate(new Date()))

// Fetch user data by ID
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

// Fetch all orders
const fetchOrders = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const url = `${API_CONFIG.BASE_URL}/ordini?startDate=${selectedDate.value}&endDate=${selectedDate.value}`;
    const response = await fetch(url, { headers })
    
    if (!response.ok) throw new Error(`Errore API con stato ${response.status}`)
    const data = await response.json()
    
    allOrders.value = data
    
    // Filtra gli ordini dei professori (quelli con oraRitiro)
    const professorOrdersData = data.filter((order: any) => order.oraRitiro !== null && order.oraRitiro !== undefined);
    const processedOrders = [];
    
    for (const order of professorOrdersData) {
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
    
    professorOrders.value = processedOrders;
    
  } catch (err) {
    error.value = 'Errore nel caricamento degli ordini'
    console.error(err)
    professorOrders.value = []
  } finally {
    loading.value = false
  }
}

// Time range for filtering based on oraRitiro
const startTime = ref('') // Will be set based on turno store data
const endTime = ref('')   // Will be set based on turno store data
const filterApplied = ref(false)

// Turno times from the store
const turnoTimes = computed(() => {  
  // For professor orders, we need a wider range that spans all turni
  const allTurni = turnoStore.turni;
  
  // Find the earliest start and latest end times across all turni
  const orderStart = allTurni.reduce((earliest, turno) => {
    const currentTime = timeToMinutes(turno.oraInizio);
    const earliestTime = timeToMinutes(earliest);
    return currentTime < earliestTime ? turno.oraInizio : earliest;
  }, '23:59');
  
  const orderEnd = allTurni.reduce((latest, turno) => {
    const currentTime = timeToMinutes(turno.oraFine);
    const latestTime = timeToMinutes(latest);
    return currentTime > latestTime ? turno.oraFine : latest;
  }, '00:00');
  
  const pickupStart = allTurni.reduce((earliest, turno) => {
    const currentTime = timeToMinutes(turno.inizioRitiro);
    const earliestTime = timeToMinutes(earliest);
    return currentTime < earliestTime ? turno.inizioRitiro : earliest;
  }, '23:59');
  
  const pickupEnd = allTurni.reduce((latest, turno) => {
    const currentTime = timeToMinutes(turno.fineRitiro);
    const latestTime = timeToMinutes(latest);
    return currentTime > latestTime ? turno.fineRitiro : latest;
  }, '00:00');
  
  return {
    orderStart,
    orderEnd, 
    pickupStart,
    pickupEnd
  };
})
const filteredOrders = computed<ClassOrder[]>(() => {
  let orders = professorOrders.value;
  
  if (filterApplied.value) {
    // Convert the start/end times to minutes for comparison
    const startMinutes = timeToMinutes(startTime.value)
    const endMinutes = timeToMinutes(endTime.value)
    
    orders = orders.filter(order => {
      if (!order.oraRitiro) return false
      
      // Convert the order's pickup time to minutes
      const pickupTime = formatTime(order.oraRitiro)
      const pickupMinutes = timeToMinutes(pickupTime)
      
      // Check if pickup time is within the range
      return pickupMinutes >= startMinutes && pickupMinutes <= endMinutes
    });
  }
  
  // Sort orders - unprepared first, then prepared (to push prepared orders to the bottom)
  return orders.sort((a, b) => {
    // If one is prepared and the other is not, the unprepared one comes first
    if (a.preparato !== b.preparato) {
      return a.preparato ? 1 : -1; // Push prepared to the bottom
    }
    
    // If both have the same prepared status, sort by pickup time
    if (a.oraRitiro && b.oraRitiro) {
      const timeA = timeToMinutes(formatTime(a.oraRitiro));
      const timeB = timeToMinutes(formatTime(b.oraRitiro));
      return timeA - timeB; // Sort by time ascending
    }
    
    return 0;
  });
})

// Update time range
const updateTimerange = () => {
  // Validate times
  const startMinutes = timeToMinutes(startTime.value)
  const endMinutes = timeToMinutes(endTime.value)
  
  if (startMinutes > endMinutes) {
    // If start time is after end time, reset end time to be 2 hours after start
    const newEndHour = Math.min(23, Math.floor(startMinutes / 60) + 2)
    endTime.value = `${String(newEndHour).padStart(2, '0')}:00`
  }
}

// Apply the time filter
const applyTimeFilter = () => {
  filterApplied.value = true
}

// Display user name
const getOrderUserName = (order: Order | ClassOrder): string => {
  if (order.userData && (order.userData.nome || order.userData.cognome)) {
    return `${order.userData.cognome || ''} ${order.userData.nome || ''}`.trim()
  }
  return `Utente #${order.user || 'N/A'}`
}

// Calculate order total
const calculateOrderTotal = (order: Order | ClassOrder): number => {
  if (!order.prodotti || !Array.isArray(order.prodotti)) return 0
  
  return order.prodotti.reduce((total, product) => {
    const price = product.prezzo || 0
    const quantity = product.quantita || 0
    return total + (price * quantity)
  }, 0)
}

// Function to mark an order as prepared
const markOrderAsPrepared = async (order: ClassOrder) => {
  try {
    if (!order.classe) {
      console.error('Impossibile contrassegnare l\'ordine: classe mancante')
      return
    }
    
    if (!order.idOrdine) {
      console.error('Impossibile contrassegnare l\'ordine: ID ordine mancante')
      return
    }
    
    const API_CONFIG = {
      BASE_URL: 'http://figliolo.it:5005/v1',
      TOKEN: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDgsInJ1b2xvIjoiYWRtaW4iLCJpYXQiOjE3NDQyNzk2ODMsImV4cCI6MTc3NTgzNzI4M30.AelK6BkvrydKSqNGuXbzWGzST4yctrHvdjy66XeoMHI"
    }
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/ordini/classi/${order.classe}/turno/2/prepara`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${API_CONFIG.TOKEN}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Errore API con stato ${response.status}`)
    }
    
    // Refresh the orders after marking as prepared
    await fetchOrders()
  } catch (error) {
    console.error('Errore nel marcare l\'ordine come preparato:', error)
    alert('Errore nel marcare l\'ordine come preparato. Riprova.')
  }
}

// Fetch orders on component mount
onMounted(async () => {
  // First fetch the turni data if not already loaded
  if (turnoStore.turni.length === 0) {
    await turnoStore.fetchTurni()
  }
  
  // Set initial time range values based on turno data
  if (turnoStore.turni.length > 0) {
    const times = turnoTimes.value;
    startTime.value = times.pickupStart;
    endTime.value = times.pickupEnd;
  } else {
    // Fallback default values if no turno data is available
    startTime.value = '08:00';
    endTime.value = '15:00';
  }
  
  // Then fetch orders
  await fetchOrders()
})
</script>

<style scoped>
.ordinazioni-prof-view {
  padding: 20px;
  height: calc(100vh - 100px); 
  display: flex;
  flex-direction: column;
  overflow: hidden; 
}

h1 {
  margin-bottom: 15px;
  color: var(--poldo-primary);
}

h2 {
  margin-bottom: 10px;
  font-size: 1.2rem;
  color: var(--poldo-primary);
}

.timeline-container {
  max-height: 30vh; 
  margin-bottom: 15px;
}

.section-divider {
  border: 0;
  height: 1px;
  background-color: var(--poldo-primary);
  margin: 0 0 5px 0;
}

.loading-indicator,
.error-message,
.no-data {
  text-align: center;
  padding: 20px;
  margin: 20px 0;
  background-color: var(--poldo-background-soft);
  border-radius: 8px;
  color: var(--poldo-text);
}

.error-message {
  color: var(--poldo-red);
}

.error-message button {
  margin-top: 10px;
  padding: 6px 12px;
  background-color: var(--poldo-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.error-message button:hover {
  background-color: var(--poldo-primary-dark, #0056b3);
}

.date-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.date-selector label {
  font-weight: bold;
  color: var(--poldo-text);
}

.date-selector input {
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--card-bg);
  color: var(--poldo-text);
}

.timerange-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 5px;
}

.time-selector {
  display: flex;
  align-items: center;
  gap: 5px;
}

.time-selector label {
  font-weight: bold;
  color: var(--poldo-text);
}

.time-selector input {
  padding: 5px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

.apply-btn {
  padding: 5px 15px;
  background-color: var(--poldo-accent);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.apply-btn:hover {
  background-color: var(--poldo-primary);
}

.content-container {
  display: grid;
  grid-template-columns: minmax(250px, 1fr) minmax(500px, 2fr);
  flex: 1;
  overflow: hidden;
  max-height: 100%;
  height: 50vh;
  gap: 15px;
}

.products-totals, .orders-list {
  background-color: var(--poldo-background);
  padding: 15px;
  overflow-y: auto;
  max-height: 100%;
}

.orders-list {
  width: 100%;
}

.no-orders {
  text-align: center;
  padding: 20px;
  color: var(--poldo-text);
  font-style: italic;
}

.orders-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
}

.order-item {
  background-color: var(--poldo-background-soft);
  border-radius: 6px;
  padding: 10px;
  border-left: 4px solid var(--poldo-primary);
  height: fit-content;
  position: relative;
}

.order-prepared {
  background-color: rgba(var(--poldo-background-soft-rgb, 245, 245, 245), 0.5);
  opacity: 0.8;
  border-left: 4px solid var(--poldo-secondary, #999);
}

.prepared-badge {
  background-color: var(--poldo-secondary, #999);
  color: white;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-weight: bold;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 5px;
  flex-wrap: wrap;
  gap: 8px;
}

.order-user {
  color: var(--poldo-primary);
  margin-right: auto;
}

.order-time {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.85rem;
  margin-right: 10px;
}

.order-products {
  margin-bottom: 10px;
}

.order-product {
  display: flex;
  padding: 5px 0;
  font-size: 0.9rem;
  align-items: center;
  flex-wrap: wrap;
}

.product-quantity {
  font-weight: bold;
  color: var(--poldo-primary);
  margin-right: 10px;
  min-width: 30px;
}

.product-name {
  flex: 1;
  min-width: 150px;
}

.product-price {
  font-weight: bold;
  color: var(--poldo-accent);
}

.order-total {
  text-align: right;
  font-weight: bold;
  margin-top: 5px;
  color: var(--poldo-accent);
  padding: 5px;
  border-radius: 4px;
}

.mark-prepared-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--poldo-primary, #4caf50);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  padding: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;
  flex-shrink: 0;
}

.mark-prepared-btn:hover {
  background-color: var(--poldo-primary-dark, #388e3c);
  transform: scale(1.05);
}

.mark-prepared-btn:active {
  transform: scale(0.95);
}

.mark-prepared-btn svg {
  width: 18px;
  height: 18px;
}

/* Modifica questa sezione */
.timerange-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px;
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--card-shadow);
  margin: 10px 0;
}

.time-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-selector label {
  font-weight: 500;
  color: var(--poldo-text);
  font-size: 0.9rem;
}

.time-selector input {
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background-color: var(--color-background);
  color: var(--poldo-text);
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.time-selector input:focus {
  outline: none;
  border-color: var(--poldo-primary);
  box-shadow: 0 0 0 2px rgba(239, 194, 12, 0.2);
}

.apply-btn {
  padding: 8px 20px;
  background-color: var(--poldo-primary);
  color: var(--poldo-background);
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.apply-btn:hover {
  background-color: var(--poldo-accent);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(239, 194, 12, 0.3);
}

.apply-btn:active {
  transform: translateY(0);
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .content-container {
    grid-template-columns: minmax(250px, 1fr) minmax(400px, 2fr);
  }
  
  .orders-container {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}

@media (max-width: 900px) {
  .content-container {
    grid-template-columns: 1fr;
  }
  
  .products-totals {
    margin-bottom: 15px;
  }
  
  .orders-container {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
}

@media (max-width: 600px) {
  .orders-container {
    grid-template-columns: 1fr;
  }
}
</style>
