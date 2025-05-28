<template>
  <div class="product-totals">
    <h3>Totali Prodotti</h3>
    <div v-if="uniqueProducts.length === 0" class="no-data">
      Nessun prodotto da visualizzare
    </div>
    <div v-else class="product-list">
      <!-- Unprepared products first -->
      <div
        v-for="product in sortedProducts"
        :key="product.idProdotto"
        class="product-item"
        :class="{ 'product-prepared': isProductFullyPrepared(product.idProdotto) }"
      >
        <div class="product-name">{{ product.nome }}</div>
        <div class="product-quantity">
          <template v-if="isProductFullyPrepared(product.idProdotto)">
            {{ getTotalQuantity(product.idProdotto) }}
          </template>
          <template v-else>
            {{ getPreparedQuantity(product.idProdotto) }}/{{ getTotalQuantity(product.idProdotto) }}
          </template>
        </div>        <button          v-if="!isProductFullyPrepared(product.idProdotto)"
          class="mark-prepared-btn"
          @click="markProductPrepared(product.idProdotto)"
          title="Segna come preparato"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useOrdiniStore } from '@/stores/Gestione/ordini'

const ordiniStore = useOrdiniStore()

interface Product {
  idProdotto: number;
  nome: string;
  quantita: number;
  prezzo: number;
  preparato?: boolean;
  quantitaOrdinata?: number;
  tuttiPreparati?: boolean;
  quantitaPreparata?: number;
}

interface ClassOrder {
  classe: string;
  prodotti: Product[];
  preparato?: boolean;
}

const props = defineProps({
  classOrders: {
    type: Array as () => ClassOrder[],
    required: true
  },
  currentTurno: {
    type: Number,
    default: 1
  }
})

const uniqueProducts = computed<Product[]>(() => {
  // Always use the filtered orders from props instead of API data
  const products = new Map()
  if (!Array.isArray(props.classOrders)) {
    return []
  }

  props.classOrders.forEach(order => {
    if (!order || !Array.isArray(order.prodotti)) {
      return
    }

    order.prodotti.forEach(product => {
      if (product.idProdotto === undefined) {
        return
      }
      
      if (!products.has(product.idProdotto)) {        
        products.set(product.idProdotto, {
          idProdotto: product.idProdotto,
          nome: product.nome,
          quantita: product.quantita || 0,
          prezzo: product.prezzo,
          preparato: product.preparato || false,
          quantitaOrdinata: product.quantita || 0,
          tuttiPreparati: product.preparato || false,
          quantitaPreparata: product.preparato ? (product.quantita || 0) : 0
        })
      } else {
        // If product already exists, aggregate the quantities
        const existingProduct = products.get(product.idProdotto)
        existingProduct.quantita += product.quantita || 0
        existingProduct.quantitaOrdinata += product.quantita || 0
        if (product.preparato) {
          existingProduct.quantitaPreparata += product.quantita || 0
        }
        existingProduct.tuttiPreparati = existingProduct.quantitaOrdinata === existingProduct.quantitaPreparata
        existingProduct.preparato = existingProduct.tuttiPreparati
      }
    })
  })

  return Array.from(products.values())
})

// Sort products - unprepared first, then fully prepared
const sortedProducts = computed(() => {
  return [...uniqueProducts.value].sort((a, b) => {
    const aFullyPrepared = isProductFullyPrepared(a.idProdotto);
    const bFullyPrepared = isProductFullyPrepared(b.idProdotto);

    if (aFullyPrepared !== bFullyPrepared) {
      return aFullyPrepared ? 1 : -1; // Push prepared to the bottom
    }

    // If both have the same prepared status, sort by name
    const nameA = a.nome || '';
    const nameB = b.nome || '';
    return nameA.localeCompare(nameB);
  });
})

