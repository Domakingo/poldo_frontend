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
          </template>        </div>        <button
          v-if="!isProductFullyPrepared(product.idProdotto)"
          class="mark-prepared-btn"
          @click="ordiniStore.markProductAsPrepared(product.idProdotto, props.currentTurno)
            .then(() => fetchProductsData(props.currentTurno))"
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
import { computed, onMounted, ref, watch } from 'vue'
import { useOrdiniStore } from '@/stores/Gestione/ordini'
import { API_CONFIG } from '@/utils/api'

const ordiniStore = useOrdiniStore()

interface Product {
  idProdotto: number;
  nome: string;
  quantita: number;
  prezzo: number;
  preparato?: boolean;
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

const uniqueProducts = computed(() => {
  // If we have API data, use that
  if (productsData.value && productsData.value.length > 0) {
    // Check if the data has the expected format
    const isValidFormat = productsData.value.every(product => 
      typeof product === 'object' && product !== null && 'idProdotto' in product
    );
    
    if (isValidFormat) {
      return productsData.value.map(product => ({
        idProdotto: product.idProdotto,
        nome: product.nome || 'Prodotto senza nome',
        prezzo: product.prezzo || 0,
        quantitaOrdinata: product.quantitaOrdinata || 0,
        tuttiPreparati: product.tuttiPreparati || false,
        quantitaPreparata: product.quantitaPreparata || 0
      }));
    } else {
      console.warn('Formato dei dati dei prodotti non valido:', productsData.value);
    }
  }

  // Otherwise, fall back to client-side calculation
  const products = new Map()

  if (!Array.isArray(props.classOrders)) {
    console.error('classOrders non è un array:', props.classOrders)
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
          prezzo: product.prezzo
        })
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

  // First check if we have API data for this product
  const apiProduct = productsData.value?.find(p => p.idProdotto === productId);
  if (apiProduct && 'quantitaOrdinata' in apiProduct) {
    return apiProduct.quantitaOrdinata || 0;
  }

  // Fallback to client-side calculation if API data isn't available
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
  
  // First check if we have API data for this product
  const apiProduct = productsData.value?.find(p => p.idProdotto === productId);
  if (apiProduct && 'quantitaPreparata' in apiProduct) {
    return apiProduct.quantitaPreparata || 0;
  }

  // Fallback to client-side calculation if API data isn't available
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

  // First check if we have API data for this product
  const apiProduct = productsData.value?.find(p => p.idProdotto === productId);
  if (apiProduct && 'tuttiPreparati' in apiProduct) {
    return apiProduct.tuttiPreparati;
  }

  // Fallback to client-side calculation
  const totalQuantity = getTotalQuantity(productId)
  const preparedQuantity = getPreparedQuantity(productId)

  return totalQuantity > 0 && totalQuantity === preparedQuantity
}

const emit = defineEmits(['product-marked-as-prepared'])

// Add state for products data from API
const productsData = ref<{
  idProdotto: number;
  nome: string;
  prezzo: number;
  descrizione?: string;
  quantitaOrdinata: number;
  tuttiPreparati: boolean;
  quantitaPreparata: number;
}[]>([]);

// Function to fetch products data from API
const fetchProductsData = async (turno: number = props.currentTurno) => {
  try {
    // Set the date in the store to today
    const today = new Date();
    const dateStr = ordiniStore.formatDate(today);
    ordiniStore.setSelectedDate(dateStr);
    
    // Use the store method to fetch class orders
    await ordiniStore.fetchClassOrders(turno);
    
    // Get the class orders from the store
    const data = ordiniStore.classOrders;
    
    // Process the data to ensure it matches the expected format
    // The API returns orders by class, but we need product details
    if (Array.isArray(data)) {
      // Process data to extract product information
      const productMap = new Map();
      
      data.forEach(order => {
        if (order && Array.isArray(order.prodotti)) {
          order.prodotti.forEach(product => {
            if (product && product.idProdotto) {
              const existingProduct = productMap.get(product.idProdotto);
              
              if (existingProduct) {
                // Update existing product entry
                existingProduct.quantitaOrdinata += product.quantita || 0;
                existingProduct.quantitaPreparata += order.preparato ? (product.quantita || 0) : 0;
                existingProduct.tuttiPreparati = (existingProduct.quantitaOrdinata === existingProduct.quantitaPreparata);
              } else {
                // Create new product entry
                productMap.set(product.idProdotto, {
                  idProdotto: product.idProdotto,
                  nome: product.nome || 'Prodotto senza nome',
                  prezzo: product.prezzo || 0,
                  quantitaOrdinata: product.quantita || 0,
                  quantitaPreparata: order.preparato ? (product.quantita || 0) : 0,
                  tuttiPreparati: !!order.preparato
                });
              }
            }
          });
        }
      });
      
      productsData.value = Array.from(productMap.values());
    } else {
      console.error('Data is not an array:', data);
      productsData.value = [];
    }  } catch (error) {
    console.error('Errore nel recupero dei dati dei prodotti:', error);
    // Show a more detailed error message in the console
    if (error instanceof SyntaxError) {
      console.error('Risposta non valida: errore di parsing JSON');
    }
    // Fall back to client-side calculation if API fails
    productsData.value = [];
  }
};

onMounted(() => {
  // Fetch products data for the selected turno on component mount
  fetchProductsData(props.currentTurno);
});

// Watch for changes in the currentTurno prop to update the displayed data
watch(() => props.currentTurno, (newTurno) => {
  fetchProductsData(newTurno);
});

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
