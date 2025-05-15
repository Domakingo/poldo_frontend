<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGestioneProductsStore } from '@/stores/Gestione/products'
import { usePendingChangesStore } from '@/stores/Gestione/pendingChanges'
import { useFiltersStore } from '@/stores/Gestione/filters'

const router = useRouter()
const productsStore = useGestioneProductsStore()
const pendingChanges = usePendingChangesStore()
const filtersStore = useFiltersStore()

const newProduct = ref({
  title: '',
  description: '',
  price: 0,
  quantity: 0,
  ingredients: [] as string[],
  tags: [] as string[],
  isActive: true,
  imageFile: null as File | null
})

const imagePreview = ref('')
const isSubmitting = ref(false)

onMounted(async () => {
  try {
    await filtersStore.initializeFilters()
  } catch (error) {
    console.error('Errore durante il caricamento dei filtri:', error)
  }

  // Resetta il form
  newProduct.value = {
    title: '',
    description: '',
    price: 0,
    quantity: 0,
    ingredients: [],
    tags: [],
    isActive: true,
    imageFile: null
  }
  imagePreview.value = ''
})

const handleImageUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) {
    newProduct.value.imageFile = input.files[0]
    imagePreview.value = URL.createObjectURL(input.files[0])
  }
}

const submitProduct = async () => {
  try {
    isSubmitting.value = true

    // Validazione campi obbligatori
    if (!newProduct.value.title.trim() || !newProduct.value.description.trim()) {
      throw new Error('Compila tutti i campi obbligatori')
    }

    if (!newProduct.value.title.trim() ||
      !newProduct.value.description.trim() ||
      newProduct.value.quantity <= 0) {
      throw new Error('La quantita deve essere maggiore di 0')
    }

    if (newProduct.value.price <= 0) {
      throw new Error('Il prezzo deve essere maggiore di 0')
    }

    await productsStore.addProduct({
      title: newProduct.value.title,
      description: newProduct.value.description,
      price: newProduct.value.price,
      quantity: newProduct.value.quantity,
      ingredients: newProduct.value.ingredients,
      tags: newProduct.value.tags,
      isActive: newProduct.value.isActive,
      imageSrc: imagePreview.value || 'http://localhost:5000/v1/prodotti/image/-1'
    })

    pendingChanges.clearAllChanges()
    // router.replace('/gestione/prodotti')
  } catch (error) {
    console.error('Errore durante il salvataggio:', error)
    alert(`Errore durante il salvataggio: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="add-product-page">
    <div class="page-header">
      <button class="back-button" @click="router.replace('/gestione/prodotti')">
        &larr; Torna ai Prodotti
      </button>

      <h1>Aggiungi Nuovo Prodotto</h1>

      <div class="form-actions">
        <button type="button" class="cancel-button" @click="router.push('/prodotti')">
          Annulla
        </button>
        <button type="submit" class="submit-button" form="productForm"
          :disabled="!newProduct.title || !newProduct.description || isSubmitting">
          <span v-if="isSubmitting">Salvataggio in corso...</span>
          <span v-else>Crea Prodotto</span>
        </button>
      </div>
    </div>

    <div class="form-container">
      <form id="productForm" @submit.prevent="submitProduct">
        <div class="form-section">
          <div class="form-column">
            <div class="form-group">
              <label>Nome Prodotto *</label>
              <input v-model="newProduct.title" type="text" required placeholder="Es. Panino con tonno" />
            </div>

            <div class="form-group">
              <label>Descrizione *</label>
              <textarea v-model="newProduct.description" required placeholder="Descrivi il prodotto..." rows="4" />
            </div>

            <div class="form-group short-input">
              <label>Prezzo (€) *</label>
              <input v-model.number="newProduct.price" type="number" min="0" step="0.01" required placeholder="0.00" />
            </div>

            <div class="form-group short-input">
              <label>Quantità *</label>
              <input v-model.number="newProduct.quantity" type="number" min="0" required placeholder="0" />
            </div>

            <div class="form-group switch-group">
              <label>Prodotto Attivo</label>
              <label class="switch">
                <input v-model="newProduct.isActive" type="checkbox" />
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <div class="form-column">
            <div class="form-group">
              <label>Immagine del Prodotto</label>
              <div class="image-upload-card">
                <label class="upload-label">
                  <input type="file" accept="image/*" @change="handleImageUpload" hidden />
                  <div v-if="imagePreview" class="image-preview">
                    <img :src="imagePreview" alt="Anteprima immagine" />
                    <div class="overlay">Cambia Immagine</div>
                  </div>
                  <div v-else class="upload-placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                    <p>Clicca per caricare un'immagine</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="form-group ingredients-section">
            <h4>Ingredienti</h4>
            <div class="scroll-container">
              <ul v-if="filtersStore.allIngredients.length > 0">
                <li v-for="ingredient in filtersStore.allIngredients" :key="ingredient">
                  <label class="ingredient-item">
                    <input type="checkbox" :value="ingredient" v-model="newProduct.ingredients"
                      :disabled="isSubmitting" />
                    {{ ingredient }}
                  </label>
                </li>
              </ul>
              <p v-else class="no-items">Nessun ingrediente disponibile</p>
            </div>
          </div>

          <div class="form-group tags-section">
            <h4>Tag</h4>
            <div class="scroll-container">
              <ul v-if="filtersStore.allTags.length > 0">
                <li v-for="tag in filtersStore.allTags" :key="tag">
                  <label class="tag-item">
                    <input type="checkbox" :value="tag" v-model="newProduct.tags" :disabled="isSubmitting" />
                    {{ tag }}
                  </label>
                </li>
              </ul>
              <p v-else class="no-items">Nessun tag disponibile</p>
            </div>
          </div>
        </div>

      </form>
    </div>
  </div>
</template>

<style scoped>
.add-product-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-header {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.8rem 0;
  background: var(--color-background-soft);
  border-radius: 8px;
}

.back-button {
  background: none;
  border: none;
  color: var(--poldo-primary);
  cursor: pointer;
  font-size: 1rem;
  align-items: center;
}

h1 {
  color: var(--poldo-primary);
  font-size: 2rem;
  padding: 0 1.5rem;
}

.form-container {
  background: var(--color-background-soft);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  flex-grow: 1;
  overflow: hidden;
  display: flex;
}

form {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.form-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.form-column {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: 0.5rem;
}

label {
  display: block;
  margin-bottom: 0.6rem;
  font-weight: 600;
  color: var(--poldo-primary);
  font-size: 0.95rem;
}

input[type="text"],
input[type="number"],
textarea {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.form-group.short-input input {
  width: 50%;
  max-width: auto;
}

.form-group.short-input {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

input[type="text"]:focus,
input[type="number"]:focus,
textarea:focus {
  outline: none;
  border-color: var(--poldo-primary);
  box-shadow: 0 0 0 2px rgba(239, 194, 12, 0.2);
}

textarea {
  resize: vertical;
  min-height: 90px;
  font-size: 0.9rem;
}

.image-upload-card {
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  transition: all 0.3s ease;
  height: 100%;
}

.image-upload-card:hover {
  border-color: var(--poldo-primary);
  background: rgba(239, 194, 12, 0.05);
}

.upload-label {
  cursor: pointer;
  display: block;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
  color: var(--color-text-soft);
  padding: 1.5rem;
}

.upload-placeholder svg {
  width: 36px;
  height: 36px;
  fill: var(--color-text-soft);
}

.image-preview {
  position: relative;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.image-preview img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.6rem;
  font-size: 0.8rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-preview:hover .overlay {
  opacity: 1;
}

.ingredients-section,
.tags-section {
  background: var(--color-background);
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid var(--color-border);
  height: 100%;
}

.scroll-container {
  max-height: 200px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.scroll-container::-webkit-scrollbar {
  width: 6px;
}

.scroll-container::-webkit-scrollbar-track {
  background: var(--color-background-soft);
  border-radius: 3px;
}

.scroll-container::-webkit-scrollbar-thumb {
  background: var(--poldo-primary);
  border-radius: 3px;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  padding: 0.6rem;
  margin: 0.4rem 0;
  background: var(--color-background-soft);
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--poldo-primary);
  flex-shrink: 0;
}

.no-items {
  text-align: center;
  color: var(--color-text-soft);
  padding: 1rem;
  font-style: italic;
  font-size: 0.9rem;
}

.switch-group {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-top: 0.8rem;
}

.switch {
  position: relative;
  display: inline-block;
  width: 42px;
  height: 22px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked+.slider {
  background-color: var(--poldo-primary);
}

input:checked+.slider:before {
  transform: translateX(20px);
}

.form-actions {
  display: flex;
  background: var(--color-background-soft);
  padding: 1rem 0;
  gap: 0.75rem;
}

.cancel-button {
  background: var(--color-background-soft);
  color: var(--color-text);
  padding: 0.6rem 1.2rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.cancel-button:hover {
  border-color: var(--poldo-primary);
}

.submit-button {
  background: var(--poldo-primary);
  color: white;
  padding: 0.6rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.submit-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  background: var(--color-border);
}

@media (max-width: 768px) {
  .add-product-page {
    height: 100dvh;
    min-height: 100vh;
    padding: 0.8rem;
  }

  .page-header {
    padding: 0.6rem;
  }

  .back-button {
    position: static;
    transform: none;
    margin-bottom: 0.5rem;
    width: 100%;
    justify-content: center;
  }

  h1 {
    font-size: 1.2rem;
    padding: 0 0.5rem;
  }

  .form-container {
    padding: 1rem;
  }

  .image-preview img {
    height: 160px;
  }

  .scroll-container {
    max-height: 150px;
  }

  .form-section {
    grid-template-columns: 1fr;
  }
}
</style>
