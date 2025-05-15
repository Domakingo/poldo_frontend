<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useProductsStore } from '@/stores/products'
import { useRouter } from 'vue-router'
import CardGrid from '@/components/CardGrid.vue'
import CardProdotto from '@/components/CardProdotto.vue'
import Filtri from '@/components/Filtri.vue'
import SearchBar from '@/components/SearchBar.vue'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const productsStore = useProductsStore()
const cartStore = useCartStore()
const searchQuery = ref('')

const haveCart = ref(false)

const activeFilters = ref({
    ingredienti: [] as string[],
    tags: [] as string[],
    attivo: null as boolean | null,
    prezzo: { min: 0, max: Infinity }
})

const maxPrice = computed(() => Math.max(
    ...productsStore.products.map(p => p.price),
    0
))

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

const filteredProducts = computed(() => {
    return productsStore.products.filter(product => {
        const matchesPrice = product.price <= activeFilters.value.prezzo.max
        const matchesIngredients = activeFilters.value.ingredienti.length === 0 ||
            activeFilters.value.ingredienti.every(ing => product.ingredients.includes(ing))
        const matchesTags = activeFilters.value.tags.length === 0 ||
            activeFilters.value.tags.some(tag => product.tags.includes(tag))
        const matchesStatus = activeFilters.value.attivo === null ||
            product.isActive === (activeFilters.value.attivo === true)

        return matchesPrice && matchesIngredients && matchesTags && matchesStatus
    })
})

const searchResults = computed(() => {
    const q = searchQuery.value.toLowerCase()
    return filteredProducts.value.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    )
})

// Mobile layout
const isMobile = ref(window.innerWidth <= 768)
const selectedMacro = ref<'cibo' | 'bibite'>('cibo')

const macroFilteredProducts = computed(() => {
    return searchResults.value.filter(prod =>
        selectedMacro.value === 'bibite'
            ? prod.tags.includes('Bevanda')
            : !prod.tags.includes('Bevanda')
    )
})

// Desktop layout
const groupedByMacro = computed(() => {
    const groups: Record<string, typeof searchResults.value> = {
        'Cibo': [],
        'Bibite': []
    }

    searchResults.value.forEach(product => {
        product.tags.includes('Bevanda')
            ? groups['Bibite'].push(product)
            : groups['Cibo'].push(product)
    })

    return groups
})

async function getCart() {
    const cart = await cartStore.getOrdineByTurno()
    console.log('cart', cart)
    haveCart.value = cart === true
}

const onResize = () => isMobile.value = window.innerWidth <= 768
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

getCart()
</script>

<template>
    <div class="prodotti">
        <div class="search-bar-wrapper">
            <SearchBar v-model="searchQuery" placeholder="Cerca prodotti..." />

            <div v-if="isMobile" class="category-switch">
                <div class="switch-container">
                    <button class="switch-btn" :class="{ active: selectedMacro === 'cibo' }"
                        @click="selectedMacro = 'cibo'">
                        <svg class="icon" viewBox="0 0 24 24">
                            <path d="M18 6H6L2 22h20L18 6zm-6 7c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
                            <circle cx="12" cy="9" r="1" />
                        </svg>
                        <span>Cibo</span>
                    </button>

                    <button class="switch-btn" :class="{ active: selectedMacro === 'bibite' }"
                        @click="selectedMacro = 'bibite'">
                        <svg class="icon" viewBox="0 0 24 24">
                            <path d="M21 5V3H3v2l8 9v5H6v2h12v-2h-5v-5l8-9zM7.43 7L5.66 5h12.69l-1.78 2H7.43z" />
                        </svg>
                        <span>Bibite</span>
                    </button>
                </div>
            </div>
        </div>

        <div class="prodotti-container">
            <div v-if="searchResults.length === 0" class="no-results">
                {{ searchQuery ? `Nessun risultato per "${searchQuery}"` : 'Nessun prodotto trovato' }}
            </div>

            <!-- Mobile view -->
            <CardGrid v-if="isMobile" :minWidth="'300px'">
                <CardProdotto v-for="product in macroFilteredProducts" :key="product.id"
                    v-bind="{ productId: product.id }" :disabled="haveCart"/>
            </CardGrid>

            <!-- Desktop view -->
            <template v-else>
                <div v-for="(products, macro) in groupedByMacro" :key="macro">
                    <h2 v-if="products.length > 0" class="macro-title">{{ macro }}</h2>
                    <CardGrid :minWidth="'280px'">
                        <CardProdotto v-for="product in products" :key="product.id"
                            v-bind="{ ...product, productId: product.id }" :disabled="haveCart"/>
                    </CardGrid>
                </div>
            </template>
        </div>

        <Filtri :ingredients="productsStore.allIngredients" :tags="productsStore.allTags" :max-price="maxPrice"
            @filters-applied="handleFiltersApplied" />

        <button class="cart-button" @click="router.push('/carrello')">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
        </button>
    </div>
</template>

<style scoped>
.category-switch {
    display: flex;
    justify-content: center;
    margin: 15px 0;
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

.switch-btn span {
    font-weight: 500;
    color: var(--poldo-text);
    transition: color 0.3s ease;
}

.search-bar-wrapper {
    padding: 20px;
    width: 100%;
    top: 0;
}

.macro-selector {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 15px 0;
    gap: 10px;
}

.macro-selector select {
    padding: 8px 12px;
    border-radius: 8px;
    border: 2px solid var(--poldo-primary);
    background: var(--color-background);
    color: var(--poldo-text);
    font-size: 1rem;
}

.no-results {
    text-align: center;
    padding: 2rem;
    color: var(--poldo-text);
    font-size: 1.2rem;
    width: 100%;
}

.prodotti {
    position: relative;
    height: calc(100vh - 100px);
    padding-bottom: 45px;
    display: flex;
    flex-direction: column;
    margin-left: 20px;
}

.prodotti-container {
    flex: 1;
    overflow-y: auto;
    padding: 0 20px 20px;
}

.macro-section {
    margin-bottom: 40px;
}

.macro-title {
    font-size: 1.8rem;
    color: var(--poldo-primary);
    margin: 1.5rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 3px solid var(--poldo-accent);
}

.products-grid {
    padding: 0 15px;
    gap: 25px;
}

.cart-button {
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: none;
    background: var(--poldo-primary);
    color: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: transform 0.2s;
    z-index: 10;
    cursor: pointer;
}

.cart-button:hover {
    transform: scale(1.05);
}

@media (max-width: 768px) {
    .prodotti-container {
        padding: 0 10px 20px;
    }

    .products-grid {
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 15px;
    }
}

@media (min-width: 769px) {
    .products-grid {
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        max-width: 1400px;
        margin: 0 auto;
    }

    .macro-title {
        font-size: 2rem;
        margin-left: 2rem;
    }
}

@media (max-width: 480px) {
    .switch-btn {
        padding: 8px 15px;
    }

    .switch-btn span {
        display: none;
    }
}
</style>