const getTotalQuantity = (productId: number): number => {
  // Ensure productId is valid
  if (productId === undefined || productId === null) {
    return 0;
  }

  // Always use the filtered orders from props to respect time filtering
  if (!Array.isArray(props.classOrders)) {
    return 0
  }

  return props.classOrders.reduce((total, order) => {
    if (!order || !Array.isArray(order.prodotti)) {
      return total
    }

    const product = order.prodotti.find(p => p.idProdotto === productId)
    const quantity = product && typeof product.quantita === 'number' ? product.quantita : 0

    return total + quantity
  }, 0)
}

const getPreparedQuantity = (productId: number): number => {
  // Ensure productId is valid
  if (productId === undefined || productId === null) {
    return 0;
  }
  
  // Always use the filtered orders from props to respect time filtering
  if (!Array.isArray(props.classOrders)) {
    return 0
  }

  return props.classOrders.reduce((total, order) => {
    if (!order || !Array.isArray(order.prodotti)) {
      return total
    }

    const product = order.prodotti.find(p => p.idProdotto === productId)

    // Consider the product prepared if the whole order is prepared or if the product itself is marked as prepared
    if (product && typeof product.quantita === 'number') {
      if (order.preparato || product.preparato) {
        return total + product.quantita
      }
    }

    return total
  }, 0)
}

const isProductFullyPrepared = (productId: number): boolean => {
  // Ensure productId is valid
  if (productId === undefined || productId === null) {
    return false;
  }

  // Always use the filtered orders from props to respect time filtering
  const totalQuantity = getTotalQuantity(productId)
  const preparedQuantity = getPreparedQuantity(productId)

  return totalQuantity > 0 && totalQuantity === preparedQuantity
}

const emit = defineEmits(['product-marked-as-prepared'])
// Function to mark a product as prepared
const markProductPrepared = async (productId: number) => {
  try {
    if (!productId || props.currentTurno === undefined || props.currentTurno === null) {
      alert('Errore: ID prodotto o turno mancante');
      return;
    }
    
    // Call the API to persist the change
    try {
      const success = await ordiniStore.markProductAsPrepared(productId, props.currentTurno);
      
      if (!success) {
        throw new Error('Errore durante il processo di preparazione del prodotto');
      }
      
      // Emit the event to notify parent component to refresh data
      emit('product-marked-as-prepared', { productId, turno: props.currentTurno });
      
    } catch (apiError: any) {
      // Check if this is a 403 error (authorization)
      if (apiError.message && apiError.message.includes('403')) {
        console.error('Non sei autorizzato a modificare questo prodotto');
        alert('Non sei autorizzato a modificare questo prodotto. Questo prodotto appartiene ad un\'altra gestione.');
      } else {
        console.error('Errore nel marcare il prodotto come preparato:', apiError);
        alert('Errore nel marcare il prodotto come preparato. Riprova.');
      }
      throw apiError;
    }
  } catch (error) {
    console.error('Errore nel marcare il prodotto come preparato:', error);
  }
};

// Note: No longer need to fetch API data on mount or prop changes 
// since we now use filtered orders from props exclusively
</script>

<style scoped>
.product-totals {
  width: 30vw;
  max-width: 300px;
  padding: 20px;
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

.product-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.product-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 4px var(--card-shadow);
  transition: opacity 0.3s ease;
}

.product-prepared {
  opacity: 0.7;
  background-color: rgba(var(--card-bg-rgb, 245, 245, 245), 0.5);
}

.product-name {
  font-weight: 500;
}

.product-quantity {
  font-weight: bold;
  color: var(--poldo-primary);
  margin-left: auto;
}

.mark-prepared-btn {
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
  margin-left: 2px;
}

.mark-prepared-btn:hover {
  background-color: var(--poldo-accent, #4caf50);
  transform: scale(1.05);
}

.mark-prepared-btn:active {
  transform: scale(0.95);
}

.mark-prepared-btn svg {
  width: 18px;
  height: 18px;
}

</style>
