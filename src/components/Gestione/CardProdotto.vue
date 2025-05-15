<script setup lang="ts">
import { ref, computed, watch, watchEffect } from 'vue'
import { useGestioneProductsStore } from '@/stores/Gestione/products'
import type { Product } from '@/stores/Gestione/products'
import { useFiltersStore } from '@/stores/Gestione/filters'
import { usePendingChangesStore } from '@/stores/Gestione/pendingChanges'
import type { ProductChange } from '@/stores/Gestione/pendingChanges'
import IconEdit from '@/components/icons/IconEdit.vue'

const props = defineProps<{
  productId: number
  editable?: boolean
}>()

const productsStore = useGestioneProductsStore()
const filtersStore = useFiltersStore()
const pendingChangesStore = usePendingChangesStore()

// Recupera il prodotto dallo store
const product = computed(() => productsStore.getProductById(props.productId))
if (!product.value?.id) throw new Error(`Prodotto con ID ${props.productId} non trovato!`)

// Stato locale inizializzato dai valori del prodotto
const showEditModal = ref(false)
const localTitle = ref(product.value?.title || '')
const localPrice = ref(product.value?.price || 0)
const localQuantity = ref(product.value?.quantity || 0)
const localDescription = ref(product.value?.description || '')
const localIngredients = ref([...(product.value?.ingredients || [])])
const localTags = ref([...(product.value?.tags || [])])
const localIsActive = ref(product.value?.isActive ?? true)
const localImageSrc = ref(product.value?.imageSrc || '')

const originalData = ref<Product>({
  id: product.value?.id || 0,
  title: product.value?.title || '',
  description: product.value?.description || '',
  ingredients: product.value?.ingredients || [],
  price: product.value?.price || 0,
  quantity: product.value?.quantity || 0,
  tags: product.value?.tags || [],
  isActive: product.value?.isActive || false,
  imageSrc: product.value?.imageSrc || ''
})

// Watch per aggiornamenti esterni al prodotto
watch(product, (newVal) => {
  if (newVal) {
    localTitle.value = newVal.title
    localPrice.value = newVal.price
    localDescription.value = newVal.description
    localIngredients.value = [...newVal.ingredients]
    localTags.value = [...newVal.tags]
    localIsActive.value = newVal.isActive
    localImageSrc.value = newVal.imageSrc
    originalData.value = { ...newVal }
  }
}, { immediate: true })

const hasPendingChanges = computed(() => pendingChangesStore.hasProductChange(props.productId))

// Immagine
const isHoveringImg = ref(false)
const imageFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const isImgModified = computed(() => !!imageFile.value)

// Funzioni immagine
const resetImage = () => {
  imageFile.value = null
  localImageSrc.value = product.value.imageSrc
  checkForChanges()
}

const handleImageUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) {
    imageFile.value = input.files[0]
    localImageSrc.value = URL.createObjectURL(imageFile.value)
    checkForChanges()
  }
}

// Gestione modifiche
const checkForChanges = () => {
  const changes: Partial<ProductChange> = { id: props.productId }

  // Controllo modifiche per ogni campo
  const fields: (keyof Omit<ProductChange, 'id'>)[] = [
    'title', 'price', 'quantity', 'description',
    'ingredients', 'tags', 'isActive', 'imageSrc'
  ]

  fields.forEach(field => {
    const currentValue = {
      title: localTitle.value,
      price: localPrice.value,
      quantity: localQuantity.value,
      description: localDescription.value,
      ingredients: localIngredients.value,
      tags: localTags.value,
      isActive: localIsActive.value,
      imageSrc: localImageSrc.value
    }[field]

    const originalValue = originalData.value[field]

    if (JSON.stringify(currentValue) !== JSON.stringify(originalValue)) {
      changes[field] = currentValue
    }
  })

  if (Object.keys(changes).length > 1) {
    pendingChangesStore.addProductChange(changes as ProductChange)
  } else {
    pendingChangesStore.removeProductChange(props.productId)
  }
}

// Modal edit
const openEditModal = () => {
  const pendingData = pendingChangesStore.productChanges[props.productId];

  if (pendingData) {
    if (pendingData.title !== undefined) localTitle.value = pendingData.title;
    if (pendingData.price !== undefined) localPrice.value = pendingData.price;
    if (pendingData.quantity !== undefined) localQuantity.value = pendingData.quantity;
    if (pendingData.description !== undefined) localDescription.value = pendingData.description;
    if (pendingData.ingredients !== undefined) localIngredients.value = pendingData.ingredients;
    if (pendingData.tags !== undefined) localTags.value = pendingData.tags;
    if (pendingData.isActive !== undefined) localIsActive.value = pendingData.isActive;
  }

  showEditModal.value = true;
}

