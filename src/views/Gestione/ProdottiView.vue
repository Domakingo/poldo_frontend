<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGestioneProductsStore } from '@/stores/Gestione/products'
import { useFiltersStore } from '@/stores/Gestione/filters'
import { usePendingChangesStore } from '@/stores/Gestione/pendingChanges'

import CardGrid from '@/components/CardGrid.vue'
import CardProdotto from '@/components/Gestione/CardProdotto.vue'
import Filtri from '@/components/Gestione/Filtri.vue'
import SearchBar from '@/components/SearchBar.vue'

const router = useRouter()
const productsStore = useGestioneProductsStore()
const filtersStore = useFiltersStore()
const pendingChangesStore = usePendingChangesStore()
const searchQuery = ref('')

// Computed properties
const hasPendingChanges = computed(() =>
  Object.keys(pendingChangesStore.productChanges).length > 0 ||
  pendingChangesStore.filterChanges.length > 0
)

const usedIngredients = computed(() => {
  const ingredients = new Set<string>()
  filteredProducts.value.forEach(p => p.ingredients.forEach(i => ingredients.add(i)))
  return Array.from(ingredients)
})

const usedTags = computed(() => {
  const tags = new Set<string>()
  filteredProducts.value.forEach(p => p.tags.forEach(t => tags.add(t)))
  return Array.from(tags)
})

// Filters handling
const activeFilters = ref({
  ingredienti: [] as string[],
  tags: [] as string[],
  attivo: null as boolean | null,
  prezzo: { min: 0, max: Infinity }
})

const handleFiltersApplied = (filters: any) => {
  activeFilters.value = {
    ingredienti: filters.ingredienti || [],
    tags: filters.tags || [],
    attivo: filters.attivo,
    prezzo: {
      min: filters.prezzo.min || 0,
      max: filters.prezzo.max || Infinity
    }
  }
}

// Products filtering
const filteredProducts = computed(() => productsStore.products.filter(product => {
  return (
    product.price <= activeFilters.value.prezzo.max &&
    (activeFilters.value.ingredienti.length === 0 ||
      activeFilters.value.ingredienti.every(ing => product.ingredients.includes(ing))) &&
    (activeFilters.value.tags.length === 0 ||
      activeFilters.value.tags.some(tag => product.tags.includes(tag))) &&
    (activeFilters.value.attivo === null || product.isActive === activeFilters.value.attivo)
  )
}))

const searchResults = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return filteredProducts.value.filter(p =>
    p.title.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q)
  )
})

// Responsive layout
const isMobile = ref(window.innerWidth <= 768)
const selectedMacro = ref<'cibo' | 'bibite'>('cibo')

const macroFilteredProducts = computed(() =>
  searchResults.value.filter(prod =>
    selectedMacro.value === 'bibite' ?
      prod.tags.includes('Bevanda') :
      !prod.tags.includes('Bevanda')
  )
)

const groupedByMacro = computed(() => {
  const groups = { 'Cibo': [], 'Bibite': [] } as Record<string, typeof searchResults.value>
  searchResults.value.forEach(product =>
    product.tags.includes('Bevanda') ?
      groups['Bibite'].push(product) :
      groups['Cibo'].push(product)
  )
  return groups
})

