<template>
  <div 
    class="timeline-order"
    :class="{ 'order-prepared': order.preparato }"
    :style="{ left: `${order.position}%` }"
  >
    <!-- Add time marker that shows exactly where the time point is -->
    <div class="time-marker"></div>
    <div class="order-detail-card">
      <div class="order-header">
        <div class="order-info">
          <span v-if="order.oraRitiro" class="order-time">{{ formatTime(order.oraRitiro) }}</span>
          <span class="order-id">
            {{ getUserDisplayName(order) }}
          </span>
          <span class="order-total">
            {{ formatCurrency(calculateOrderTotal(order)) }}
          </span>
        </div>
      </div>
      <div class="order-products">
        <div v-for="product in order.prodotti" :key="product.idProdotto" class="order-product">
          <span class="product-quantity">x{{ product.quantita }}</span>
          <span class="product-name">{{ product.nome }}</span>
        </div>
      </div>
      <div v-if="order.preparato" class="prepared-badge">Preparato</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatTime, formatCurrency } from '@/utils/timelineUtils'

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
  position: number;
  preparato?: boolean;
}

const props = defineProps<{
  order: Order
}>()

// Calcola il prezzo totale per un ordine
const calculateOrderTotal = (order: Order): number => {
  if (!order.prodotti || !Array.isArray(order.prodotti)) return 0
    return order.prodotti.reduce((total, product) => {
    const price = product.prezzo
    const quantity = product.quantita
    return total + (price * quantity)
  }, 0)
}

// Ottieni il nome di visualizzazione dell'utente dai dati utente o torna alla classe
const getUserDisplayName = (order: Order): string => {
  // Se abbiamo userData, usa il nome dell'utente da quello
  if (order.userData && (order.userData.nome || order.userData.cognome)) {
    return `${order.userData.cognome || ''} ${order.userData.nome || ''}`.trim();
  }
  
  // Fallback alla classe se disponibile
  if (order.classe) {
    return `${order.classe}`;
  }
  
  // Ultima risorsa - mostra l'ID utente se disponibile
  if (order.user) {
    return `#${order.user}`;
  }
    // Se tutto il resto fallisce
  return 'ID ordine: ' + order.idOrdine;
}
</script>

<style scoped>
.timeline-order {
  position: absolute;
  top: 30px;
  /* Remove the transform that was centering the card */
  max-width: 250px;
  padding: 0;
  z-index: 5;
}

.order-prepared {
  opacity: 0.7;
}

.order-prepared .order-detail-card {
  border-left: 3px solid var(--poldo-secondary, #999);
  background-color: rgba(var(--poldo-background-soft-rgb, 245, 245, 245), 0.5);
}

.prepared-badge {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: var(--poldo-secondary, #999);
  color: white;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
}

/* Time marker - vertical line indicating exact position */
.time-marker {
  position: absolute;
  top: -30px; 
  left: 0;
  width: 2px;
  height: 30px; /* Height of the marker line */
  background-color: var(--poldo-primary);
  z-index: 6;
}

.order-detail-card {
  padding: 10px;
  background-color: var(--poldo-background-soft);
  border-radius: 0 8px 8px 0;
  box-shadow: 0 2px 4px var(--card-shadow);
  white-space: normal;
  width: 220px;
  max-height: calc(100% - 45px);
  overflow: auto;
  font-size: 0.85rem;
  border-left: 3px solid var(--poldo-primary);
}

.order-detail-card .order-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  padding-bottom: 5px;
  font-weight: bold;
  border-bottom: 1px solid var(--color-border);
}

.order-detail-card .order-id {
  color: var(--poldo-primary);
  font-size: 0.9rem;
}

.order-detail-card .order-time {
  font-size: 0.9rem;
  padding: 2px 4px;
  border-radius: 4px;
}

.order-detail-card .order-products {
  margin: 0 0 8px 0;
  max-height: 120px;
  overflow-y: auto;
  border-radius: 4px;
  padding: 2px;
}

.order-detail-card .order-product {
  padding: 4px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--color-border-light, #eee);
}

.order-detail-card .order-product:last-child {
  border-bottom: none;
}

.order-detail-card .product-quantity {
  font-weight: bold;
  color: var(--poldo-primary);
  margin-right: 8px;
}

.order-detail-card .product-name {
  font-size: 0.85rem;
  white-space: normal;
  word-break: break-word;
}

.order-detail-card .order-total {
  font-size: 0.9rem;
  color: var(--poldo-accent);
}
</style>