// Reset fields
const isFieldModified = (field: keyof Omit<Product, 'id'>): boolean => {
  const currentValue = {
    title: localTitle.value,
    price: localPrice.value,
    quantity: localQuantity.value,
    description: localDescription.value,
    ingredients: localIngredients.value,
    tags: localTags.value,
    isActive: localIsActive.value,
    imageSrc: localImageSrc.value
  }[field]

  const originalValue = originalData.value[field]

  if (Array.isArray(originalValue)) {
    return JSON.stringify(currentValue) !== JSON.stringify(originalValue)
  }
  return currentValue !== originalValue
}

const resetField = (field: keyof Product) => {
  const original = originalData.value[field]
  switch (field) {
    case 'title':
      localTitle.value = original as string
      break
    case 'price':
      localPrice.value = original as number
      break
    case 'quantity':
      localQuantity.value = original as number
      break
    case 'description':
      localDescription.value = original as string
      break
    case 'ingredients':
      localIngredients.value = [...original as string[]]
      break
    case 'tags':
      localTags.value = [...original as string[]]
      break
    case 'isActive':
      localIsActive.value = original as boolean
      break
    case 'imageSrc':
      localImageSrc.value = original as string
      imageFile.value = null
      break
  }
  checkForChanges()
}

const resetAll = () => {
  localTitle.value = originalData.value.title
  localPrice.value = originalData.value.price
  localQuantity.value = originalData.value.quantity
  localDescription.value = originalData.value.description
  localIngredients.value = [...originalData.value.ingredients]
  localTags.value = [...originalData.value.tags]
  localIsActive.value = originalData.value.isActive
  checkForChanges()
}

// Watch per modifiche durante il modal aperto
watchEffect(() => {
  if (showEditModal.value) checkForChanges()
})
</script>

<template>
  <div class="card-container" :class="{
    'inactive': hasPendingChanges
      ? pendingChangesStore.productChanges[productId]?.isActive === false
      : !localIsActive
  }">
    <div v-if="hasPendingChanges" class="pending-dot"></div>

    <div class="switch-container">
      <button class="switch-btn" :class="localIsActive ? 'active' : 'inactive'"
        @click="localIsActive = !localIsActive; checkForChanges()">
      </button>
    </div>

    <button class="edit-btn" @click.stop="openEditModal" v-if="editable">
      <IconEdit />
    </button>

    <div class="card-wrapper">
      <div class="card-side card-front">
        <div class="card-product">
          <button v-if="isImgModified" class="image-reset-btn reset-btn" @click.stop="resetImage"
            title="Ripristina immagine">
            ↺
          </button>
          <div class="image-wrapper" @mouseover="isHoveringImg = true" @mouseleave="isHoveringImg = false"
            @click="fileInput?.click()">
            <img :src="localImageSrc" :alt="product?.title" class="product-image" />
            <div v-if="isHoveringImg" class="edit-overlay">
              <IconEdit class="img-edit-icon" />
            </div>
            <input type="file" ref="fileInput" accept="image/*" @change="handleImageUpload" style="display: none" />
          </div>
          <div class="info">
            <h3 class="title">{{ localTitle }}</h3>
            <p class="price">{{ localPrice.toFixed(2) }}€</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showEditModal" class="edit-modal">
      <div class="modal-backdrop" @click.self="showEditModal = false">
        <div class="modal-content">
          <h2>Modifica Prodotto</h2>

          <div class="reset-controls">
            <button class="btn secondary" @click="resetAll">Ripristina tutto</button>
          </div>

          <div class="form-group">
            <div class="label-wrapper">
              <span>Titolo:</span>
              <button v-if="isFieldModified('title')" class="reset-btn" @click.stop="resetField('title')"
                title="Ripristina al valore originale">
                ↺
              </button>
            </div>
            <input v-model="localTitle" />
          </div>

          <div class="form-group">
            <div class="label-wrapper">
              <span>Prezzo (€):</span>
              <button v-if="isFieldModified('price')" class="reset-btn" @click.stop="resetField('price')"
                title="Ripristina al valore originale">↺</button>
            </div>
            <input type="number" v-model.number="localPrice" step="0.01" />
          </div>

          <div class="form-group">
            <div class="label-wrapper">
              <span>Quantità:</span>
              <button v-if="isFieldModified('quantity')" class="reset-btn" @click.stop="resetField('quantity')"
                title="Ripristina al valore originale">↺</button>
            </div>
            <input type="number" v-model.number="localQuantity" min="0" step="1" />
          </div>

          <div class="form-group">
            <div class="label-wrapper">
              <span>Descrizione:</span>
              <button v-if="isFieldModified('description')" class="reset-btn" @click.stop="resetField('description')"
                title="Ripristina al valore originale">↺</button>
            </div>
            <textarea v-model="localDescription" />
          </div>

          <div class="form-group">
            <div class="label-wrapper">
              <span>Ingredienti:</span>
              <div class="ingredients-list">
                <div v-for="ingredient in filtersStore.allIngredients" :key="ingredient" click.stop="ingredient-item">
                  <input type="checkbox" :value="ingredient" v-model="localIngredients" />
                  {{ ingredient }}
                </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <div class="label-wrapper">
              <span>Tags:</span>
              <div class="tags-list">
                <div v-for="tag in filtersStore.allTags" :key="tag" class="tag-item">
                  <input type="checkbox" :value="tag" v-model="localTags" />
                  {{ tag }}
                </div>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn secondary" @click="showEditModal = false">Chiudi</button>
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
  position: relative;
}