// Save changes
const saveAllChanges = async () => {
  try {
    // Salvataggio modifiche prodotti
    for (const [id, data] of Object.entries(pendingChangesStore.productChanges)) {
      await productsStore.updateProduct(Number(id), data);
    }

    // Salvataggio modifiche filtri
    for (const change of pendingChangesStore.filterChanges) {
      switch (change.type) {
        case 'ingredient':
          if (change.action === 'create') await filtersStore.addIngredient(change.name);
          if (change.action === 'update') await filtersStore.updateIngredient(change.name, change.newName!);
          break;
        case 'tag':
          if (change.action === 'create') await filtersStore.addTag(change.name);
          if (change.action === 'update') await filtersStore.updateTag(change.name, change.newName!);
          break;
      }
    }

    //window.location.reload();

  } catch (error) {
    console.error('Errore durante il salvataggio:', error);
    alert(`Errore durante il salvataggio: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);

    await Promise.all([
      productsStore.initializeProducts(),
      filtersStore.initializeFilters()
    ]);
  } finally {
    pendingChangesStore.clearAllChanges();
  }
};

// Responsive handling
const onResize = () => isMobile.value = window.innerWidth <= 768
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))
</script>

<template>
  <div class="prodotti-view">
    <button class="global-save-btn" :class="{ disabled: !hasPendingChanges }" :disabled="!hasPendingChanges"
      @click="saveAllChanges">
      SALVA TUTTE LE MODIFICHE
    </button>

    <div class="search-bar-wrapper">
      <SearchBar v-model="searchQuery" placeholder="Cerca prodotti..." />

      <div v-if="isMobile" class="category-switch">
        <div class="switch-container">
          <button class="switch-btn" :class="{ active: selectedMacro === 'cibo' }" @click="selectedMacro = 'cibo'">
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M18 6H6L2 22h20L18 6zm-6 7c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
              <circle cx="12" cy="9" r="1" />
            </svg>
            <span>Cibo</span>
          </button>

          <button class="switch-btn" :class="{ active: selectedMacro === 'bibite' }" @click="selectedMacro = 'bibite'">
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M21 5V3H3v2l8 9v5H6v2h12v-2h-5v-5l8-9zM7.43 7L5.66 5h12.69l-1.78 2H7.43z" />
            </svg>
            <span>Bibite</span>
          </button>
        </div>
      </div>
    </div>

    <div class="main-layout">
      <Filtri :ingredients="filtersStore.allIngredients" :tags="filtersStore.allTags"
        :used-ingredients="usedIngredients" :used-tags="usedTags" @filters-applied="handleFiltersApplied" />

      <div class="prodotti-container">
        <div v-if="searchResults.length === 0" class="no-results">
          {{ searchQuery ? `Nessun risultato per "${searchQuery}"` : 'Nessun prodotto trovato' }}
        </div>

        <!-- Mobile view -->
        <CardGrid v-if="isMobile" :minWidth="'300px'">
          <CardProdotto v-for="product in macroFilteredProducts" :product-id="product.id" v-bind="product"
            :editable="true" />
        </CardGrid>

        <!-- Desktop view -->
        <template v-else>
          <div v-for="(products, macro) in groupedByMacro" :key="macro">
            <h2 v-if="products.length > 0" class="macro-title">{{ macro }}</h2>
            <CardGrid :minWidth="'280px'">
              <CardProdotto v-for="product in products" :product-id="product.id" v-bind="product" :editable="true" />
            </CardGrid>
          </div>
        </template>
      </div>
    </div>

    <button class="add-button" :class="{ disabled: hasPendingChanges }" :disabled="hasPendingChanges"
      @click="router.push('addProdotto')">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <path d="M12 2v20M2 12h20" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.prodotti-view {
  position: relative;
  height: calc(100vh - 100px);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.main-layout {
  flex: 1;
  display: flex;
  flex-direction: row;
  gap: 20px;
  height: calc(100% - 60px);
  min-height: 0;
  overflow: hidden;
}

.filters-panel {
  width: 280px;
  flex-shrink: 0;
  background: var(--color-background-soft);
  border-radius: 12px;
  padding: 20px;
  overflow-y: auto;
  height: 100%;
}

.prodotti-container {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding-right: 10px;
  height: 100%;
}

.search-bar-wrapper {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 0 10px;
}

.category-switch {
  display: flex;
  justify-content: center;
}

.switch-container {
  display: flex;
  background: var(--color-background-soft);
  border-radius: 50px;
  padding: 5px;
  box-shadow: 0 2px 8px var(--poldo-card-shadow);
}

.switch-btn {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  border: none;
  border-radius: 50px;
  background: none;
  cursor: pointer;
  transition: all 0.3s ease;
  gap: 8px;
}

.switch-btn.active {
  background: var(--poldo-primary);
  box-shadow: 0 2px 8px rgba(239, 194, 12, 0.3);
}

.switch-btn.active .icon {
  stroke: var(--poldo-background);
}

.switch-btn.active span {
  color: var(--poldo-background);
}

.icon {
  width: 24px;
  height: 24px;
  stroke: var(--poldo-text);
  stroke-width: 1.5;
  fill: none;
  transition: stroke 0.3s ease;
}

.no-results {
  text-align: center;
  padding: 2rem;
  color: var(--poldo-text);
  font-size: 1.2rem;
}

.macro-title {
  font-size: 1.8rem;
  color: var(--poldo-primary);
  margin: 1.5rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 3px solid var(--poldo-accent);
}

.global-save-btn {
  position: fixed;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 25px;
  font-size: 0.95rem;
  background-color: var(--poldo-primary);
  color: white;
  border: none;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 999;
  transition: all 0.3s ease;
}

.global-save-btn.disabled {
  background-color: var(--disabled);
  cursor: not-allowed;
  opacity: 0.7;
}

.add-button {
  position: fixed;
  bottom: 20px;
  right: 30px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  background: var(--poldo-primary);
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
  z-index: 5;
}

.add-button:not(.disabled):hover {
  transform: scale(1.1);
}

.add-button.disabled {
  background-color: var(--disabled);
  cursor: not-allowed;
  opacity: 0.5;
}

@media (max-width: 768px) {
  .main-layout {
    flex-direction: column;
  }

  .filters-panel {
    width: 100%;
    height: auto;
    max-height: 400px;
  }

  .prodotti-container {
    padding-right: 0;
  }

  .switch-btn {
    padding: 8px 15px;
  }

  .switch-btn span {
    display: none;
  }

  .global-save-btn {
    bottom: 70px;
    min-width: 85%;
  }
}

@media (min-width: 769px) {
  .macro-title {
    font-size: 2rem;
    margin-left: 1rem;
  }
}
</style>
