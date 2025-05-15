<template>
  <div 
    class="timeline-section" 
    :class="{ 'detail-view': isDetailView }"
    @click="!isDetailView && handleTimelineClick()"
  >
    <!-- Reload button -->
    <button @click.stop="$emit('reload')" class="reload-btn">
      <svg class="reload-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M23 4v6h-6"></path>
        <path d="M1 20v-6h6"></path>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
        <path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
      </svg>
    </button>
    
    <div class="timeline-header">
      <div class="timeline-header-actions">
        <!-- Header actions if needed -->
      </div>
    </div>
    
    <div v-if="profOrders.length === 0" class="no-data">
      Nessun ordine da visualizzare sulla timeline
    </div>
    
    <div v-else-if="!timelineProfOrders || timelineProfOrders.length === 0" class="no-data">
      <p>Ci sono {{ profOrders.length }} ordini di professori, ma nessuno con orario di ritiro valido.</p>
    </div>
    
    <div v-else class="timeline-container" ref="timelineRef">
      <div class="timeline-wrapper">
        <TimelineSlots />

        <div class="timeline-orders">
          <TimelineOrderCard 
            v-for="order in timelineProfOrders" 
            :key="order.idOrdine"
            :order="order" 
          />
        </div>

        <TimeIndicator :current-time="currentTime" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import TimelineOrderCard from './TimelineOrderCard.vue'
import TimelineSlots from './TimelineSlots.vue'
import TimeIndicator from './TimeIndicator.vue'
import { formatTime } from '@/utils/timelineUtils'
import { calculateTimePosition } from '@/utils/timelineUtils'
import { useRouter } from 'vue-router'

// Definisce le interfacce per il componente
interface Product {
  idProdotto: number;
  nome: string;
  quantita: number;
  prezzo: number;
}

interface Order {
  idOrdine: number;
  user?: number;
  classe?: string;
  oraRitiro?: string;
  prodotti: Product[];
  userData?: any;
  preparato?: boolean;
}

interface TurnoTimes {
  orderStart: string;
  orderEnd: string;
  pickupStart: string;
  pickupEnd: string;
}

interface TimelineOrder extends Order {
  position: number;
}

// Definisce le props con tipi appropriati
const props = defineProps({
  profOrders: {
    type: Array as () => Order[],
    required: true
  },
  turnoTimes: {    type: Object as () => TurnoTimes | null,
    required: true
  },
  isDetailView: {
    type: Boolean,
    default: false
  }
})

// Definisce gli eventi emessi
const emit = defineEmits(['reload'])

// Gestione dell'ora corrente
const currentTime = ref(new Date())
const timelineRef = ref<HTMLElement | null>(null)
let timeUpdateInterval: number | undefined

// Funzione per aggiornare l'ora corrente
const updateCurrentTime = () => {
  currentTime.value = new Date()
}

// Organizza gli ordini dei professori per orario
const timelineProfOrders = computed<TimelineOrder[]>(() => { 
  if (!Array.isArray(props.profOrders)) {
    console.warn("profOrders non è un array");
    return [];
  }
  
  if (props.profOrders.length === 0) {
    console.warn("Nessun ordine di professori da visualizzare");
    return [];
  }
  
  // Filtra gli ordini solo per quelli con oraRitiro
  const ordersWithRitiro = props.profOrders.filter(order => 
    order && typeof order === 'object' && order.oraRitiro !== undefined && order.oraRitiro !== null
  );
  
  if (ordersWithRitiro.length === 0) {
    console.warn("Nessun ordine con ritiro trovato");
    return [];
  }
  
  // Map orders to timeline orders with position
  const mappedOrders = ordersWithRitiro.map(order => {
    try {
      // Usa l'orario di ritiro dell'ordine
      const pickupTime = formatTime(order.oraRitiro || '');
      
      // Calcola la posizione usando il modulo di utilità
      const position = calculateTimePosition(pickupTime);
      
      if (isNaN(position) || position < 0 || position > 100) {
        console.error(`Posizione non valida per l'ordine ${order.idOrdine}:`, position);
        // Prova a recuperare con una posizione predefinita nell'intervallo visibile
        return {
          ...order,
          position: 50 // Posiziona al centro della timeline
        };
      }
      
      return {
        ...order,
        position: position
      };
    } catch (error) {
      console.error('Errore nell\'elaborazione dell\'ordine:', error, order);
      // Restituisci una posizione predefinita se c'è un errore
      return {
        ...order,
        position: 50 // Posiziona al centro della timeline se c'è un errore
      };
    }
  });
  
  // Sort orders - unprepared first, then prepared (to push prepared orders to the bottom)
  return mappedOrders.sort((a, b) => {
    // If one is prepared and the other is not, the unprepared one comes first
    if (a.preparato !== b.preparato) {
      return a.preparato ? 1 : -1; // Push prepared to the bottom
    }
    return 0; // Keep original order if preparation status is the same
  });
});

