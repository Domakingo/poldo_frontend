<template>
  <div class="class-orders">
    <h3>{{ orderTypeTitle }}</h3>
    <div v-if="!classOrders || classOrders.length === 0" class="no-data">
      Nessun ordine da visualizzare
    </div>
    <div v-else class="class-list">
      <div
        v-for="order in sortedClassOrders"
        :key="order.classe || 'unknown'"
        class="card-wrapper"
      >
        <div
          class="custom-card"
          :class="{'prepared-card': order.preparato}"
        >
          <h4>
            <span v-if="selectedTurno === 2">
              Prof. {{ order.classe }}
            </span>
            <span v-else>
              Classe {{ order.classe }}
            </span>
          </h4>
          <div v-if="order.oraRitiro && order.confermato" class="class-order-pickup">
            <span class="pickup-time">Ritiro: {{ formatTime(order.oraRitiro) }}</span>
          </div>
          <div class="class-products">
            <div v-if="!order.prodotti || order.prodotti.length === 0" class="no-products">
              Nessun prodotto ordinato
            </div>
            <template v-else>              <div 
                v-for="product in order.prodotti" 
                :key="product.idProdotto || generateKey(product)" 
                class="class-product"
                :class="{'product-prepared': !!product.preparato}"
              >
                <span>{{ product.nome }}</span>
                <div class="product-info">
                  <span>x{{ product.quantita }}</span>                  <span v-if="!!product.preparato" class="product-status prepared">✓</span>
                  <span v-else class="product-status">⏳</span>
                </div>
              </div>
            </template>
          </div>
          <div v-if="order.preparato" class="prepared-badge">Preparato</div>
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useTurnoStore } from '@/stores/turno'
import { useOrdiniStore } from '@/stores/Gestione/ordini'
import { API_CONFIG } from '@/utils/api'

const turnoStore = useTurnoStore()
const ordiniStore = useOrdiniStore()

interface Product {
  idProdotto?: number;
  nome?: string;
  quantita?: number;
  prezzo?: number;
  preparato?: boolean;
}

interface ClassOrder {
  classe?: string;
  classeId?: number;
  prodotti?: Product[];
  oraRitiro?: string;
  confermato?: boolean;
  preparato?: boolean;
}

const props = defineProps({
  classOrders: {
    type: Array as () => ClassOrder[],
    required: true
  },
  selectedTurno: {
    type: Number,
    required: true
  }
})

let keyCounter = 0
const generateKey = (item: any): string => {
  return `item_${keyCounter++}_${Date.now()}`
}

const safeClassOrders = computed<ClassOrder[]>(() => {
  if (!Array.isArray(props.classOrders)) {
    return []
  }

  return props.classOrders.filter(order => order && typeof order === 'object').map(order => {
    const prodotti = Array.isArray(order.prodotti)
      ? order.prodotti.filter(p => p && typeof p === 'object')
      : []

    return {
      ...order,
      classe: order.classe,
      classeId: order.classeId,
      oraRitiro: order.oraRitiro,
      confermato: order.confermato,
      preparato: order.preparato,
      prodotti
    }
  })
})

// Sort class orders - unprepared first, then prepared (to push prepared orders to the bottom)
const sortedClassOrders = computed<ClassOrder[]>(() => {
  return [...safeClassOrders.value].sort((a, b) => {
    // If one is prepared and the other is not, the unprepared one comes first
    if (a.preparato !== b.preparato) {
      return a.preparato ? 1 : -1; // Push prepared to the bottom
    }
    // If both have the same prepared status, sort by class name
    return (a.classe || '').localeCompare(b.classe || '');
  });
})

