import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { API_CONFIG } from '@/utils/api'

export interface Product {
  id: number
  title: string
  description: string
  ingredients: string[]
  imageSrc: string
  price: number
  quantity: number
  disponibility: number
  tags: string[]
  isActive: boolean
  bevanda: boolean
}


export const useGestioneProductsStore = defineStore('gestioneProducts', () => {
  // Stato
  const products = ref<Product[]>([])

  // Getter
  const allIngredients = computed(() => {
    const ingredients = new Set<string>()
    products.value.forEach(product => {
      product.ingredients.forEach(ing => ingredients.add(ing))
    })
    return Array.from(ingredients)
  })

  const allTags = computed(() => {
    const tags = new Set<string>()
    products.value.forEach(product => {
      product.tags.forEach(tag => tags.add(tag))
    })
    return Array.from(tags)
  })

  // Metodi
  const getProductById = (id: number) => {
    return products.value.find(product => product.id === id)
  }

  const initializeProducts = async () => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/ordini/prodotti`,
        { credentials: 'include' }
      );
      const raw = await response.json();

      products.value = await Promise.all(
        raw.map(async (item) => {
          return {
            id: item.idProdotto,
            title: item.nome,
            description: item.descrizione,
            ingredients: item.ingredienti,
            price: parseFloat(item.prezzo),
            quantity: item.quantita,
            tags: item.tags,
            isActive: item.attivo === 1
          };
        })
      );

    } catch (err) {
      console.error(err);
      throw err;
    }
  };


  return {
    products,
    allIngredients,
    allTags,
    getProductById,
    initializeProducts
  }
})