// Router for navigation
const router = useRouter();

// Handle click on timeline to navigate to the specialized view
const handleTimelineClick = () => {
  router.push('/gestione/ordinazioni/prof');
};

onMounted(() => {
  // Imposta un timer per aggiornare l'ora corrente
  updateCurrentTime();
  timeUpdateInterval = window.setInterval(updateCurrentTime, 30000); // Aggiorna ogni 30 secondi
  
  // Scorri la timeline in modo che il tempo corrente sia al 20% della viewport
  const scrollToPositionCurrent = () => {
    if (timelineRef.value) {
      const timelineWidth = timelineRef.value.scrollWidth;
      const viewportWidth = timelineRef.value.clientWidth;
      
      // Calcola la posizione di scorrimento in modo che l'ora corrente sia al 20% della viewport
      const currentPosition = calculateTimePosition(`${currentTime.value.getHours()}:${currentTime.value.getMinutes()}`);
      const scrollPosition = (currentPosition / 100 * timelineWidth) - (viewportWidth * 0.2);
      timelineRef.value.scrollLeft = Math.max(0, scrollPosition);
    }
  };
  
  // Scorri inizialmente e ogni volta che cambia l'ora corrente
  setTimeout(scrollToPositionCurrent, 500); // Piccolo ritardo per assicurarsi che il DOM sia pronto
  
  // Aggiorna anche la posizione di scorrimento quando cambia l'ora (ogni 30 secondi)
  window.setInterval(scrollToPositionCurrent, 30000);
});

onUnmounted(() => {
  // Cancella l'intervallo quando il componente viene smontato
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval);
  }
});
</script>

<style scoped>
.timeline-section {
  height: 20vh; 
  max-height: 300px;
  min-height: 200px;
  margin-bottom: 20px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background-color: var(--card-bg);
  box-shadow: 0 2px 8px var(--card-shadow);
  flex-shrink: 0; /* Prevent timeline from shrinking when space is tight */
  display: flex;
  flex-direction: column;
  position: relative; /* Added to position the reload button */
  cursor: pointer; /* Shows that it's clickable */
  transition: transform 0.2s, box-shadow 0.2s; /* Smooth transition for hover effect */
}

.timeline-section:hover {
  transform: scale(1.02); /* Grows slightly bigger */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.timeline-section h2 {
  margin-top: 0;
  font-size: 1.4rem;
  color: var(--poldo-primary);
}

.no-data {
  text-align: center;
  padding: 20px;
  color: var(--poldo-text);
}

.timeline-container {
  position: relative;
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  background-color: var(--card-bg);
  border-radius: 4px;
  scrollbar-width: thin;
  scrollbar-color: var(--poldo-primary) var(--card-bg);;
}

.timeline-container::-webkit-scrollbar {
  height: 8px;
}

.timeline-container::-webkit-scrollbar-track {
  background: var(--poldo-background-soft);
  border-radius: 4px;
}

.timeline-container::-webkit-scrollbar-thumb {
  background-color: var(--poldo-primary);
  border-radius: 4px;
}

.timeline-wrapper {
  position: relative;
  min-width: 4800px; /* 4x larger than before (1200px × 4) */
  height: 100%;
}

/* Orders on timeline */
.timeline-orders {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: calc(100% - 25px);
  padding-top: 25px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.timeline-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Updated reload button styles */
.reload-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 40px;
  height: 40px;
  border-radius: 50%; /* Makes button round */
  background-color: var(--poldo-accent, #2196F3);
  color: white;
  border: none;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10; /* Ensures button stays above other elements */
  transition: background-color 0.3s, transform 0.2s;
  padding: 0; /* Remove padding for the icon */
}

.reload-btn:hover {
  background-color: var(--poldo-primary);
  transform: scale(1.05);
}

.reload-btn:active {
  transform: scale(0.95);
}

.reload-icon {
  width: 24px;
  height: 24px;
  color: white;
}

/* Animation for reload icon when clicked */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.reload-btn:active .reload-icon {
  animation: spin 0.8s ease-in-out;
}

@media (max-width: 768px) {
  .timeline-section {
    min-height: 180px;
  }
}

/* Styles for detail view mode */
.timeline-section.detail-view {
  cursor: default;
  transition: none;
  background-color: var(--card-bg);
}

.timeline-section.detail-view:hover {
  transform: none;
  box-shadow: 0 2px 8px var(--card-shadow);
}
</style>