const formatTime = (time?: string): string => {
  if (!time) return ''

  if (time.includes(':')) {
    const parts = time.split(':')
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`
    }
  }

  return time
}

const orderTypeTitle = computed(() => {
  const turno = turnoStore.turni.find(t => t.n === props.selectedTurno)

  if (turno && turno.nome) {
    return `Ordini ${turno.nome}`
  }

  if (props.selectedTurno === 2) {
    return 'Ordini Professori'
  }

  return 'Ordini per Classe'
})

const emit = defineEmits(['orderMarkedAsPrepared'])

// Function to mark an order as prepared
const markOrderAsPrepared = async (order: ClassOrder) => {
  if (!order.classe || !order.classeId) {
    return
  }
  
  try {    
    // Use direct fetch with the correct endpoint 
    const url = `${API_CONFIG.BASE_URL}/ordini/classi/${order.classeId}/turno/${props.selectedTurno}/prepara`;
    
    const response = await fetch(url, {
      method: 'PUT',
      credentials: 'include',
      mode: 'cors'
    });
    
    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Errore API: ${response.status} ${response.statusText}`);
    }    // Notify parent component that the order was marked as prepared
    emit('orderMarkedAsPrepared', { 
      classe: order.classe, 
      classeId: order.classeId, 
      turno: props.selectedTurno 
    });
  } catch (error) {
    alert('Errore nel marcare l\'ordine come preparato. Riprova.')
  }
}

// Call on mount
onMounted(() => {
  // Initialize any needed functionality
});
</script>

<style scoped>
.class-orders {
  width: 70vw;
  padding-left: 20px;
  border-left: 1px solid var(--color-border);
  overflow-y: auto;
  height: 100%;
}

h3 {
  margin-bottom: 15px;
  color: var(--poldo-primary);
  font-size: 1.2rem;
}

.no-data {
  text-align: center;
  padding: 20px;
  color: var(--poldo-text);
}

.class-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.card-wrapper {
  width: calc(50% - 15px);
  position: relative;
}

/* Style for our custom card that replaces the Card component */
.custom-card {
  width: 100%;
  padding: 20px;
  border-radius: 20px;
  background-color: var(--card-bg, white);
  color: var(--card-text, #333);
  box-shadow: 0 2px 8px var(--card-shadow, rgba(0, 0, 0, 0.1));
  position: relative;
}

.custom-card h4 {
  font-size: 1.1rem;
  font-weight: bolder;
  color: var(--poldo-primary);
}

/* Style for prepared cards */
.prepared-card {
  opacity: 0.7;
  background-color: rgba(var(--poldo-background-soft-rgb, 245, 245, 245), 0.5) !important;
  border-left: 4px solid var(--poldo-secondary, #4CAF50) !important;
  position: relative;
}

.prepared-card::after {
  content: '✓';
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  background-color: var(--poldo-secondary, #4CAF50);
  color: white;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.class-products {
  margin-top: 10px;
}

.class-product {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  padding-bottom: 5px;
  border-bottom: 1px solid var(--color-border);
}

.class-product:last-child {
  border-bottom: none;
}

.class-order-pickup {
  margin: 5px 0 10px;
  font-size: 0.9rem;
  color: var(--poldo-primary);
  font-weight: 500;
}

.pickup-time {
  display: inline-block;
  padding: 3px 8px;
  background-color: var(--poldo-background-soft);
  border-radius: 4px;
}

.no-products {
  font-style: italic;
  color: var(--poldo-text);
  opacity: 0.7;
  padding: 5px 0;
}

.prepared-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: var(--poldo-secondary, #999);
  color: white;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  z-index: 10;
}

.mark-prepared-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 36px;
  height: 36px;
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

/* New styles for prepared products */
.product-prepared {
  opacity: 0.7;
  text-decoration: line-through;
  color: var(--poldo-text-muted, #777);
}

.product-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.product-status {
  display: inline-block;
  width: 20px;
  height: 20px;
  text-align: center;
  line-height: 20px;
  border-radius: 50%;
  font-size: 12px;
}

.product-status.prepared {
  background-color: var(--poldo-secondary, #4CAF50);
  color: white;
}

@media (max-width: 768px) {
  .class-orders {
    border-left: none;
    border-top: 1px solid var(--color-border);
    padding-top: 20px;
    padding-left: 0;
  }

  .card-wrapper {
    width: 100%;
  }
}
</style>
