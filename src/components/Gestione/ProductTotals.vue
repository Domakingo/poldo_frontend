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
        </div>        <button 
          v-if="!isProductFullyPrepared(product.idProdotto)" 
          class="mark-prepared-btn"
          @click="markProductAsPrepared(product.idProdotto)"
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
  if (productsData.value.length > 0) {
    return productsData.value.map(product => ({
      idProdotto: product.idProdotto,
      nome: product.nome,
      prezzo: product.prezzo,
      quantitaOrdinata: product.quantitaOrdinata,
      tuttiPreparati: product.tuttiPreparati,
      quantitaPreparata: product.quantitaPreparata
    }));
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
    return a.nome.localeCompare(b.nome);
  });
})

const getTotalQuantity = (productId: number): number => {
  // First check if we have API data for this product
  const apiProduct = productsData.value.find(p => p.idProdotto === productId);
  if (apiProduct) {
    return apiProduct.quantitaOrdinata;
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
  // First check if we have API data for this product
  const apiProduct = productsData.value.find(p => p.idProdotto === productId);
  if (apiProduct) {
    return apiProduct.quantitaPreparata;
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
  // First check if we have API data for this product
  const apiProduct = productsData.value.find(p => p.idProdotto === productId);
  if (apiProduct) {
    return apiProduct.tuttiPreparati;
  }
  
  // Fallback to client-side calculation
  const totalQuantity = getTotalQuantity(productId)
  const preparedQuantity = getPreparedQuantity(productId)
  
  return totalQuantity > 0 && totalQuantity === preparedQuantity
}

const emit = defineEmits(['product-marked-as-prepared'])

// Function to mark a product as prepared
const markProductAsPrepared = async (productId: number) => {
  try {
    const API_CONFIG = {
      BASE_URL: 'http://figliolo.it:5005/v1',
      TOKEN: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDgsInJ1b2xvIjoiYWRtaW4iLCJpYXQiOjE3NDQyNzk2ODMsImV4cCI6MTc3NTgzNzI4M30.AelK6BkvrydKSqNGuXbzWGzST4yctrHvdjy66XeoMHI"
    };

    const response = await fetch(`${API_CONFIG.BASE_URL}/ordini/prodotti/${productId}/prepara?nTurno=${props.currentTurno}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${API_CONFIG.TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Errore API con stato ${response.status}`);
    }

    // Refresh the products data after marking as prepared
    await fetchProductsData(props.currentTurno);

    // Notify parent component that the product was marked as prepared
    emit('product-marked-as-prepared', { productId, turno: props.currentTurno });
  } catch (error) {
    console.error('Errore nel marcare il prodotto come preparato:', error);
    alert('Errore nel marcare il prodotto come preparato. Riprova.');
  }
};

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

// API configuration for fetching products
const API_CONFIG = {
  BASE_URL: 'http://figliolo.it:5005/v1',
  TOKEN: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDgsInJ1b2xvIjoiYWRtaW4iLCJpYXQiOjE3NDQyNzk2ODMsImV4cCI6MTc3NTgzNzI4M30.AelK6BkvrydKSqNGuXbzWGzST4yctrHvdjy66XeoMHI"
}

// Function to fetch products data from API
const fetchProductsData = async (turno: number = props.currentTurno) => {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // Corrected API endpoint for product totals with preparation status
    const url = `${API_CONFIG.BASE_URL}/ordini/prodotti?startDate=${dateStr}&endDate=${dateStr}&nTurno=${turno}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${API_CONFIG.TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Errore API con stato ${response.status}`);
    }
    
    const data = await response.json();
    productsData.value = data;
  } catch (error) {
    console.error('Errore nel recupero dei dati dei prodotti:', error);
    // Fall back to client-side calculation if API fails
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
