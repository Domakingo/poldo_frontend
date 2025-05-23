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
  isActive: boolean,
  bevanda: boolean
}

async function handleRequest<T>(
  endpoint: string,
  errorMsg: string,
  init?: RequestInit
): Promise<T> {
  const url = `${API_CONFIG.BASE_URL}/${endpoint}`;
  try {
    const response = await fetch(url, { credentials: 'include', ...init, mode: 'cors' });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${errorMsg}: ${response.status} — ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await response.json();
    }
    return {} as T;

  } catch (error: any) {
    console.error('Request failed:', error);
    throw new Error(`${errorMsg}: ${error.message}`);
  }
}

export const useProductsStore = defineStore('products', () => {
  const products = ref<Product[]>([])
  const defaultImageBlobUrl = {
    cibo: "/cibo.svg",
    bevanda: "/bevanda.svg"
  }

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


   const initializeProducts = async () => {
    try {


      const raw = await handleRequest<any[]>(
        'prodotti',
        'Errore fetch prodotti'
      )

      products.value = await Promise.all(raw.map(async (item) => {
        const productImageUrl = `${API_CONFIG.BASE_URL}/prodotti/image/${item.idProdotto}`
        const imageExists = await checkImageExists(productImageUrl)

        return {
          id: item.idProdotto,
          title: item.nome,
          description: item.descrizione,
          ingredients: item.ingredienti,
          imageSrc: imageExists ? productImageUrl : item.bevanda === 1 ? defaultImageBlobUrl.bevanda : defaultImageBlobUrl.cibo,
          price: parseFloat(item.prezzo),
          quantity: item.quantita,
          disponibility: item.disponibilita,
          tags: item.tags,
          isActive: item.attivo === 1,
          bevanda: item.bevanda === 1
        }
      }))
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  async function checkImageExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, {
        credentials: 'include'
      })
      return response.ok
    } catch {
      return false
    }
  }

  initializeProducts().catch(error =>
    console.error('Auto-initialization error:', error)
  )

  const getProductById = (id: number) => {
    return products.value.find(product => product.id === id)
  }

  return {
    products,
    allIngredients,
    allTags,
    initializeProducts,
    getProductById
  }
})
