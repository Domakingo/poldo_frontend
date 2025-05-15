<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useFavoritesStore } from '@/stores/favorites'
import QuantityControl from './ControlloQuantitaProdotto.vue'
import { useProductsStore } from '@/stores/products'

const props = defineProps({
    productId: {
        type: Number,
        required: true
    },
    disabled: {
        type: Boolean,
        default: false
    }
})

const product = {
  ...useProductsStore().getProductById(props.productId),
  disableFlip: false,
}

const favoritesStore = useFavoritesStore()
const isFlipped = ref(false)
const isFavorited = ref(false)

const id = ref(props.productId)

onMounted(() => {
  isFavorited.value = favoritesStore.isFavorite(id.value)
})

const toggleFavorite = () => {
  isFavorited.value = !isFavorited.value
  isFavorited.value
    ? favoritesStore.addFavorite(id.value)
    : favoritesStore.removeFavorite(id.value)
}

// Gestione flip card
const flipCard = (event: Event) => {
  if (product.disableFlip) return
  if (!(event.target as HTMLElement).closest('.quantity-controls')) {
    isFlipped.value = !isFlipped.value
  }
}
</script>

<template>
  <div class="card-container" :class="{ 'clickable': !product.disableFlip }" @click="flipCard">
    <div class="card-wrapper" :class="{ 'is-flipped': isFlipped }">
      <!-- Front Side -->
      <div class="card-side card-front">
        <div class="card-prodotto">
          <button class="favorite-btn" @click.stop="toggleFavorite">
            <svg v-if="isFavorited" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
              fill="currentColor" stroke="currentColor" stroke-width="1.5">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="1.5">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </button>

          <div class="image-container">
            <img :src="product.imageSrc" alt="image" class="product-image" />
          </div>

          <div class="info">
            <h3 class="title">{{ product.title }}</h3>
            <div v-if="product.price !== undefined" class="price">€{{ product.price.toFixed(2) }}</div>
          </div>

                    <QuantityControl 
                        :product-id="id"
                        :disabled="props.disabled"
                         />
                </div>
            </div>

      <!-- Back Side -->
      <div class="card-side card-back">
        <h3 class="title">{{ product.title }}</h3>
        <div class="scroll">
          <div class="descr">
            <div class="details">
              <div class="description-section">
                <h4>Descrizione</h4>
                <p>{{ product.description || 'Nessuna descrizione disponibile' }}</p>
              </div>

              <div class="ingredients-section">
                <h4>Ingredienti</h4>
                <ul v-if="product.ingredients && product.ingredients.length > 0">
                  <li v-for="(ingredient, index) in product.ingredients" :key="index">
                    {{ ingredient }}
                  </li>
                </ul>
                <p v-else>Nessun ingrediente disponibile</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-container {
  width: 100%;
  max-width: 400px;
  height: 175px;
  outline: none;
  user-select: none;
}

.card-container.clickable {
  cursor: pointer;
}

.card-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.8s;
  transform-style: preserve-3d;
}

.card-wrapper.is-flipped {
  transform: rotateY(180deg);
}

.card-front {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 20px;
  background-color: var(--card-bg);
  box-shadow: 0 2px 8px var(--card-shadow);
  z-index: 1;
}

.card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 20px;
  background-color: var(--card-bg);
  box-shadow: 0 2px 8px var(--card-shadow);
  transform: rotateY(180deg);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.scroll {
  flex: 1;
  min-height: 0;
}

.card-wrapper.is-flipped .card-back {
  pointer-events: auto;
}

.card-back .card-prodotto,
.card-back .details,
.card-back .quantity-controls {
  pointer-events: auto;
}

/* Card content */
.card-prodotto {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 16px;
  position: relative;
}

.image-container {
  flex-shrink: 0;
  width: 100px;
  height: 100px;
  border-radius: 2.25vmax;
  overflow: hidden;
  position: relative;
  margin-right: 16px;
  background: var(--color-background-soft);
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 5px;
  border-radius: 2.25vmax;
}

.info {
  text-align: center;
  width: 100%;
}

.title {
  font-size: 1.2rem;
  margin: 0;
  color: var(--poldo-primary);
  font-weight: bold;
  text-align: center;
}

.card-back .title {
  font-size: 1.5rem;
  margin: 0;
  background-color: var(--poldo-primary);
  color: white;
  width: 100%;
  font-weight: bold;
}

.short-description {
  font-size: 0.95rem;
  color: var(--color-text);
  margin-top: 5px;
}

.price {
  font-size: 1.1rem;
  color: var(--poldo-text);
}

.descr {
  overflow-y: auto;
  height: 100%;
  box-sizing: border-box;
  padding: 5px 10px;
}

/* Back side specific styles */
.details {
  height: auto;
  overflow-y: auto;
  padding-right: 5px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
}

/* Custom scrollbar styling */
.details::-webkit-scrollbar {
  width: 5px;
}


.ingredients-section ul {
  padding-left: 20px;
  margin: 5px 0;
}

.ingredients-section li {
  font-size: 0.9rem;
  margin-bottom: 2px;
}

.description-section p {
  font-size: 0.9rem;
  line-height: 1.3;
  margin: 5px 0;
}

.description-section h4,
.ingredients-section h4 {
  margin: 0 0 5px 0;
  font-size: 1rem;
  color: var(--poldo-primary);
}

/* Quantity controls */
.quantity-controls {
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 2;
}

.quantity-btn {
  width: 25px;
  height: 25px;
  border-radius: 50%;
  border: none;
  color: var(--poldo-text);
  font-size: 1.2rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  line-height: 0;
  transition: background-color 0.2s;
}

.quantity-btn.plus {
  background-color: var(--poldo-green);
}

.quantity-btn.minus {
  background-color: var(--poldo-red);
}

.quantity-btn.minus.disabled {
  background-color: var(--disabled);
  cursor: not-allowed;
}

.quantity-btn.delete {
  background-color: var(--poldo-accent);
  color: var(--poldo-text);
}

.quantity-btn.delete:hover {
  background-color: var(--poldo-primary);
}

.quantity {
  font-size: 1.1rem;
  font-weight: bold;
  min-width: 20px;
  text-align: center;
}

.favorite-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  z-index: 2;
  color: var(--poldo-accent);
  transition: all 0.2s ease;
}

.favorite-btn:hover {
  transform: scale(1.1);
  color: var(--poldo-primary);
}

.favorite-btn svg {
  width: 24px;
  height: 24px;
}

.disponibility-counter {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--poldo-primary);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 2;
}

.out-of-stock-message {
  position: absolute;
  bottom: 10px;
  right: 10px;
  color: var(--poldo-red);
  font-weight: bold;
  padding: 8px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@media (prefers-color-scheme: dark) {
  .disponibility-counter {
    background: rgba(0, 0, 0, 0.7);
    color: var(--poldo-text);
  }

  .short-description,
  .description-section p {
    color: var(--poldo-text);
  }

  .out-of-stock-message {
    background: rgba(0, 0, 0, 0.7);
  }
}
</style>