.card-wrapper {
  width: 100%;
  height: 100%;
}

.card-front {
  width: 100%;
  height: 100%;
  border-radius: 20px;
  background-color: var(--card-bg);
  box-shadow: 0 2px 8px var(--card-shadow);
  transition: filter 0.3s ease, opacity 0.3s ease;
}

.card-product {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 16px;
  position: relative;
}

.image-wrapper {
  flex-shrink: 0;
  width: 100px;
  height: 100px;
  border-radius: 2.25vmax;
  overflow: hidden;
  position: relative;
  margin-right: 16px;
  background: var(--color-background-soft);
  transition: opacity 0.3s ease;
}

.image-wrapper:hover {
  opacity: 0.8;
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
  margin: 0 0 8px 0;
  color: var(--poldo-primary);
  font-weight: bold;
}

.price {
  font-size: 1.1rem;
  margin: 0;
  color: var(--poldo-text);
  font-weight: 500;
}

.pending-dot {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 12px;
  height: 12px;
  background-color: #2196F3;
  border-radius: 50%;
  z-index: 3;
}

.edit-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2.25vmax;
  cursor: pointer;
}

.img-edit-icon {
  width: 4em !important;
  height: 4em !important;
  color: white;
}

.image-reset-btn {
  position: absolute;
  font-size: 2em !important;
  font-weight: bold;
  top: 27px;
  left: 85px;
  z-index: 2;
}

.image-wrapper:hover .edit-icon {
  transform: scale(1.1);
}

.edit-btn {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: none;
  border: none;
  padding: 5px;
  cursor: pointer;
  z-index: 1;
  color: var(--poldo-text);
  font-size: 1.5rem;
  transition: opacity 0.3s ease;
}

.edit-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(42, 34, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: 15px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px var(--card-shadow);
  border: 1px solid var(--color-border);
}

.modal-content h2 {
  color: var(--poldo-primary);
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.form-group {
  margin-bottom: 1.2rem;
  width: 100%;
}

.label-wrapper {
  display: flex;
  align-items: flex-start;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.label-wrapper>span {
  font-weight: 600;
  color: var(--poldo-primary);
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--card-bg);
  color: var(--poldo-text);
  transition: all 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: var(--poldo-primary);
  box-shadow: 0 0 0 2px rgba(255, 179, 71, 0.2);
  outline: none;
}

.ingredients-list,
.tags-list {
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  padding: 0.5rem;
  background: var(--color-background-soft);
  border-radius: 8px;
  border: 1px solid var(--color-border);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.5rem;
}

.ingredient-item,
.tag-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background 0.2s ease;
  border-bottom: none;
}

input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--poldo-primary);
  margin: 0;
  flex-shrink: 0;
}

input[type="checkbox"]:checked {
  background-color: var(--poldo-primary);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.btn.secondary {
  background: var(--poldo-primary);
  color: var(--poldo-text);
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn.secondary:hover {
  background: var(--poldo-accent);
  cursor: pointer;
}

.reset-controls {
  margin-bottom: 1rem;
  text-align: right;
}

.switch-container {
  position: absolute;
  top: 15px;
  right: 15px;
  display: flex;
  background: var(--color-background-soft);
  border-radius: 50px;
}

.switch-btn {
  display: flex;
  padding: 10px;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1;
}

.switch-btn.active {
  background: var(--poldo-primary);
}

.switch-btn.inactive {
  background: var(--disabled);
}

/* Stile per card inattiva */
.card-container.inactive .card-front {
  filter: grayscale(100%);
  opacity: 0.7;
}

.card-container.inactive .edit-btn {
  opacity: 0.7;
}

.reset-btn {
  background: none;
  border: none;
  color: var(--poldo-primary);
  cursor: pointer;
  margin-left: 0.5rem;
  padding: 0;
  font-size: 1.5em;
  display: inline-block;
  vertical-align: middle;
}

.reset-btn:hover {
  color: var(--poldo-accent);
}

@media (max-width: 480px) {
  .modal-content {
    padding: 1rem;
  }

  .edit-icon {
    width: 24px;
    height: 24px;
  }
}
</style>
